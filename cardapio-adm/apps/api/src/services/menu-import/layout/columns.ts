import type { ColumnLayout, LayoutElement } from './types.js';
import { centerX } from './classify.js';

function kMeans1D(values: number[], k: number, iterations = 15): number[] {
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
    centers = centers.map((c, i) => {
      if (groups[i].length === 0) return c;
      return groups[i].reduce((a, b) => a + b, 0) / groups[i].length;
    });
  }

  return centers.sort((a, b) => a - b);
}

function countHistogramPeaks(values: number[], pageWidth: number, bins = 24): number {
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
  const minGap = pageWidth * 0.07;
  let clusters = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] > minGap) clusters++;
  }
  return clusters;
}

export function detectColumnCount(elements: LayoutElement[], pageWidth: number): number {
  const categories = elements.filter((el) => el.type === 'category');
  if (categories.length >= 2) {
    const xs = categories.map(centerX);
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    if (max - min >= pageWidth * 0.3) {
      const left = xs.filter((x) => x < pageWidth * 0.45).length;
      const right = xs.filter((x) => x >= pageWidth * 0.45).length;
      if (left > 0 && right > 0) return 2;
    }
  }

  if (categories.length === 2) {
    const xs = categories.map(centerX);
    const range = Math.max(...xs) - Math.min(...xs);
    if (range >= pageWidth * 0.22) return 2;
  }

  const structural = elements.filter((el) => el.type === 'category' || el.type === 'product');
  const xs = structural.map(centerX);
  if (xs.length < 3) return 1;

  const range = Math.max(...xs) - Math.min(...xs);
  if (range < pageWidth * 0.22) return 1;

  const byPeaks = countHistogramPeaks(xs, pageWidth);
  const byGaps = countGapClusters(xs, pageWidth);

  const estimate = Math.round((byPeaks + byGaps) / 2);
  return Math.min(Math.max(estimate, 1), 6);
}

export function buildColumns(elements: LayoutElement[], pageWidth: number): ColumnLayout[] {
  const structural = elements.filter((el) => el.type === 'category' || el.type === 'product');
  const forCluster = structural.length >= 2 ? structural : elements;
  const count = detectColumnCount(forCluster, pageWidth);
  if (count <= 1) {
    return [{ index: 0, left: 0, right: pageWidth, centerX: pageWidth / 2 }];
  }

  const xs = forCluster.map(centerX);
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

export function assignColumnIndex(element: LayoutElement, columns: ColumnLayout[]): number {
  const cx = centerX(element);
  let best = 0;
  let bestDist = Infinity;
  for (const col of columns) {
    const dist = Math.abs(cx - col.centerX);
    if (dist < bestDist) {
      bestDist = dist;
      best = col.index;
    }
  }
  return best;
}

/** Prices may sit to the right of the product block — assign via nearest column center. */
export function assignElementsToColumns(
  elements: LayoutElement[],
  columns: ColumnLayout[],
): LayoutElement[] {
  return elements.map((el) => {
    if (el.type === 'price') {
      return { ...el, columnIndex: assignColumnIndex(el, columns) };
    }
    return {
      ...el,
      columnIndex: assignColumnIndex(el, columns),
    };
  });
}

export function elementsInColumn(elements: LayoutElement[], columnIndex: number): LayoutElement[] {
  return elements
    .filter((el) => el.columnIndex === columnIndex)
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

export function isInColumnBounds(element: LayoutElement, column: ColumnLayout): boolean {
  const cx = centerX(element);
  return cx >= column.left - 20 && cx <= column.right + 20;
}
