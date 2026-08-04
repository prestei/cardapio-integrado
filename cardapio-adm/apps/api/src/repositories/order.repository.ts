import { OrderStatus, OrderType, Prisma, StatusChangeSource } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface OrderFilters {
  status?: OrderStatus;
  type?: OrderType;
  search?: string;
  from?: Date;
  to?: Date;
}

export const orderRepository = {
  findAll(establishmentId: string, filters: OrderFilters = {}) {
    const where: Prisma.OrderWhereInput = {
      establishmentId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { code: { contains: filters.search, mode: 'insensitive' } },
              { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
              { customer: { phone: { contains: filters.search } } },
            ],
          }
        : {}),
    };

    return prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        address: true,
        payment: true,
        items: {
          include: { additionals: true },
        },
      },
    });
  },

  findById(id: string, establishmentId: string) {
    return prisma.order.findFirst({
      where: { id, establishmentId },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        address: true,
        payment: true,
        coupon: true,
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
            additionals: true,
          },
        },
      },
    });
  },

  updateStatus(
    id: string,
    establishmentId: string,
    status: OrderStatus,
    statusHistory: Prisma.InputJsonValue,
  ) {
    return prisma.order.updateMany({
      where: { id, establishmentId },
      data: { status, statusHistory },
    }).then(() => this.findById(id, establishmentId));
  },

  createStatusHistoryEntry(data: {
    establishmentId: string;
    orderId: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    userId?: string | null;
    source?: StatusChangeSource;
    note?: string | null;
  }) {
    return prisma.orderStatusHistory.create({
      data: {
        establishmentId: data.establishmentId,
        orderId: data.orderId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        userId: data.userId ?? null,
        source: data.source ?? StatusChangeSource.SYSTEM,
        note: data.note ?? null,
      },
    });
  },

  countByStatus(establishmentId: string, statuses: OrderStatus[]) {
    return prisma.order.count({
      where: {
        establishmentId,
        status: { in: statuses },
      },
    });
  },

  findActiveForKds(establishmentId: string) {
    return prisma.order.findMany({
      where: {
        establishmentId,
        status: {
          in: [OrderStatus.NEW, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY],
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        address: true,
        items: {
          include: { additionals: true },
        },
      },
    });
  },

  findRecent(establishmentId: string, limit = 10) {
    return prisma.order.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        payment: true,
      },
    });
  },

  aggregateRevenue(establishmentId: string, from: Date, to: Date) {
    return prisma.order.aggregate({
      where: {
        establishmentId,
        status: { not: OrderStatus.CANCELLED },
        createdAt: { gte: from, lte: to },
      },
      _sum: { total: true },
      _count: { id: true },
      _avg: { total: true },
    });
  },

  countNewCustomers(establishmentId: string, from: Date, to: Date) {
    return prisma.customer.count({
      where: {
        establishmentId,
        createdAt: { gte: from, lte: to },
      },
    });
  },

  topProducts(establishmentId: string, from: Date, to: Date, limit = 5) {
    return prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      where: {
        order: {
          establishmentId,
          status: { not: OrderStatus.CANCELLED },
          createdAt: { gte: from, lte: to },
        },
      },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
  },

  salesByDay(establishmentId: string, from: Date, to: Date) {
    return prisma.$queryRaw<Array<{ date: Date; revenue: Prisma.Decimal; orders: bigint }>>`
      SELECT DATE("createdAt") as date,
             COALESCE(SUM(total), 0) as revenue,
             COUNT(*)::bigint as orders
      FROM "Order"
      WHERE "establishmentId" = ${establishmentId}
        AND status != 'CANCELLED'
        AND "createdAt" >= ${from}
        AND "createdAt" <= ${to}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;
  },

  ordersByHour(establishmentId: string, from: Date, to: Date) {
    return prisma.$queryRaw<Array<{ hour: number; orders: bigint }>>`
      SELECT EXTRACT(HOUR FROM "createdAt")::int as hour,
             COUNT(*)::bigint as orders
      FROM "Order"
      WHERE "establishmentId" = ${establishmentId}
        AND "createdAt" >= ${from}
        AND "createdAt" <= ${to}
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour ASC
    `;
  },

  weeklyRevenue(establishmentId: string, from: Date, to: Date) {
    return prisma.$queryRaw<Array<{ week: number; revenue: Prisma.Decimal; orders: bigint }>>`
      SELECT EXTRACT(WEEK FROM "createdAt")::int as week,
             COALESCE(SUM(total), 0) as revenue,
             COUNT(*)::bigint as orders
      FROM "Order"
      WHERE "establishmentId" = ${establishmentId}
        AND status != 'CANCELLED'
        AND "createdAt" >= ${from}
        AND "createdAt" <= ${to}
      GROUP BY EXTRACT(WEEK FROM "createdAt")
      ORDER BY week ASC
    `;
  },

  paymentMethods(establishmentId: string, from: Date, to: Date) {
    return prisma.payment.groupBy({
      by: ['method'],
      where: {
        status: 'PAID',
        order: {
          establishmentId,
          status: { not: OrderStatus.CANCELLED },
          createdAt: { gte: from, lte: to },
        },
      },
      _sum: { amount: true },
      _count: { id: true },
    });
  },
};
