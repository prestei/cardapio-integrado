import fs from 'node:fs/promises';
import { createWorker, PSM } from 'tesseract.js';
import { logger } from '../../lib/logger.js';
import type { PageLayout } from './layout/types.js';
import { createElement } from './layout/classify.js';
import { isStandalonePrice } from './price.utils.js';
import {
  cleanupPreprocessedImage,
  preprocessMenuImageForOcr,
} from './image-preprocess.js';

export interface OcrLine {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface OcrWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  confidence?: number;
}

function mergeWordBoxes(words: OcrWord[]): OcrWord {
  const text = words
    .map((w) => w.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  const x0 = Math.min(...words.map((w) => w.x0));
  const y0 = Math.min(...words.map((w) => w.y0));
  const x1 = Math.max(...words.map((w) => w.x1));
  const y1 = Math.max(...words.map((w) => w.y1));
  const confidence =
    words.reduce((sum, w) => sum + (w.confidence ?? 0), 0) / Math.max(words.length, 1);
  return { text, x0, y0, x1, y1, confidence };
}

/** Group OCR words into lines, then split lines at large horizontal gaps. */
export function segmentWordsIntoElements(words: OcrWord[], pageWidth: number): OcrWord[] {
  if (words.length === 0) return [];

  const splitX = pageWidth * 0.46;
  const left = words.filter((w) => (w.x0 + w.x1) / 2 < splitX);
  const right = words.filter((w) => (w.x0 + w.x1) / 2 >= splitX);

  return [
    ...segmentWordsInBand(left, splitX),
    ...segmentWordsInBand(right, pageWidth - splitX),
  ];
}

function segmentWordsInBand(words: OcrWord[], bandWidth: number): OcrWord[] {
  if (words.length === 0) return [];

  const sorted = [...words].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
  const lines: OcrWord[][] = [];

  for (const word of sorted) {
    const cy = (word.y0 + word.y1) / 2;
    const h = Math.max(word.y1 - word.y0, 8);
    let placed = false;

    for (const line of lines) {
      const ref = line[0];
      const refCy = (ref.y0 + ref.y1) / 2;
      const refH = Math.max(ref.y1 - ref.y0, 8);
      if (Math.abs(cy - refCy) <= Math.max(h, refH) * 0.65) {
        line.push(word);
        placed = true;
        break;
      }
    }

    if (!placed) lines.push([word]);
  }

  const gapThreshold = Math.max(14, bandWidth * 0.06);
  const segments: OcrWord[] = [];

  for (const line of lines) {
    line.sort((a, b) => a.x0 - b.x0);
    let current: OcrWord[] = [line[0]];

    for (let i = 1; i < line.length; i++) {
      const prev = line[i - 1];
      const curr = line[i];
      if (curr.x0 - prev.x1 > gapThreshold) {
        segments.push(mergeWordBoxes(current));
        current = [curr];
      } else {
        current.push(curr);
      }
    }

    segments.push(mergeWordBoxes(current));
  }

  return segments.filter((s) => s.text.length >= 2);
}

function collectWordsFromOcr(data: {
  blocks?: Array<{
    paragraphs?: Array<{
      lines?: Array<{
        text?: string;
        bbox: { x0: number; y0: number; x1: number; y1: number };
        words?: Array<{
          text?: string;
          bbox: { x0: number; y0: number; x1: number; y1: number };
          confidence?: number;
        }>;
      }>;
    }>;
  }>;
}): OcrWord[] {
  const words: OcrWord[] = [];

  for (const block of data.blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        if (line.words?.length) {
          for (const word of line.words) {
            const text = word.text?.trim();
            if (!text) continue;
            words.push({
              text,
              x0: word.bbox.x0,
              y0: word.bbox.y0,
              x1: word.bbox.x1,
              y1: word.bbox.y1,
              confidence: word.confidence,
            });
          }
          continue;
        }

        const lineText = line.text?.replace(/\s+/g, ' ').trim();
        if (lineText && lineText.length >= 2) {
          words.push({
            text: lineText,
            x0: line.bbox.x0,
            y0: line.bbox.y0,
            x1: line.bbox.x1,
            y1: line.bbox.y1,
          });
        }
      }
    }
  }

  return words;
}

async function extractPdfText(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      const text = result.text?.trim() ?? '';
      if (text.length >= 30) {
        return text;
      }
      return '';
    } finally {
      await parser.destroy();
    }
  } catch (err) {
    logger.warn({ err, filePath }, 'Falha ao extrair texto do PDF');
    return '';
  }
}

