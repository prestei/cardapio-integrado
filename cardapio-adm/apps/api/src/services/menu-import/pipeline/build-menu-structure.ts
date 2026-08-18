import type { PageLayout } from '../layout/types.js';
import { classifyElements } from '../layout/classify.js';
import { sortBlocksSpatially, layoutElementToTextBlock } from './adapters.js';
import { detectColumns, assignBlocksToColumns } from './detect-columns.js';
import {
  classifyBlocks,
  detectPrices,
  enrichCategoryHints,
  normalizeBlockText,
} from './classify-blocks.js';
import { detectLayoutGaps, filterImageGapNoise } from './detect-layout-gaps.js';
import {
  assignBlocksToRegions,
  blocksInRegion,
  detectRegions,
  regionName,
} from './detect-regions.js';
import { buildProductCandidatesInRegion } from './associate.js';
import { categoryConfidence } from './confidence.js';
import type {
  ColumnLayout,
  LayoutGap,
  MenuRegion,
  ParsedMenu,
  ParsedMenuCategory,
  ParsedMenuProduct,
  PipelineDebugOverlay,
  PipelineResult,
  TextBlock,
} from './types.js';
import { isFooterText, isGarbageText } from '../layout/classify.js';

function isLikelyGarbageProductName(name: string): boolean {
  if (isGarbageText(name) || isFooterText(name)) return true;
  if (name.length <= 3 && !/^[XH]-/i.test(name) && !/\d/.test(name)) return true;
  const letters = name.replace(/[^a-zA-ZÀ-ú]/g, '');
  if (letters.length === 0) return true;
  const vowels = (letters.match(/[aeiouáéíóúàèìòùâêîôûãõAEIOU]/gi) ?? []).length;
  if (letters.length > 14 && vowels / letters.length < 0.32) return true;
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(name)) return true;
  return false;
}

function unionDescBbox(blocks: TextBlock[]) {
  const x0 = Math.min(...blocks.map((b) => b.bbox.x));
  const y0 = Math.min(...blocks.map((b) => b.bbox.y));
  const x1 = Math.max(...blocks.map((b) => b.bbox.x + b.bbox.width));
  const y1 = Math.max(...blocks.map((b) => b.bbox.y + b.bbox.height));
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/**
 * Central function: TextBlocks + layout → ParsedMenu
 */
export function buildMenuStructure(
  pages: PageLayout[],
  blocks?: TextBlock[],
): {
  parsed: ParsedMenu;
  blocks: TextBlock[];
  columns: ColumnLayout[];
  regions: MenuRegion[];
  gaps: LayoutGap[];
} {
  let pageWidth = 0;
  let pageHeight = 0;

  const rawBlocks =
    blocks ??
    pages.flatMap((page) => {
      pageWidth = Math.max(pageWidth, page.width);
      pageHeight = Math.max(pageHeight, page.height);
      return classifyElements(page.elements).map((el) => layoutElementToTextBlock(el));
    });

  if (pages.length > 0) {
    pageWidth = Math.max(pageWidth, ...pages.map((p) => p.width));
    pageHeight = Math.max(pageHeight, ...pages.map((p) => p.height));
  }

  let pipelineBlocks = sortBlocksSpatially(normalizeBlockText(rawBlocks));
  pipelineBlocks = detectPrices(pipelineBlocks);
  pipelineBlocks = classifyBlocks(pipelineBlocks);
  pipelineBlocks = enrichCategoryHints(pipelineBlocks);

  const columns = detectColumns(pipelineBlocks, pageWidth);
  pipelineBlocks = assignBlocksToColumns(pipelineBlocks, columns);

  const allGaps: LayoutGap[] = [];
  for (const col of columns) {
    allGaps.push(...detectLayoutGaps(pipelineBlocks, pageHeight, col.index));
  }
  pipelineBlocks = filterImageGapNoise(pipelineBlocks, allGaps);

  let regions = detectRegions(pipelineBlocks, columns, pageHeight);
  pipelineBlocks = assignBlocksToRegions(pipelineBlocks, regions);

  for (const region of regions) {
    const colBlocks = blocksInRegion(pipelineBlocks, region.id);
    const column = columns.find((c) => c.index === region.columnIndex) ?? columns[0];
    region.products = buildProductCandidatesInRegion(
      colBlocks,
      column,
      pageHeight,
      region.columnIndex,
    );
  }

  regions = regions.filter((r) => r.products.length > 0 || r.category);

  const categories: ParsedMenuCategory[] = [];
  const warnings: string[] = [];

  for (const region of regions) {
    const catName = regionName(region);
    if (catName === 'Geral' && region.products.length === 0) continue;

    const products: ParsedMenuProduct[] = [];

    for (const candidate of region.products) {
      if (!candidate.product) continue;
      const name = candidate.product.text.trim();
      if (isLikelyGarbageProductName(name)) continue;

      const priceVal = candidate.price?.priceValue ?? null;

      if (priceVal == null) {
        warnings.push(`Preço não identificado — "${name}".`);
      }

      products.push({
        name,
        description:
          candidate.descriptions.length > 0
            ? candidate.descriptions
                .map((d) => d.text)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 300)
            : undefined,
        price: priceVal,
        bbox: candidate.product.bbox,
        descriptionBbox:
          candidate.descriptions.length > 0
            ? unionDescBbox(candidate.descriptions)
            : undefined,
        priceBbox: candidate.price?.bbox,
        pageIndex: candidate.product.pageIndex,
        confidence: candidate.confidence,
        needsReview: candidate.needsReview,
        reviewReason: candidate.reviewReason,
        sourceBlockIds: {
          name: candidate.product.id,
          descriptions: candidate.descriptions.map((d) => d.id),
          price: candidate.price?.id,
        },
      });
    }

    if (products.length === 0 && !region.category) continue;

    categories.push({
      name: catName,
      bbox: region.category?.bbox ?? region.bbox,
      confidence: categoryConfidence(products.length, !!region.category),
      columnIndex: region.columnIndex,
      regionId: region.id,
      products,
    });
  }

  if (categories.length === 0) {
    warnings.push('Não conseguimos identificar o texto desta imagem.');
  }

  const parsed: ParsedMenu = {
    pageWidth,
    pageHeight,
    columnCount: columns.length,
    categories,
    warnings,
  };

  return { parsed, blocks: pipelineBlocks, columns, regions, gaps: allGaps };
}

