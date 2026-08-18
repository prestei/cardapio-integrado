import { menuImportRepository } from '../../repositories/menu-import.repository.js';
import { logger } from '../../lib/logger.js';
import type { MenuImportDraft, ProcessingStep } from '../../types/menu-import.js';
import { DEFAULT_PROCESSING_STEPS } from '../../types/menu-import.js';
import { extractTextFromFiles, extractPageLayoutsFromFiles } from './ocr.service.js';
import { parseMenuFromSpatialPages } from './spatial-parser.service.js';
import { attachDuplicateMatches } from './duplicate.service.js';

const activeJobs = new Set<string>();

function cloneSteps(): ProcessingStep[] {
  return DEFAULT_PROCESSING_STEPS.map((s) => ({ ...s }));
}

async function updateStep(
  importId: string,
  establishmentId: string,
  key: ProcessingStep['key'],
  status: ProcessingStep['status'],
  steps: ProcessingStep[],
): Promise<void> {
  const idx = steps.findIndex((s) => s.key === key);
  if (idx >= 0) steps[idx].status = status;
  await menuImportRepository.updateProcessingSteps(importId, establishmentId, steps);
}

export async function enqueueMenuImportProcessing(
  importId: string,
  establishmentId: string,
): Promise<void> {
  if (activeJobs.has(importId)) return;
  activeJobs.add(importId);

  setImmediate(() => {
    void processMenuImport(importId, establishmentId).finally(() => {
      activeJobs.delete(importId);
    });
  });
}

async function processMenuImport(importId: string, establishmentId: string): Promise<void> {
  const steps = cloneSteps();
  steps[0].status = 'done';

  try {
    const record = await menuImportRepository.findById(importId, establishmentId);
    if (!record) return;

    await menuImportRepository.updateStatus(importId, establishmentId, {
      status: 'PROCESSING',
      processingSteps: steps,
    });

    await updateStep(importId, establishmentId, 'analyzed', 'active', steps);
    await updateStep(importId, establishmentId, 'analyzed', 'done', steps);

    await updateStep(importId, establishmentId, 'text_extracted', 'active', steps);
    const fileInputs = record.files.map((f) => ({
      path: f.storagePath,
      mimeType: f.mimeType,
      pageIndex: f.pageIndex,
    }));

    const pageLayouts = await extractPageLayoutsFromFiles(fileInputs);
    const ocrText = await extractTextFromFiles(fileInputs);

    if (!ocrText || ocrText.length < 10) {
      await menuImportRepository.updateStatus(importId, establishmentId, {
        status: 'FAILED',
        errorMessage: 'Não conseguimos identificar o texto desta imagem.',
        errorDetails: 'OCR returned empty or too short text',
        ocrText: ocrText || null,
        processingSteps: steps.map((s) =>
          s.key === 'text_extracted' ? { ...s, status: 'error' as const } : s,
        ),
      });
      return;
    }

    await menuImportRepository.updateStatus(importId, establishmentId, { ocrText });
    await updateStep(importId, establishmentId, 'text_extracted', 'done', steps);

    await updateStep(importId, establishmentId, 'products_identified', 'active', steps);
    const draft: MenuImportDraft = await parseMenuFromSpatialPages(pageLayouts, ocrText);
    await updateStep(importId, establishmentId, 'products_identified', 'done', steps);

    await updateStep(importId, establishmentId, 'categories_organized', 'active', steps);
    const withDuplicates = await attachDuplicateMatches(
      establishmentId,
      draft,
    );
    await updateStep(importId, establishmentId, 'categories_organized', 'done', steps);

    await updateStep(importId, establishmentId, 'ready_for_review', 'active', steps);

    const statsProducts = withDuplicates.categories.reduce(
      (acc, c) => acc + c.products.filter((p) => p.selected).length,
      0,
    );
    const statsCategories = withDuplicates.categories.filter((c) => c.selected).length;
    const statsAdditionals = withDuplicates.additionalGroups.reduce(
      (acc, g) => acc + g.additionals.filter((a) => a.selected).length,
      0,
    );

    steps[steps.length - 1].status = 'done';
    await menuImportRepository.updateStatus(importId, establishmentId, {
      status: 'AWAITING_REVIEW',
      extractedData: withDuplicates,
      processingSteps: steps,
      statsCategories,
      statsProducts,
      statsAdditionals,
    });
  } catch (err) {
    logger.error({ err, importId, establishmentId }, 'Menu import processing failed');
    await menuImportRepository.updateStatus(importId, establishmentId, {
      status: 'FAILED',
      errorMessage: 'Ocorreu um erro ao processar seu cardápio. Tente novamente.',
      errorDetails: err instanceof Error ? err.message : String(err),
      processingSteps: steps,
    });
  }
}
