import type { ColumnLayout, TextBlock } from './types.js';

function kMeans1D(values: number[], k: number, iterations = 20): number[] {
  if (values.length === 0) return [];
  if (k <= 1) return [values.reduce((a, b) => a + b, 0) / values.length];

  const sorted = [...values].sort((a, b) => a - b);
  const step = Math.max(1, Math.floor(sorted.length / k));
  let centers = Array.from({ length: k }, (_, i) => sorted[Math.min(i * step, sorted.length - 1)]);

  for (let iter = 0; iter < iterations; iter++) {
    const groups: number[][] = Array.from({ length: k }, () => []);
    for (const v of values) {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < centers.length; i++) {
        const d = Math.abs(v - centers[i]);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      groups[best].push(v);
    }
    centers = centers.map((c, i) =>
      groups[i].length > 0 ? groups[i].reduce((a, b) => a + b, 0) / groups[i].length : c,
    );
  }

  return centers.sort((a, b) => a - b);
}

function countHistogramPeaks(values: number[], pageWidth: number, bins = 28): number {
  if (values.length < 4) return 1;
  const histogram = new Array(bins).fill(0);
  for (const x of values) {
    const bin = Math.min(bins - 1, Math.floor((x / pageWidth) * bins));
    histogram[bin]++;
  }
  let peaks = 0;
  const minCount = Math.max(2, Math.floor(values.length * 0.04));
  for (let i = 1; i < bins - 1; i++) {
    if (histogram[i] >= minCount && histogram[i] >= histogram[i - 1] && histogram[i] > histogram[i + 1]) {
      peaks++;
    }
  }
  return Math.max(peaks, 1);
}

function countGapClusters(values: number[], pageWidth: number): number {
  if (values.length < 4) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const minGap = pageWidth * 0.06;
  let clusters = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] > minGap) clusters++;
  }
  return clusters;
}

/** Dynamically detect 1–6 columns from X distribution of structural blocks. */
export function detectColumns(blocks: TextBlock[], pageWidth: number): ColumnLayout[] {
  const structural = blocks.filter(
    (b) => b.type === 'category' || b.type === 'product' || b.type === 'description',
  );
  const xs = (structural.length >= 3 ? structural : blocks.filter((b) => b.type !== 'price')).map(
    (b) => b.center.x,
  );

  if (xs.length < 2) {
    return [{ index: 0, left: 0, right: pageWidth, centerX: pageWidth / 2 }];
  }

  const categories = blocks.filter((b) => b.type === 'category');
  if (categories.length === 2) {
    const catXs = categories.map((c) => c.center.x);
    const min = Math.min(...catXs);
    const max = Math.max(...catXs);
    if (max - min >= pageWidth * 0.28) {
      const left = catXs.filter((x) => x < pageWidth * 0.45).length;
      const right = catXs.filter((x) => x >= pageWidth * 0.45).length;
      if (left > 0 && right > 0) {
        return buildColumnsFromCount(blocks, pageWidth, 2);
      }
    }
  }

  const range = Math.max(...xs) - Math.min(...xs);
  if (range < pageWidth * 0.2) {
    return [{ index: 0, left: 0, right: pageWidth, centerX: pageWidth / 2 }];
  }

  const byPeaks = countHistogramPeaks(xs, pageWidth);
  const byGaps = countGapClusters(xs, pageWidth);
  const estimate = Math.min(Math.max(Math.round((byPeaks + byGaps) / 2), 1), 6);

  return buildColumnsFromCount(blocks, pageWidth, estimate);
}

function buildColumnsFromCount(
  blocks: TextBlock[],
  pageWidth: number,
  count: number,
): ColumnLayout[] {
  if (count <= 1) {
    return [{ index: 0, left: 0, right: pageWidth, centerX: pageWidth / 2 }];
  }

  const structural = blocks.filter(
    (b) => b.type === 'category' || b.type === 'product' || b.type === 'description',
  );
  const xs = (structural.length >= 2 ? structural : blocks.filter((b) => b.type !== 'price')).map(
    (b) => b.center.x,
  );
  const centers = kMeans1D(xs, count);
  const boundaries: number[] = [0];
  for (let i = 0; i < centers.length - 1; i++) {
    boundaries.push((centers[i] + centers[i + 1]) / 2);
  }
  boundaries.push(pageWidth);

  return centers.map((cx, index) => ({
    index,
    left: boundaries[index],
    right: boundaries[index + 1],
    centerX: cx,
  }));
}

export function assignBlocksToColumns(blocks: TextBlock[], columns: ColumnLayout[]): TextBlock[] {
  return blocks.map((block) => {
    let best = 0;
    let bestDist = Infinity;
    for (const col of columns) {
      const dist = Math.abs(block.center.x - col.centerX);
      if (dist < bestDist) {
        bestDist = dist;
        best = col.index;
      }
    }
    return { ...block, columnIndex: best };
  });
}
