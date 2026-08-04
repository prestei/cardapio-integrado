import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const reportRepository = {
  categoryBreakdown(establishmentId: string, from: Date, to: Date) {
    return prisma.$queryRaw<
      Array<{ categoryId: string | null; categoryName: string | null; quantity: bigint; revenue: Prisma.Decimal }>
    >`
      SELECT c.id as "categoryId",
             c.name as "categoryName",
             COALESCE(SUM(oi.quantity), 0)::bigint as quantity,
             COALESCE(SUM(oi.total), 0) as revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      LEFT JOIN "Product" p ON p.id = oi."productId"
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE o."establishmentId" = ${establishmentId}
        AND o.status != 'CANCELLED'
        AND o."createdAt" >= ${from}
        AND o."createdAt" <= ${to}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;
  },

  topCustomers(establishmentId: string, from: Date, to: Date, limit = 10) {
    return prisma.$queryRaw<
      Array<{ customerId: string; name: string; phone: string; orders: bigint; revenue: Prisma.Decimal }>
    >`
      SELECT c.id as "customerId",
             c.name,
             c.phone,
             COUNT(o.id)::bigint as orders,
             COALESCE(SUM(o.total), 0) as revenue
      FROM "Order" o
      JOIN "Customer" c ON c.id = o."customerId"
      WHERE o."establishmentId" = ${establishmentId}
        AND o.status != 'CANCELLED'
        AND o."createdAt" >= ${from}
        AND o."createdAt" <= ${to}
      GROUP BY c.id, c.name, c.phone
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;
  },

  repeatCustomers(establishmentId: string, from: Date, to: Date) {
    return prisma.$queryRaw<Array<{ total: bigint; repeat: bigint }>>`
      SELECT COUNT(*)::bigint as total,
             COUNT(*) FILTER (WHERE cnt > 1)::bigint as repeat
      FROM (
        SELECT "customerId", COUNT(*) as cnt
        FROM "Order"
        WHERE "establishmentId" = ${establishmentId}
          AND status != 'CANCELLED'
          AND "customerId" IS NOT NULL
          AND "createdAt" >= ${from}
          AND "createdAt" <= ${to}
        GROUP BY "customerId"
      ) t
    `;
  },

  paymentStatusBreakdown(establishmentId: string, from: Date, to: Date) {
    return prisma.payment.groupBy({
      by: ['status'],
      where: {
        order: {
          establishmentId,
          createdAt: { gte: from, lte: to },
        },
      },
      _sum: { amount: true },
      _count: { id: true },
    });
  },

  revenueByType(establishmentId: string, from: Date, to: Date) {
    return prisma.order.groupBy({
      by: ['type'],
      where: {
        establishmentId,
        status: { not: OrderStatus.CANCELLED },
        createdAt: { gte: from, lte: to },
      },
      _sum: { total: true },
      _count: { id: true },
    });
  },

  ordersByStatus(establishmentId: string, from: Date, to: Date) {
    return prisma.order.groupBy({
      by: ['status'],
      where: {
        establishmentId,
        createdAt: { gte: from, lte: to },
      },
      _count: { id: true },
    });
  },

  avgFulfillmentMinutes(establishmentId: string, from: Date, to: Date) {
    return prisma.$queryRaw<Array<{ avg_minutes: number | null }>>`
      SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 60) as avg_minutes
      FROM "Order"
      WHERE "establishmentId" = ${establishmentId}
        AND status = 'COMPLETED'
        AND "createdAt" >= ${from}
        AND "createdAt" <= ${to}
    `;
  },

  avgDeliveryMinutes(establishmentId: string, from: Date, to: Date) {
    return prisma.$queryRaw<Array<{ avg_minutes: number | null }>>`
      SELECT AVG(EXTRACT(EPOCH FROM ("deliveryCompletedAt" - "deliveryLeftAt")) / 60) as avg_minutes
      FROM "Order"
      WHERE "establishmentId" = ${establishmentId}
        AND "deliveryLeftAt" IS NOT NULL
        AND "deliveryCompletedAt" IS NOT NULL
        AND "createdAt" >= ${from}
        AND "createdAt" <= ${to}
    `;
  },

  couponUsageStats(establishmentId: string, from: Date, to: Date) {
    return prisma.couponUsage.count({
      where: {
        order: { establishmentId, createdAt: { gte: from, lte: to } },
      },
    });
  },

  newVsReturningCustomers(establishmentId: string, from: Date, to: Date) {
    return prisma.$queryRaw<Array<{ new_customers: bigint; returning_customers: bigint }>>`
      SELECT
        COUNT(*) FILTER (WHERE c."createdAt" >= ${from} AND c."createdAt" <= ${to})::bigint as new_customers,
        COUNT(*) FILTER (WHERE c."createdAt" < ${from})::bigint as returning_customers
      FROM "Customer" c
      WHERE c."establishmentId" = ${establishmentId}
        AND c.id IN (
          SELECT DISTINCT "customerId" FROM "Order"
          WHERE "establishmentId" = ${establishmentId}
            AND "customerId" IS NOT NULL
            AND status != 'CANCELLED'
            AND "createdAt" >= ${from}
            AND "createdAt" <= ${to}
        )
    `;
  },
};
