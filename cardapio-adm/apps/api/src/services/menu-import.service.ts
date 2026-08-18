import { Prisma } from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../lib/prisma.js';
import { menuImportRepository } from '../repositories/menu-import.repository.js';
import {
  ensureImportDir,
  isPathInsideRoot,
  MENU_IMPORT_LIMITS,
  removeImportDir,
  sanitizeFilename,
} from '../lib/menuImportStorage.js';
import { AppError } from '../utils/AppError.js';
import type {
  DuplicateAction,
  MenuImportDraft,
  ProcessingStep,
} from '../types/menu-import.js';
import { DEFAULT_PROCESSING_STEPS } from '../types/menu-import.js';
import {
  detectMimeFromBuffer,
  getExtensionFromMime,
  validateFileIntegrity,
} from './menu-import/ocr.service.js';
import { enqueueMenuImportProcessing } from './menu-import/processor.service.js';
import { menuEvents } from '../lib/menuEvents.js';
import { attachDuplicateMatches, normalizeName } from './menu-import/duplicate.service.js';

export const menuImportService = {
  async list(establishmentId: string) {
    return menuImportRepository.findAll(establishmentId);
  },

  async getById(id: string, establishmentId: string) {
    const record = await menuImportRepository.findById(id, establishmentId);
    if (!record) {
      throw new AppError('Importação não encontrada.', 404);
    }
    return record;
  },

  async createFromUpload(
    establishmentId: string,
    userId: string,
    files: Express.Multer.File[],
  ) {
    if (!files.length) {
      throw new AppError('Envie pelo menos um arquivo.', 400);
    }
    if (files.length > MENU_IMPORT_LIMITS.maxFiles) {
      throw new AppError('Quantidade máxima de arquivos excedida.', 400);
    }

    const steps: ProcessingStep[] = DEFAULT_PROCESSING_STEPS.map((s) => ({ ...s }));
    steps[0].status = 'done';

    const displayFileName =
      files.length === 1 ? files[0].originalname : `${files.length} arquivos`;

    const record = await menuImportRepository.create({
      establishmentId,
      userId,
      displayFileName,
      processingSteps: steps,
    });

    const dir = await ensureImportDir(establishmentId, record.id);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const buffer = await fs.readFile(file.path);
        const detectedMime = detectMimeFromBuffer(buffer);
        const mimeType = detectedMime ?? file.mimetype;

        if (!MENU_IMPORT_LIMITS.allowedMimeTypes.has(mimeType)) {
          throw new AppError('Formato de arquivo não suportado.', 400);
        }

        const ext = path.extname(file.originalname).toLowerCase();
        if (ext && !MENU_IMPORT_LIMITS.allowedExtensions.has(ext)) {
          throw new AppError('Extensão de arquivo não suportada.', 400);
        }

        const storageName = `${String(i).padStart(3, '0')}${getExtensionFromMime(mimeType)}`;
        const storagePath = path.join(dir, sanitizeFilename(storageName));

        await fs.rename(file.path, storagePath);
        await validateFileIntegrity(storagePath, mimeType);

        await menuImportRepository.createFile({
          importId: record.id,
          establishmentId,
          originalName: file.originalname,
          mimeType,
          size: file.size,
          storagePath,
          pageIndex: i,
        });
      }
    } catch (err) {
      await removeImportDir(establishmentId, record.id);
      await menuImportRepository.delete(record.id, establishmentId);
      if (err instanceof AppError) throw err;
      throw new AppError('Não foi possível processar o arquivo enviado.', 400);
    }

    enqueueMenuImportProcessing(record.id, establishmentId);
    return this.getById(record.id, establishmentId);
  },

  async updateDraft(id: string, establishmentId: string, draft: MenuImportDraft) {
    const record = await this.getById(id, establishmentId);
    if (record.status !== 'AWAITING_REVIEW') {
      throw new AppError('Esta importação não pode ser editada no momento.', 400);
    }

    const withDuplicates = await attachDuplicateMatches(establishmentId, draft);
    const statsProducts = withDuplicates.categories.reduce(
      (acc, c) => acc + c.products.filter((p) => p.selected).length,
      0,
    );
    const statsCategories = withDuplicates.categories.filter((c) => c.selected).length;
    const statsAdditionals = withDuplicates.additionalGroups.reduce(
      (acc, g) => acc + g.additionals.filter((a) => a.selected).length,
      0,
    );

    await menuImportRepository.updateStatus(id, establishmentId, {
      extractedData: withDuplicates,
      statsCategories,
      statsProducts,
      statsAdditionals,
    });

    return this.getById(id, establishmentId);
  },

  async attachDuplicateMatches(establishmentId: string, draft: MenuImportDraft) {
    return attachDuplicateMatches(establishmentId, draft);
  },

  async confirm(id: string, establishmentId: string) {
    const record = await this.getById(id, establishmentId);
    if (record.status !== 'AWAITING_REVIEW') {
      throw new AppError('Esta importação não está pronta para confirmação.', 400);
    }

    const draft = record.extractedData as MenuImportDraft | null;
    if (!draft) {
      throw new AppError('Dados da importação não encontrados.', 400);
    }

    const selectedCategories = draft.categories.filter((c) => c.selected);
    const selectedProducts = selectedCategories.flatMap((c) =>
      c.products.filter((p) => p.selected),
    );
    const selectedGroups = draft.additionalGroups.filter((g) => g.selected);

    const needsReview = selectedProducts.some((p) => p.price == null || p.confidence === 'low');
    if (needsReview) {
      throw new AppError('Alguns produtos precisam de revisão antes da importação.', 400);
    }

    await prisma.$transaction(async (tx) => {
      const categoryIdMap = new Map<string, string>();
      const existingCategories = await tx.category.findMany({
        where: { establishmentId },
        select: { id: true, name: true, sortOrder: true },
      });

      let categorySort =
        existingCategories.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1;

      for (const cat of selectedCategories) {
        const match = existingCategories.find(
          (e) => normalizeName(e.name) === normalizeName(cat.name),
        );
        if (match) {
          categoryIdMap.set(cat.id, match.id);
        } else {
          const created = await tx.category.create({
            data: {
              establishmentId,
              name: cat.name,
              sortOrder: categorySort++,
              isActive: true,
            },
          });
          categoryIdMap.set(cat.id, created.id);
        }
      }

      let productSort =
        (
          await tx.product.aggregate({
            where: { establishmentId },
            _max: { sortOrder: true },
          })
        )._max.sortOrder ?? -1;

      productSort += 1;

      const groupIdMap = new Map<string, string>();
      let groupSort =
        (
          await tx.additionalGroup.aggregate({
            where: { establishmentId },
            _max: { sortOrder: true },
          })
        )._max.sortOrder ?? -1;

      for (const group of selectedGroups) {
        groupSort += 1;
        const createdGroup = await tx.additionalGroup.create({
          data: {
            establishmentId,
            name: group.name,
            selectionType: group.selectionType ?? 'MULTIPLE',
            isRequired: group.isRequired ?? false,
            minQuantity: group.minQuantity ?? 0,
            maxQuantity: group.maxQuantity ?? 1,
            sortOrder: groupSort,
          },
        });
        groupIdMap.set(group.id, createdGroup.id);

        let addSort = 0;
        for (const add of group.additionals.filter((a) => a.selected && a.price != null)) {
          await tx.additional.create({
            data: {
              additionalGroupId: createdGroup.id,
              name: add.name,
              price: new Prisma.Decimal(add.price!),
              sortOrder: addSort++,
              isAvailable: true,
            },
          });
        }
      }

      for (const cat of selectedCategories) {
        const categoryId = categoryIdMap.get(cat.id);
        if (!categoryId) continue;

        for (const product of cat.products.filter((p) => p.selected)) {
          const action: DuplicateAction = product.duplicateMatch?.action ?? 'create';

          if (action === 'ignore') continue;

          if (action === 'update' && product.duplicateMatch?.existingProductId) {
            await tx.product.updateMany({
              where: {
                id: product.duplicateMatch.existingProductId,
                establishmentId,
              },
              data: {
                name: product.name,
                description: product.description,
                price: new Prisma.Decimal(product.price!),
                categoryId,
              },
            });
            continue;
          }

          await tx.product.create({
            data: {
              establishmentId,
              categoryId,
              name: product.name,
              description: product.description,
              price: new Prisma.Decimal(product.price!),
              sortOrder: productSort++,
              isAvailable: true,
            },
          });
        }
      }

      await tx.menuImport.updateMany({
        where: { id, establishmentId },
        data: {
          status: 'COMPLETED',
          confirmedAt: new Date(),
          statsCategories: selectedCategories.length,
          statsProducts: selectedProducts.filter(
            (p) => (p.duplicateMatch?.action ?? 'create') !== 'ignore',
          ).length,
          statsAdditionals: selectedGroups.reduce(
            (acc, g) => acc + g.additionals.filter((a) => a.selected).length,
            0,
          ),
        },
      });
    });

    menuEvents.publish('menu:updated', establishmentId);
    return this.getById(id, establishmentId);
  },

  async cancel(id: string, establishmentId: string) {
    const record = await this.getById(id, establishmentId);
    if (record.status === 'COMPLETED') {
      throw new AppError('Importações concluídas não podem ser canceladas.', 400);
    }

    await menuImportRepository.updateStatus(id, establishmentId, { status: 'CANCELLED' });
    return this.getById(id, establishmentId);
  },

  async delete(id: string, establishmentId: string) {
    await this.getById(id, establishmentId);
    await menuImportRepository.delete(id, establishmentId);
    await removeImportDir(establishmentId, id);
  },

  async getFileStream(importId: string, fileId: string, establishmentId: string) {
    const file = await menuImportRepository.findFile(fileId, importId, establishmentId);
    if (!file) {
      throw new AppError('Arquivo não encontrado.', 404);
    }
    if (!isPathInsideRoot(file.storagePath)) {
      throw new AppError('Arquivo inválido.', 400);
    }

    return {
      file,
      stream: await fs.readFile(file.storagePath),
    };
  },

  async reprocess(id: string, establishmentId: string) {
    const record = await this.getById(id, establishmentId);
    if (!['FAILED', 'AWAITING_REVIEW', 'CANCELLED'].includes(record.status)) {
      throw new AppError('Esta importação não pode ser reprocessada.', 400);
    }

    await menuImportRepository.updateStatus(id, establishmentId, {
      status: 'PROCESSING',
      errorMessage: null,
      errorDetails: null,
      extractedData: null,
      processingSteps: DEFAULT_PROCESSING_STEPS.map((s) => ({ ...s, status: 'pending' as const })),
    });

    enqueueMenuImportProcessing(id, establishmentId);
    return this.getById(id, establishmentId);
  },
};
