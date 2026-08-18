import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import type { MenuImportDraft, ProcessingStep } from '../types/menu-import.js';

export const menuImportRepository = {
  create(data: {
    establishmentId: string;
    userId: string;
    displayFileName: string;
    processingSteps: ProcessingStep[];
  }) {
    return prisma.menuImport.create({
      data: {
        establishmentId: data.establishmentId,
        userId: data.userId,
        displayFileName: data.displayFileName,
        status: 'PROCESSING',
        processingSteps: data.processingSteps as unknown as Prisma.InputJsonValue,
      },
    });
  },

  createFile(data: {
    importId: string;
    establishmentId: string;
    originalName: string;
    mimeType: string;
    size: number;
    storagePath: string;
    pageIndex: number;
  }) {
    return prisma.menuImportFile.create({ data });
  },

  findAll(establishmentId: string) {
    return prisma.menuImport.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        files: { orderBy: { pageIndex: 'asc' }, take: 1 },
      },
    });
  },

  findById(id: string, establishmentId: string) {
    return prisma.menuImport.findFirst({
      where: { id, establishmentId },
      include: {
        user: { select: { id: true, name: true } },
        files: { orderBy: { pageIndex: 'asc' } },
      },
    });
  },

  findFile(fileId: string, importId: string, establishmentId: string) {
    return prisma.menuImportFile.findFirst({
      where: { id: fileId, importId, establishmentId },
    });
  },

  updateStatus(
    id: string,
    establishmentId: string,
    data: {
      status?: 'PROCESSING' | 'AWAITING_REVIEW' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
      errorMessage?: string | null;
      errorDetails?: string | null;
      ocrText?: string | null;
      extractedData?: MenuImportDraft | null;
      processingSteps?: ProcessingStep[];
      statsCategories?: number;
      statsProducts?: number;
      statsAdditionals?: number;
      confirmedAt?: Date | null;
    },
  ) {
    return prisma.menuImport.updateMany({
      where: { id, establishmentId },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.errorMessage !== undefined ? { errorMessage: data.errorMessage } : {}),
        ...(data.errorDetails !== undefined ? { errorDetails: data.errorDetails } : {}),
        ...(data.ocrText !== undefined ? { ocrText: data.ocrText } : {}),
        ...(data.extractedData !== undefined
          ? { extractedData: data.extractedData as unknown as Prisma.InputJsonValue }
          : {}),
        ...(data.processingSteps !== undefined
          ? { processingSteps: data.processingSteps as unknown as Prisma.InputJsonValue }
          : {}),
        ...(data.statsCategories !== undefined ? { statsCategories: data.statsCategories } : {}),
        ...(data.statsProducts !== undefined ? { statsProducts: data.statsProducts } : {}),
        ...(data.statsAdditionals !== undefined ? { statsAdditionals: data.statsAdditionals } : {}),
        ...(data.confirmedAt !== undefined ? { confirmedAt: data.confirmedAt } : {}),
      },
    });
  },

  updateProcessingSteps(id: string, establishmentId: string, steps: ProcessingStep[]) {
    return this.updateStatus(id, establishmentId, { processingSteps: steps });
  },

  delete(id: string, establishmentId: string) {
    return prisma.menuImport.deleteMany({ where: { id, establishmentId } });
  },
};
