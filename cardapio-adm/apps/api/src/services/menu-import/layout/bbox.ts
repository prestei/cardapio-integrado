import type { ImportBBox } from '../../../types/menu-import.js';
import type { LayoutElement } from './types.js';
import { bottomY, rightX } from './classify.js';

export function unionBBox(elements: LayoutElement[], pageIndex: number): ImportBBox | undefined {
  if (elements.length === 0) return undefined;

  const x0 = Math.min(...elements.map((e) => e.x));
  const y0 = Math.min(...elements.map((e) => e.y));
  const x1 = Math.max(...elements.map((e) => rightX(e)));
  const y1 = Math.max(...elements.map((e) => bottomY(e)));

  return { pageIndex, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function normalizeBBox(
  bbox: ImportBBox,
  pageWidth: number,
  pageHeight: number,
): ImportBBox {
  return {
    pageIndex: bbox.pageIndex,
    x: (bbox.x / pageWidth) * 100,
    y: (bbox.y / pageHeight) * 100,
    w: (bbox.w / pageWidth) * 100,
    h: (bbox.h / pageHeight) * 100,
  };
}

export function denormalizePoint(
  xPct: number,
  yPct: number,
  pageWidth: number,
  pageHeight: number,
): { x: number; y: number } {
  return {
    x: (xPct / 100) * pageWidth,
    y: (yPct / 100) * pageHeight,
  };
}

export function pointInBBox(x: number, y: number, bbox: ImportBBox, pageW: number, pageH: number): boolean {
  const bx = (bbox.x / 100) * pageW;
  const by = (bbox.y / 100) * pageH;
  const bw = (bbox.w / 100) * pageW;
  const bh = (bbox.h / 100) * pageH;
  return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
}

export function bboxCenter(bbox: ImportBBox, pageW: number, pageH: number): { x: number; y: number } {
  return {
    x: ((bbox.x + bbox.w / 2) / 100) * pageW,
    y: ((bbox.y + bbox.h / 2) / 100) * pageH,
  };
}

export function distanceToBBox(x: number, y: number, bbox: ImportBBox, pageW: number, pageH: number): number {
  const bx = (bbox.x / 100) * pageW;
  const by = (bbox.y / 100) * pageH;
  const bw = (bbox.w / 100) * pageW;
  const bh = (bbox.h / 100) * pageH;
  const cx = Math.max(bx, Math.min(x, bx + bw));
  const cy = Math.max(by, Math.min(y, by + bh));
  return Math.hypot(x - cx, y - cy);
}
