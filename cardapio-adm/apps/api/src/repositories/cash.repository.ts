import { CashMovementType, CashRegisterStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const userSelect = { select: { id: true, name: true } };

const registerInclude = {
  openedBy: userSelect,
  closedBy: userSelect,
  movements: {
    orderBy: { createdAt: 'asc' as const },
    include: { user: userSelect },
  },
};

export const cashRepository = {
  findOpen(establishmentId: string) {
    return prisma.cashRegister.findFirst({
      where: { establishmentId, status: CashRegisterStatus.OPEN },
      include: registerInclude,
    });
  },

  findById(id: string, establishmentId: string) {
    return prisma.cashRegister.findFirst({
      where: { id, establishmentId },
      include: registerInclude,
    });
  },

  create(establishmentId: string, openedById: string, openingAmount: number, note?: string) {
    return prisma.cashRegister.create({
      data: {
        establishmentId,
        openedById,
        openingAmount: new Prisma.Decimal(openingAmount),
        openingNote: note,
        status: CashRegisterStatus.OPEN,
      },
      include: registerInclude,
    });
  },

  createMovement(data: {
    cashRegisterId: string;
    establishmentId: string;
    userId: string;
    type: CashMovementType;
    amount: number;
    reason?: string;
    orderId?: string;
  }) {
    return prisma.cashMovement.create({
      data: {
        cashRegisterId: data.cashRegisterId,
        establishmentId: data.establishmentId,
        userId: data.userId,
        type: data.type,
        amount: new Prisma.Decimal(data.amount),
        reason: data.reason,
        orderId: data.orderId,
      },
      include: { user: userSelect },
    });
  },

  sumMovements(cashRegisterId: string) {
    return prisma.cashMovement.findMany({
      where: { cashRegisterId },
      select: { type: true, amount: true },
    });
  },

  close(
    id: string,
    establishmentId: string,
    closedById: string,
    data: { closingAmount: number; expectedAmount: number; difference: number; note?: string },
  ) {
    return prisma.cashRegister
      .updateMany({
        where: { id, establishmentId },
        data: {
          status: CashRegisterStatus.CLOSED,
          closedById,
          closingAmount: new Prisma.Decimal(data.closingAmount),
          expectedAmount: new Prisma.Decimal(data.expectedAmount),
          difference: new Prisma.Decimal(data.difference),
          closingNote: data.note,
          closedAt: new Date(),
        },
      })
      .then(() => this.findById(id, establishmentId));
  },

  history(establishmentId: string, page: number, pageSize: number) {
    return Promise.all([
      prisma.cashRegister.findMany({
        where: { establishmentId },
        orderBy: { openedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: registerInclude,
      }),
      prisma.cashRegister.count({ where: { establishmentId } }),
    ]);
  },
};
