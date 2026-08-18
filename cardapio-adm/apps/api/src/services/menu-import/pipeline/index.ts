import type { PageLayout } from '../layout/types.js';
import type { MenuImportDraft } from '../../../types/menu-import.js';
import { runPipelineOnPages } from './build-menu-structure.js';
import { parsedMenuToDraft } from './to-draft.js';
import {
  applySemanticCorrections,
  validateMenuStructureWithAi,
} from './semantic-validation.js';
import { isDraftUsable, scoreMenuImportDraft } from '../layout/quality.js';
import { parseMenuText } from '../parser.service.js';

export { buildMenuStructure, runPipelineOnPages } from './build-menu-structure.js';
export { detectColumns } from './detect-columns.js';
export { parsedMenuToDraft } from './to-draft.js';
export type * from './types.js';

/**
 * Full pipeline: pages → spatial structure → optional semantic validation → MenuImportDraft
 */
export async function runMenuImportPipeline(
  pages: PageLayout[],
  ocrText: string,
  options?: { semanticValidation?: boolean; debug?: boolean },
): Promise<MenuImportDraft> {
  if (pages.length === 0) {
    const textDraft = parseMenuText(ocrText);
    return textDraft;
  }

  let pipelineResult = runPipelineOnPages(pages);

  if (options?.semanticValidation !== false && process.env.OPENAI_API_KEY) {
    const semantic = await validateMenuStructureWithAi(pipelineResult.parsed);
    pipelineResult = {
      ...pipelineResult,
      parsed: applySemanticCorrections(pipelineResult.parsed, semantic.corrections),
      semantic,
    };
  }

  let draft = parsedMenuToDraft(pipelineResult, {
    includeDebug: options?.debug !== false,
  });

  if (isDraftUsable(draft)) {
    return draft;
  }

  const textDraft = parseMenuText(ocrText);
  const pipelineScore = scoreMenuImportDraft(draft);
  const textScore = scoreMenuImportDraft(textDraft);

  if (textScore > pipelineScore && textDraft.categories.length > 0) {
    return {
      ...textDraft,
      debug: draft.debug,
      layoutMeta: draft.layoutMeta,
    };
  }

  return draft;
}
