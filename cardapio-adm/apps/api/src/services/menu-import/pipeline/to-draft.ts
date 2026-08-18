import type { MenuImportDraft } from '../../../types/menu-import.js';
import type { ParsedMenu, PipelineDebugOverlay, PipelineResult } from './types.js';
import { scoreToLevel } from './confidence.js';
import { randomUUID } from 'node:crypto';

function bboxToImport(
  bbox: { x: number; y: number; width: number; height: number } | undefined,
  pageIndex: number,
  pageWidth: number,
  pageHeight: number,
) {
  if (!bbox) return undefined;
  return {
    pageIndex,
    x: (bbox.x / pageWidth) * 100,
    y: (bbox.y / pageHeight) * 100,
    w: (bbox.width / pageWidth) * 100,
    h: (bbox.height / pageHeight) * 100,
  };
}

export function parsedMenuToDraft(
  result: PipelineResult,
  options?: { includeDebug?: boolean },
): MenuImportDraft {
  const { parsed, debug } = result;
  const { pageWidth, pageHeight } = parsed;

  const categories = parsed.categories.map((cat) => {
    const catId = randomUUID();
    return {
      id: catId,
      name: cat.name,
      confidence: scoreToLevel(cat.confidence),
      confidenceScore: cat.confidence,
      selected: true,
      bbox: bboxToImport(cat.bbox, 0, pageWidth, pageHeight),
      products: cat.products.map((p) => ({
        id: randomUUID(),
        name: p.name,
        description: p.description ?? null,
        price: p.price ?? null,
        confidence: scoreToLevel(p.confidence.overall),
        confidenceScore: p.confidence.overall,
        needsReview: p.needsReview,
        reviewReason: p.reviewReason,
        selected: true,
        categoryId: catId,
        bbox: bboxToImport(p.bbox, p.pageIndex, pageWidth, pageHeight),
        descriptionBbox: bboxToImport(p.descriptionBbox, p.pageIndex, pageWidth, pageHeight),
        priceBbox: bboxToImport(p.priceBbox, p.pageIndex, pageWidth, pageHeight),
        confidenceBreakdown: p.confidence,
        sourceBlockIds: p.sourceBlockIds,
      })),
    };
  });

  const draft: MenuImportDraft = {
    categories,
    additionalGroups: [],
    warnings: parsed.warnings,
    layoutMeta: {
      pageWidth,
      pageHeight,
      columnCount: parsed.columnCount,
    },
  };

  if (options?.includeDebug !== false) {
    draft.debug = debug;
  }

  return draft;
}

export type { PipelineDebugOverlay };
