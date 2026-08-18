import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

/** Prepare menu images for OCR — invert dark menus, boost contrast, upscale. */
export async function preprocessMenuImageForOcr(filePath: string): Promise<string> {
  const meta = await sharp(filePath).metadata();
  const width = meta.width ?? 800;
  const scale = width < 1200 ? 2 : width < 1800 ? 1.5 : 1;

  const origStats = await sharp(filePath).grayscale().stats();
  const isDarkMenu = (origStats.channels[0]?.mean ?? 128) < 110;

  const pipeline = sharp(filePath).resize(Math.round(width * scale)).grayscale();
  const finalBuffer = isDarkMenu
    ? await pipeline.negate().normalize().sharpen().png().toBuffer()
    : await pipeline.normalize().sharpen().png().toBuffer();

  const outPath = path.join(os.tmpdir(), `menu-ocr-${randomUUID()}.png`);
  await fs.writeFile(outPath, finalBuffer);
  return outPath;
}

export async function cleanupPreprocessedImage(filePath: string | null): Promise<void> {
  if (!filePath || !filePath.includes('menu-ocr-')) return;
  await fs.unlink(filePath).catch(() => undefined);
}
