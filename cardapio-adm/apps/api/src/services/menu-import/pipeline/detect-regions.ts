import { randomUUID } from 'node:crypto';
import type { BoundingBox, ColumnLayout, MenuRegion, TextBlock } from './types.js';
import { detectCategoryLabel, isCategoryText } from '../layout/classify.js';

function bottomY(b: TextBlock): number {
  return b.bbox.y + b.bbox.height;
}

function unionBbox(blocks: TextBlock[]): BoundingBox {
  const x0 = Math.min(...blocks.map((b) => b.bbox.x));
  const y0 = Math.min(...blocks.map((b) => b.bbox.y));
  const x1 = Math.max(...blocks.map((b) => b.bbox.x + b.bbox.width));
  const y1 = Math.max(...blocks.map((b) => b.bbox.y + b.bbox.height));
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

function finalizeColumnRegions(columnRegions: MenuRegion[], pageHeight: number): MenuRegion[] {
  const sorted = [...columnRegions].sort((a, b) => a.bbox.y - b.bbox.y);
  return sorted.map((region, index) => {
    const yTop = region.category?.bbox.y ?? region.bbox.y;
    const nextTop = sorted[index + 1]?.category?.bbox.y ?? sorted[index + 1]?.bbox.y;
    const yBottom = nextTop != null ? nextTop - 4 : pageHeight;
    return { ...region, yTop, yBottom };
  });
}

/** Split each column into vertical regions separated by category headers. */
export function detectRegions(
  blocks: TextBlock[],
  columns: ColumnLayout[],
  pageHeight: number,
): MenuRegion[] {
  const regions: MenuRegion[] = [];

  for (const col of columns) {
    const colBlocks = blocks
      .filter((b) => b.columnIndex === col.index)
      .sort((a, b) => a.bbox.y - b.bbox.y || a.bbox.x - b.bbox.x);

    const columnRegions: MenuRegion[] = [];
    let current: MenuRegion | null = null;

    for (const block of colBlocks) {
      const isCategory =
        block.type === 'category' || isCategoryText(block.text) || detectCategoryLabel(block.text);

      if (isCategory) {
        if (current) columnRegions.push(current);
        const name = detectCategoryLabel(block.text) ?? block.text.trim();
        current = {
          id: randomUUID(),
          columnIndex: col.index,
          bbox: { ...block.bbox },
          yTop: block.bbox.y,
          yBottom: pageHeight,
          category: { ...block, text: name, type: 'category' },
          products: [],
        };
        continue;
      }

      if (!current) {
        current = {
          id: randomUUID(),
          columnIndex: col.index,
          bbox: { ...block.bbox },
          yTop: block.bbox.y,
          yBottom: pageHeight,
          category: undefined,
          products: [],
        };
      }

      current.bbox = unionRegionBbox(current.bbox, block.bbox);
    }

    if (current) columnRegions.push(current);
    regions.push(...finalizeColumnRegions(columnRegions, pageHeight));
  }

  return regions.filter((r) => r.category || countRegionBlocks(blocks, r) > 0);
}

function unionRegionBbox(a: BoundingBox, b: BoundingBox): BoundingBox {
  const x0 = Math.min(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const x1 = Math.max(a.x + a.width, b.x + b.width);
  const y1 = Math.max(a.y + a.height, b.y + b.height);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

function countRegionBlocks(blocks: TextBlock[], region: MenuRegion): number {
  return blocks.filter(
    (b) =>
      b.columnIndex === region.columnIndex &&
      b.bbox.y >= region.bbox.y - 2 &&
      b.type !== 'category',
  ).length;
}

export function assignBlocksToRegions(blocks: TextBlock[], regions: MenuRegion[]): TextBlock[] {
  return blocks.map((block) => {
    if (block.type === 'category') {
      const region = regions.find((r) => r.category?.id === block.id);
      return region ? { ...block, regionId: region.id } : block;
    }

    const cy = block.center.y;
    const cx = block.center.x;
    let best: MenuRegion | null = null;
    let bestScore = Infinity;

    for (const region of regions) {
      if (region.columnIndex !== block.columnIndex) continue;
      if (cy < region.yTop - 8) continue;
      if (cy > region.yBottom + 4) continue;

      const regionMidY = (region.yTop + region.yBottom) / 2;
      const distY = Math.abs(cy - regionMidY);
      const distX = Math.abs(cx - (region.bbox.x + region.bbox.width / 2));
      const score = distY + distX * 0.3;
      if (score < bestScore) {
        bestScore = score;
        best = region;
      }
    }

    return best ? { ...block, regionId: best.id } : block;
  });
}

export function blocksInRegion(blocks: TextBlock[], regionId: string): TextBlock[] {
  return blocks
    .filter((b) => b.regionId === regionId && b.type !== 'category')
    .sort((a, b) => a.bbox.y - b.bbox.y || a.bbox.x - b.bbox.x);
}

export function regionName(region: MenuRegion): string {
  return region.category?.text ?? 'Geral';
}
