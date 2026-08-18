import { randomUUID } from 'node:crypto';
import type { LayoutElement, PageLayout } from '../layout/types.js';
import type { TextBlock, TextBlockType } from './types.js';

function layoutTypeToBlockType(type: LayoutElement['type']): TextBlockType {
  switch (type) {
    case 'category':
      return 'category';
    case 'product':
      return 'product';
    case 'description':
      return 'description';
    case 'price':
      return 'price';
    case 'title':
      return 'title';
    default:
      return 'unknown';
  }
}

export function layoutElementToTextBlock(el: LayoutElement): TextBlock {
  return {
    id: el.id || randomUUID(),
    text: el.text,
    bbox: { x: el.x, y: el.y, width: el.width, height: el.height },
    center: { x: el.x + el.width / 2, y: el.y + el.height / 2 },
    confidence: el.confidence ?? 0.75,
    pageIndex: el.pageIndex,
    type: layoutTypeToBlockType(el.type),
    columnIndex: el.columnIndex,
  };
}

export function pageLayoutsToTextBlocks(pages: PageLayout[]): TextBlock[] {
  const blocks: TextBlock[] = [];
  for (const page of pages) {
    for (const el of page.elements) {
      blocks.push(layoutElementToTextBlock(el));
    }
  }
  return blocks;
}

export function sortBlocksSpatially(blocks: TextBlock[]): TextBlock[] {
  return [...blocks].sort(
    (a, b) =>
      a.pageIndex - b.pageIndex ||
      a.center.y - b.center.y ||
      a.center.x - b.center.x,
  );
}
