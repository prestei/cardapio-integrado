import type { LayoutGap, TextBlock } from './types.js';

function bottomY(b: TextBlock): number {
  return b.bbox.y + b.bbox.height;
}

/** Detect large vertical gaps (likely food photos) within each column. */
export function detectLayoutGaps(
  blocks: TextBlock[],
  pageHeight: number,
  columnIndex: number,
): LayoutGap[] {
  const colBlocks = blocks
    .filter((b) => b.columnIndex === columnIndex)
    .sort((a, b) => a.bbox.y - b.bbox.y);

  const gaps: LayoutGap[] = [];
  const threshold = pageHeight * 0.1;

  for (let i = 1; i < colBlocks.length; i++) {
    const prev = colBlocks[i - 1];
    const curr = colBlocks[i];
    const gap = curr.bbox.y - bottomY(prev);
    if (gap > threshold) {
      gaps.push({
        columnIndex,
        top: bottomY(prev),
        bottom: curr.bbox.y,
        isImageGap: gap > pageHeight * 0.12,
      });
    }
  }

  return gaps;
}

export function isBlockInImageGap(block: TextBlock, gaps: LayoutGap[]): boolean {
  const cy = block.center.y;
  const col = block.columnIndex ?? 0;
  return gaps.some(
    (g) =>
      g.isImageGap &&
      g.columnIndex === col &&
      cy > g.top + 4 &&
      cy < g.bottom - 4,
  );
}

/** Blocks inside image gaps should not become products (categories are always kept). */
export function filterImageGapNoise(blocks: TextBlock[], gaps: LayoutGap[]): TextBlock[] {
  return blocks.filter((b) => b.type === 'category' || !isBlockInImageGap(b, gaps));
}