export function buildDebugOverlay(
  blocks: TextBlock[],
  columns: ColumnLayout[],
  regions: MenuRegion[],
  gaps: LayoutGap[],
  pageWidth: number,
  pageHeight: number,
): PipelineDebugOverlay {
  return {
    enabled: true,
    blocks: blocks.map((b) => ({
      id: b.id,
      text: b.text.slice(0, 120),
      type: b.type,
      bbox: {
        pageIndex: b.pageIndex,
        x: (b.bbox.x / pageWidth) * 100,
        y: (b.bbox.y / pageHeight) * 100,
        w: (b.bbox.width / pageWidth) * 100,
        h: (b.bbox.height / pageHeight) * 100,
      },
      columnIndex: b.columnIndex,
      regionId: b.regionId,
    })),
    columns: columns.map((c) => ({
      index: c.index,
      leftPct: (c.left / pageWidth) * 100,
      rightPct: (c.right / pageWidth) * 100,
    })),
    regions: regions.map((r) => ({
      id: r.id,
      columnIndex: r.columnIndex,
      name: regionName(r),
      bbox: {
        pageIndex: 0,
        x: (r.bbox.x / pageWidth) * 100,
        y: (r.bbox.y / pageHeight) * 100,
        w: (r.bbox.width / pageWidth) * 100,
        h: (r.bbox.height / pageHeight) * 100,
      },
    })),
    gaps: gaps.map((g) => ({
      columnIndex: g.columnIndex,
      topPct: (g.top / pageHeight) * 100,
      bottomPct: (g.bottom / pageHeight) * 100,
      isImageGap: g.isImageGap,
    })),
  };
}

export function runPipelineOnPages(pages: PageLayout[]): PipelineResult {
  const { parsed, blocks, columns, regions, gaps } = buildMenuStructure(pages);
  const debug = buildDebugOverlay(
    blocks,
    columns,
    regions,
    gaps,
    parsed.pageWidth,
    parsed.pageHeight,
  );
  return { parsed, debug };
}
