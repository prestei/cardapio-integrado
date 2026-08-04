import type { QrCodeKind } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const qrRepository = {
  findAll(establishmentId: string) {
    return prisma.qrCode.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string, establishmentId: string) {
    return prisma.qrCode.findFirst({ where: { id, establishmentId } });
  },

  create(
    establishmentId: string,
    data: {
      name: string;
      kind?: QrCodeKind;
      targetPath?: string;
      tableLabel?: string;
      isActive?: boolean;
    },
  ) {
    return prisma.qrCode.create({ data: { establishmentId, ...data } });
  },

  update(
    id: string,
    establishmentId: string,
    data: {
      name?: string;
      kind?: QrCodeKind;
      targetPath?: string;
      tableLabel?: string;
      isActive?: boolean;
    },
  ) {
    return prisma.qrCode
      .updateMany({ where: { id, establishmentId }, data })
      .then(() => this.findById(id, establishmentId));
  },

  delete(id: string, establishmentId: string) {
    return prisma.qrCode.deleteMany({ where: { id, establishmentId } });
  },
};
