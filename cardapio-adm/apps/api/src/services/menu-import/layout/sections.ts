import type { CategorySection, ColumnLayout, LayoutElement } from './types.js';
import { bottomY, detectCategoryLabel, isCategoryText } from './classify.js';
import { elementsInColumn } from './columns.js';

const IMAGE_GAP_RATIO = 0.12;

function isLargeVerticalGap(prev: LayoutElement, next: LayoutElement, pageHeight: number): boolean {
  const gap = next.y - bottomY(prev);
  return gap > pageHeight * IMAGE_GAP_RATIO;
}

export function detectCategorySections(
  columnElements: LayoutElement[],
  columnIndex: number,
  pageHeight: number,
): CategorySection[] {
  const sorted = [...columnElements].sort((a, b) => a.y - b.y || a.x - b.x);
  const sections: CategorySection[] = [];
  let current: CategorySection | null = null;

  for (const el of sorted) {
    if (el.type === 'category' || isCategoryText(el.text)) {
      if (current) sections.push(current);
      current = {
        name: detectCategoryLabel(el.text) ?? el.text.trim(),
        nameElement: el,
        columnIndex,
        top: el.y,
        bottom: bottomY(el),
        elements: [],
      };
      continue;
    }

    if (!current) {
      if (el.type === 'product' || el.type === 'description' || el.type === 'price') {
        current = {
          name: 'Geral',
          nameElement: el,
          columnIndex,
          top: el.y,
          bottom: bottomY(el),
          elements: [],
        };
      } else {
        continue;
      }
    }

    if (current.elements.length > 0) {
      const prev = current.elements[current.elements.length - 1];
      if (isLargeVerticalGap(prev, el, pageHeight)) {
        // Large gap (likely image) — keep same section
      }
    }

    current.elements.push(el);
    current.bottom = Math.max(current.bottom, bottomY(el));
  }

  if (current) sections.push(current);
  return sections.filter((s) => s.elements.length > 0 || s.name !== 'Geral');
}

export function detectAllSections(
  elements: LayoutElement[],
  columns: ColumnLayout[],
  pageHeight: number,
): CategorySection[] {
  const all: CategorySection[] = [];
  for (const col of columns) {
    const colElements = elementsInColumn(elements, col.index);
    const sections = detectCategorySections(colElements, col.index, pageHeight);
    all.push(...sections);
  }
  return all.sort((a, b) => a.columnIndex - b.columnIndex || a.top - b.top);
}