async function ocrImagePageLayout(filePath: string, pageIndex: number): Promise<PageLayout | null> {
  const worker = await createWorker('por');
  let preprocessedPath: string | null = null;

  try {
    preprocessedPath = await preprocessMenuImageForOcr(filePath);
    const ocrSource = preprocessedPath;

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      user_defined_dpi: '300',
    });
    const { data } = await worker.recognize(ocrSource, {}, { blocks: true, text: true });
    const elements: ReturnType<typeof createElement>[] = [];
    const seen = new Set<string>();

    const words = collectWordsFromOcr({ blocks: data.blocks ?? undefined });
    const pageWidthGuess =
      (data as { imageWidth?: number }).imageWidth ??
      (words.length > 0 ? Math.max(...words.map((w) => w.x1), 800) : 800);
    const segments = segmentWordsIntoElements(words, pageWidthGuess);

    const addElement = (text: string, x0: number, y0: number, x1: number, y1: number, confidence?: number) => {
      const key = `${text}:${Math.round(x0)}:${Math.round(y0)}:${Math.round(x1)}`;
      if (seen.has(key)) return;
      seen.add(key);
      elements.push(createElement(text, x0, y0, x1, y1, pageIndex, confidence));
    };

    for (const seg of segments) {
      addElement(seg.text, seg.x0, seg.y0, seg.x1, seg.y1, seg.confidence);
    }

    for (const word of words) {
      if (isStandalonePrice(word.text) && word.text.length <= 10) {
        addElement(word.text, word.x0, word.y0, word.x1, word.y1, word.confidence);
      }
    }

    if (elements.length === 0 && data.text) {
      for (const [i, rawLine] of data.text.split(/\r?\n/).entries()) {
        const text = rawLine.trim();
        if (text.length >= 2) {
          elements.push(createElement(text, 0, i * 24, 400, i * 24 + 20, pageIndex));
        }
      }
    }

    if (elements.length === 0) return null;

    const pageWidth =
      (data as { imageWidth?: number }).imageWidth ??
      Math.max(...elements.map((e) => e.x + e.width), 800);
    const pageHeight =
      (data as { imageHeight?: number }).imageHeight ??
      Math.max(...elements.map((e) => e.y + e.height), 1000);

    return {
      pageIndex,
      width: pageWidth,
      height: pageHeight,
      elements,
    };
  } finally {
    await worker.terminate();
    await cleanupPreprocessedImage(preprocessedPath);
  }
}

export async function extractPageLayoutsFromFile(
  filePath: string,
  mimeType: string,
  pageIndex: number,
): Promise<PageLayout | null> {
  if (mimeType.startsWith('image/')) {
    return ocrImagePageLayout(filePath, pageIndex);
  }
  return null;
}

export async function extractPageLayoutsFromFiles(
  files: Array<{ path: string; mimeType: string; pageIndex: number }>,
): Promise<PageLayout[]> {
  const pages: PageLayout[] = [];
  const sorted = [...files].sort((a, b) => a.pageIndex - b.pageIndex);

  for (const file of sorted) {
    const page = await extractPageLayoutsFromFile(file.path, file.mimeType, file.pageIndex);
    if (page) pages.push(page);
  }

  return pages;
}

export async function extractTextFromFile(
  filePath: string,
  mimeType: string,
): Promise<string> {
  if (mimeType === 'application/pdf') {
    const pdfText = await extractPdfText(filePath);
    if (pdfText.length >= 30) {
      return pdfText;
    }
    return '';
  }

  if (mimeType.startsWith('image/')) {
    const page = await ocrImagePageLayout(filePath, 0);
    if (!page) return '';
    return page.elements
      .sort((a, b) => a.y - b.y)
      .map((e) => e.text)
      .join('\n');
  }

  return '';
}

export async function extractTextFromFiles(
  files: Array<{ path: string; mimeType: string; pageIndex: number }>,
): Promise<string> {
  const parts: string[] = [];
  const sorted = [...files].sort((a, b) => a.pageIndex - b.pageIndex);
  for (const file of sorted) {
    const text = await extractTextFromFile(file.path, file.mimeType);
    if (text) parts.push(text);
  }
  return parts.join('\n\n---\n\n').trim();
}

export function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString() === '%PDF') {
    return 'application/pdf';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString() === 'RIFF' &&
    buffer.subarray(8, 12).toString() === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export async function validateFileIntegrity(filePath: string, mimeType: string): Promise<void> {
  const buffer = await fs.readFile(filePath);
  const detected = detectMimeFromBuffer(buffer);
  if (detected && detected !== mimeType && !(mimeType === 'image/jpg' && detected === 'image/jpeg')) {
    throw new Error('Tipo de arquivo não corresponde ao conteúdo.');
  }

  if (mimeType === 'application/pdf' && buffer.length < 100) {
    throw new Error('PDF corrompido ou inválido.');
  }
}

export function getExtensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf':
      return '.pdf';
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.bin';
  }
}
