import { randomUUID } from 'node:crypto';
import type { ConfidenceLevel, MenuImportDraft } from '../../../types/menu-import.js';
import type { LayoutElement, PageLayout, ProductGroup, SpatialParseResult } from './types.js';
import { classifyElements } from './classify.js';
import {
  assignElementsToColumns,
  buildColumns,
  detectColumnCount,
} from './columns.js';
import { detectAllSections } from './sections.js';
import { groupProductsInSection, productBlockElements, toProductGroup } from './price-associator.js';
import { normalizeBBox, unionBBox } from './bbox.js';
import { isFooterText, isGarbageText } from './classify.js';

function isLikelyGarbageProductName(name: string): boolean {
  if (isGarbageText(name) || isFooterText(name)) return true;
  if (name.length <= 3 && !/^[XH]-/i.test(name) && !/\d/.test(name)) {
    return true;
  }
  const letters = name.replace(/[^a-zA-ZÀ-ú]/g, '');
  if (letters.length === 0) return true;
  const vowels = (letters.match(/[aeiouáéíóúàèìòùâêîôûãõAEIOU]/gi) ?? []).length;
  if (letters.length > 14 && vowels / letters.length < 0.32) return true;
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(name)) return true;
  if (name.length > 40 && name.split(/\s+/).length <= 2) return true;
  return false;
}

function scoreToLevel(score: number): ConfidenceLevel {
  if (score >= 0.85) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

export function parseSpatialLayout(page: PageLayout): SpatialParseResult {
  const classified = classifyElements(page.elements);
  const columnCount = detectColumnCount(classified, page.width);
  const columns = buildColumns(classified, page.width);
  const assigned = assignElementsToColumns(classified, columns);
  const sections = detectAllSections(assigned, columns, page.height);

  const products: ProductGroup[] = [];

  for (const section of sections) {
    const column = columns.find((c) => c.index === section.columnIndex) ?? columns[0];
    const drafts = groupProductsInSection(
      section.elements,
      section.name,
      section.columnIndex,
      column,
      page.height,
    );
    for (const draft of drafts) {
      products.push(toProductGroup(draft));
    }
  }

  return {
    pageWidth: page.width,
    pageHeight: page.height,
    columnCount,
    sections,
    products,
  };
}

export function spatialResultToDraft(result: SpatialParseResult): MenuImportDraft {
  const categoriesMap = new Map<
    string,
    {
      id: string;
      name: string;
      confidenceScore: number;
      products: MenuImportDraft['categories'][0]['products'];
    }
  >();

  const warnings: string[] = [];

  for (const group of result.products) {
    if (isLikelyGarbageProductName(group.name)) continue;

    const key = `${group.columnIndex}::${group.sectionName}`;
    if (!categoriesMap.has(key)) {
      categoriesMap.set(key, {
        id: randomUUID(),
        name: group.sectionName,
        confidenceScore: 0.9,
        products: [],
      });
    }

    const cat = categoriesMap.get(key)!;
    const blockEls = productBlockElements(group);
    const rawBbox = unionBBox(blockEls, group.nameElement.pageIndex);
    const bbox = rawBbox
      ? normalizeBBox(rawBbox, result.pageWidth, result.pageHeight)
      : undefined;

    const descBboxRaw = unionBBox(group.descriptionElements, group.nameElement.pageIndex);
    const priceBboxRaw = group.priceElement
      ? unionBBox([group.priceElement], group.nameElement.pageIndex)
      : undefined;

    if (group.needsReview && group.reviewReason) {
      warnings.push(`${group.reviewReason} — "${group.name}".`);
    }

    cat.products.push({
      id: randomUUID(),
      name: group.name,
      description:
        group.descriptionElements.length > 0
          ? group.descriptionElements
              .map((e) => e.text)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 300)
          : null,
      price: group.price,
      confidence: scoreToLevel(group.confidenceScore),
      confidenceScore: group.confidenceScore,
      needsReview: group.needsReview,
      reviewReason: group.reviewReason,
      selected: true,
      categoryId: cat.id,
      bbox,
      descriptionBbox: descBboxRaw
        ? normalizeBBox(descBboxRaw, result.pageWidth, result.pageHeight)
        : undefined,
      priceBbox: priceBboxRaw
        ? normalizeBBox(priceBboxRaw, result.pageWidth, result.pageHeight)
        : undefined,
    });
  }

  const categories = [...categoriesMap.values()]
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      confidence: scoreToLevel(cat.confidenceScore),
      confidenceScore: cat.confidenceScore,
      selected: true,
      products: cat.products.map((p) => ({ ...p, categoryId: cat.id })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (categories.length === 0) {
    warnings.push('Não conseguimos identificar o texto desta imagem.');
  }

  return {
    categories,
    additionalGroups: [],
    warnings,
    layoutMeta: {
      pageWidth: result.pageWidth,
      pageHeight: result.pageHeight,
      columnCount: result.columnCount,
    },
  };
}

export function parseMenuFromPages(pages: PageLayout[]): MenuImportDraft {
  const allProducts: ProductGroup[] = [];
  const allSections: SpatialParseResult['sections'] = [];
  let pageWidth = 0;
  let pageHeight = 0;
  let columnCount = 1;

  for (const page of pages) {
    const result = parseSpatialLayout(page);
    allProducts.push(...result.products);
    allSections.push(...result.sections);
    pageWidth = Math.max(pageWidth, result.pageWidth);
    pageHeight = Math.max(pageHeight, result.pageHeight);
    columnCount = Math.max(columnCount, result.columnCount);
  }

  return spatialResultToDraft({
    pageWidth,
    pageHeight,
    columnCount,
    sections: allSections,
    products: allProducts,
  });
}

/** Build synthetic page layout for tests. */
export function buildTestPage(
  elements: Array<Omit<LayoutElement, 'id' | 'type' | 'pageIndex'> & { type?: LayoutElement['type'] }>,
  width = 1000,
  height = 1400,
): PageLayout {
  return {
    pageIndex: 0,
    width,
    height,
    elements: elements.map((e) => ({
      id: randomUUID(),
      pageIndex: 0,
      type: e.type ?? 'other',
      text: e.text,
      x: e.x,
      y: e.y,
      width: e.width,
      height: e.height,
      confidence: e.confidence,
    })),
  };
}

export function reclassifyPage(page: PageLayout): PageLayout {
  return {
    ...page,
    elements: classifyElements(page.elements),
  };
}
