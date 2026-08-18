import type { MenuImportDraft } from '../../types/menu-import.js';
import type { PageLayout } from './layout/types.js';
import { runMenuImportPipeline } from './pipeline/index.js';
import { parseMenuText } from './parser.service.js';

/** @deprecated Use runMenuImportPipeline */
export async function parseMenuFromSpatialPages(
  pages: PageLayout[],
  ocrText: string,
): Promise<MenuImportDraft> {
  return runMenuImportPipeline(pages, ocrText, {
    semanticValidation: true,
    debug: true,
  });
}

export { runMenuImportPipeline, parseMenuText };
