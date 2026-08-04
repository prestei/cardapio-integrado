import { OrderStatus, PaymentStatus } from '@prisma/client';
import { dashboardRepository } from '../repositories/dashboard.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { prisma } from '../lib/prisma.js';
import { decimalToNumber } from '../utils/serialize.js';
import { pctChange, resolvePeriod, type ReportPeriod } from '../utils/period.js';

export type DashboardPeriod = ReportPeriod;

const DELAYED_THRESHOLD_MINUTES = 15;

export const dashboardService = {
  async getMetrics(
    establishmentId: string,
    period: DashboardPeriod = 'today',
    from?: string,
    to?: string,
  ) {
    const range = resolvePeriod(period, from, to);

    const [
      currentAgg,
      inProgress,
      newCustomers,
      topProducts,
      salesByDay,
      ordersByHour,
      weeklyRevenue,
      paymentMethods,
      recentOrders,
    ] = await dashboardRepository.getMetrics(establishmentId, range.from, range.to);

    const previousAgg = await orderRepository.aggregateRevenue(
      establishmentId,
      range.previousFrom,
      range.previousTo,
    );

    const revenue = decimalToNumber(currentAgg._sum.total) ?? 0;
    const orders = currentAgg._count.id;
    const avgTicket = decimalToNumber(currentAgg._avg.total) ?? 0;

    const prevRevenue = decimalToNumber(previousAgg._sum.total) ?? 0;
    const prevOrders = previousAgg._count.id;
    const prevAvgTicket = decimalToNumber(previousAgg._avg.total) ?? 0;

    return {
      period,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      revenue,
      orders,
      avgTicket: Number(avgTicket.toFixed(2)),
      inProgress,
      newCustomers,
      comparison: {
        revenue: pctChange(revenue, prevRevenue),
        orders: pctChange(orders, prevOrders),
        avgTicket: pctChange(avgTicket, prevAvgTicket),
      },
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        name: p.name,
        quantity: p._sum.quantity ?? 0,
        revenue: decimalToNumber(p._sum.total) ?? 0,
      })),
      salesByDay: salesByDay.map((row) => ({
        date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date),
        revenue: decimalToNumber(row.revenue) ?? 0,
        orders: Number(row.orders),
      })),
      ordersByHour: ordersByHour.map((row) => ({
        hour: row.hour,
        orders: Number(row.orders),
      })),
      weeklyRevenue: weeklyRevenue.map((row) => ({
        week: row.week,
        revenue: decimalToNumber(row.revenue) ?? 0,
        orders: Number(row.orders),
      })),
      paymentMethods: paymentMethods.map((row) => ({
        method: row.method,
        amount: decimalToNumber(row._sum.amount) ?? 0,
        count: row._count.id,
      })),
      recentOrders,
    };
  },

  async getAlerts(establishmentId: string) {
    const delayedThreshold = new Date(Date.now() - DELAYED_THRESHOLD_MINUTES * 60 * 1000);
    const now = new Date();

    const [
      unavailableProducts,
      productsWithoutImage,
      productsWithoutPrice,
      expiredPromotions,
      newOrders,
      delayedOrders,
      failedPayments,
    ] = await Promise.all([
      prisma.product.findMany({
        where: { establishmentId, isAvailable: false },
        select: { id: true, name: true, categoryId: true },
        orderBy: { name: 'asc' },
      }),
      prisma.product.findMany({
        where: {
          establishmentId,
          AND: [{ imageUrl: null }, { images: { none: {} } }],
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.product.findMany({
        where: { establishmentId, price: { lte: 0 } },
        select: { id: true, name: true, price: true },
        orderBy: { name: 'asc' },
      }),
      prisma.promotion.findMany({
        where: {
          establishmentId,
          status: { in: ['ACTIVE', 'PAUSED'] },
          endsAt: { lt: now },
        },
        select: { id: true, name: true, endsAt: true },
        orderBy: { endsAt: 'asc' },
        take: 20,
      }),
      prisma.order.findMany({
        where: { establishmentId, status: OrderStatus.NEW },
        select: { id: true, code: true, createdAt: true, total: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.order.findMany({
        where: {
          establishmentId,
          status: { in: [OrderStatus.NEW, OrderStatus.CONFIRMED, OrderStatus.PREPARING] },
          createdAt: { lte: delayedThreshold },
        },
        select: { id: true, code: true, status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.FAILED,
          order: { establishmentId },
        },
        select: {
          id: true,
          method: true,
          provider: true,
          failureReason: true,
          amount: true,
          order: { select: { id: true, code: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
    ]);

    const alerts = [
      ...unavailableProducts.map((p) => ({
        type: 'product_unavailable' as const,
        severity: 'warning' as const,
        message: `Produto "${p.name}" está indisponível.`,
        entityId: p.id,
      })),
      ...productsWithoutImage.map((p) => ({
        type: 'product_no_image' as const,
        severity: 'info' as const,
        message: `Produto "${p.name}" não possui imagem.`,
        entityId: p.id,
      })),
      ...productsWithoutPrice.map((p) => ({
        type: 'product_no_price' as const,
        severity: 'error' as const,
        message: `Produto "${p.name}" está sem preço válido.`,
        entityId: p.id,
      })),
      ...expiredPromotions.map((p) => ({
        type: 'promotion_expired' as const,
        severity: 'warning' as const,
        message: `Promoção "${p.name}" expirou e ainda não foi encerrada.`,
        entityId: p.id,
      })),
      ...newOrders.map((o) => ({
        type: 'order_waiting' as const,
        severity: 'info' as const,
        message: `Pedido ${o.code} aguardando confirmação.`,
        entityId: o.id,
        createdAt: o.createdAt.toISOString(),
      })),
      ...delayedOrders.map((o) => {
        const minutes = Math.round((Date.now() - o.createdAt.getTime()) / 60000);
        return {
          type: 'order_delayed' as const,
          severity: 'error' as const,
          message: `Pedido ${o.code} está há ${minutes} min em ${o.status} sem avançar.`,
          entityId: o.id,
          createdAt: o.createdAt.toISOString(),
        };
      }),
      ...failedPayments.map((p) => ({
        type: 'payment_failed' as const,
        severity: 'error' as const,
        message: `Pagamento do pedido ${p.order.code} falhou${p.failureReason ? `: ${p.failureReason}` : '.'}`,
        entityId: p.order.id,
      })),
    ];

    return {
      alerts,
      counts: {
        unavailableProducts: unavailableProducts.length,
        productsWithoutImage: productsWithoutImage.length,
        productsWithoutPrice: productsWithoutPrice.length,
        expiredPromotions: expiredPromotions.length,
        newOrdersWaiting: newOrders.length,
        delayedOrders: delayedOrders.length,
        failedPayments: failedPayments.length,
        total: alerts.length,
      },
    };
  },
};
