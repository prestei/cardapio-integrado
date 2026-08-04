import { dashboardRepository } from '../repositories/dashboard.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { reportRepository } from '../repositories/report.repository.js';
import { decimalToNumber } from '../utils/serialize.js';
import { pctChange, resolvePeriod, type ReportPeriod } from '../utils/period.js';
import type { ReportQuery } from '../validators/report.schemas.js';

function range(query: ReportQuery) {
  return resolvePeriod(query.period as ReportPeriod, query.from, query.to);
}

export const reportService = {
  async overview(establishmentId: string, query: ReportQuery) {
    const r = range(query);

    const [currentAgg, previousAgg, inProgress, newCustomers, ordersByStatus] = await Promise.all([
      orderRepository.aggregateRevenue(establishmentId, r.from, r.to),
      orderRepository.aggregateRevenue(establishmentId, r.previousFrom, r.previousTo),
      dashboardRepository.getMetrics(establishmentId, r.from, r.to).then((res) => res[1]),
      orderRepository.countNewCustomers(establishmentId, r.from, r.to),
      reportRepository.ordersByStatus(establishmentId, r.from, r.to),
    ]);

    const revenue = decimalToNumber(currentAgg._sum.total) ?? 0;
    const orders = currentAgg._count.id;
    const avgTicket = decimalToNumber(currentAgg._avg.total) ?? 0;
    const prevRevenue = decimalToNumber(previousAgg._sum.total) ?? 0;
    const prevOrders = previousAgg._count.id;
    const prevAvgTicket = decimalToNumber(previousAgg._avg.total) ?? 0;

    return {
      period: query.period,
      from: r.from.toISOString(),
      to: r.to.toISOString(),
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
      ordersByStatus: ordersByStatus.map((row) => ({
        status: row.status,
        count: row._count.id,
      })),
    };
  },

  async sales(establishmentId: string, query: ReportQuery) {
    const r = range(query);

    const [salesByDay, ordersByHour, weeklyRevenue, revenueByType, currentAgg, previousAgg] =
      await Promise.all([
        orderRepository.salesByDay(establishmentId, r.from, r.to),
        orderRepository.ordersByHour(establishmentId, r.from, r.to),
        orderRepository.weeklyRevenue(establishmentId, r.from, r.to),
        reportRepository.revenueByType(establishmentId, r.from, r.to),
        orderRepository.aggregateRevenue(establishmentId, r.from, r.to),
        orderRepository.aggregateRevenue(establishmentId, r.previousFrom, r.previousTo),
      ]);

    const revenue = decimalToNumber(currentAgg._sum.total) ?? 0;
    const prevRevenue = decimalToNumber(previousAgg._sum.total) ?? 0;

    return {
      period: query.period,
      from: r.from.toISOString(),
      to: r.to.toISOString(),
      revenue,
      orders: currentAgg._count.id,
      comparison: {
        revenue: pctChange(revenue, prevRevenue),
        orders: pctChange(currentAgg._count.id, previousAgg._count.id),
      },
      salesByDay: salesByDay.map((row) => ({
        date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date),
        revenue: decimalToNumber(row.revenue) ?? 0,
        orders: Number(row.orders),
      })),
      ordersByHour: ordersByHour.map((row) => ({ hour: row.hour, orders: Number(row.orders) })),
      weeklyRevenue: weeklyRevenue.map((row) => ({
        week: row.week,
        revenue: decimalToNumber(row.revenue) ?? 0,
        orders: Number(row.orders),
      })),
      revenueByType: revenueByType.map((row) => ({
        type: row.type,
        revenue: decimalToNumber(row._sum.total) ?? 0,
        orders: row._count.id,
      })),
    };
  },

  async products(establishmentId: string, query: ReportQuery) {
    const r = range(query);

    const [topProducts, categoryBreakdown] = await Promise.all([
      orderRepository.topProducts(establishmentId, r.from, r.to, 20),
      reportRepository.categoryBreakdown(establishmentId, r.from, r.to),
    ]);

    return {
      period: query.period,
      from: r.from.toISOString(),
      to: r.to.toISOString(),
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        name: p.name,
        quantity: p._sum.quantity ?? 0,
        revenue: decimalToNumber(p._sum.total) ?? 0,
      })),
      categoryBreakdown: categoryBreakdown.map((row) => ({
        categoryId: row.categoryId,
        categoryName: row.categoryName ?? 'Sem categoria',
        quantity: Number(row.quantity),
        revenue: decimalToNumber(row.revenue) ?? 0,
      })),
    };
  },

  async customers(establishmentId: string, query: ReportQuery) {
    const r = range(query);

    const [newCustomers, topCustomers, repeatStats, couponUsages] = await Promise.all([
      orderRepository.countNewCustomers(establishmentId, r.from, r.to),
      reportRepository.topCustomers(establishmentId, r.from, r.to, 10),
      reportRepository.repeatCustomers(establishmentId, r.from, r.to),
      reportRepository.couponUsageStats(establishmentId, r.from, r.to),
    ]);

    const totalActive = Number(repeatStats[0]?.total ?? 0);
    const repeatCount = Number(repeatStats[0]?.repeat ?? 0);

    return {
      period: query.period,
      from: r.from.toISOString(),
      to: r.to.toISOString(),
      newCustomers,
      activeCustomers: totalActive,
      repeatCustomers: repeatCount,
      repeatRate: totalActive > 0 ? Number(((repeatCount / totalActive) * 100).toFixed(1)) : 0,
      couponUsages,
      topCustomers: topCustomers.map((c) => ({
        customerId: c.customerId,
        name: c.name,
        phone: c.phone,
        orders: Number(c.orders),
        revenue: decimalToNumber(c.revenue) ?? 0,
      })),
    };
  },

  async payments(establishmentId: string, query: ReportQuery) {
    const r = range(query);

    const [paymentMethods, statusBreakdown] = await Promise.all([
      orderRepository.paymentMethods(establishmentId, r.from, r.to),
      reportRepository.paymentStatusBreakdown(establishmentId, r.from, r.to),
    ]);

    return {
      period: query.period,
      from: r.from.toISOString(),
      to: r.to.toISOString(),
      byMethod: paymentMethods.map((row) => ({
        method: row.method,
        amount: decimalToNumber(row._sum.amount) ?? 0,
        count: row._count.id,
      })),
      byStatus: statusBreakdown.map((row) => ({
        status: row.status,
        amount: decimalToNumber(row._sum.amount) ?? 0,
        count: row._count.id,
      })),
    };
  },

  async operations(establishmentId: string, query: ReportQuery) {
    const r = range(query);

    const [ordersByStatus, avgFulfillment, avgDelivery] = await Promise.all([
      reportRepository.ordersByStatus(establishmentId, r.from, r.to),
      reportRepository.avgFulfillmentMinutes(establishmentId, r.from, r.to),
      reportRepository.avgDeliveryMinutes(establishmentId, r.from, r.to),
    ]);

    const total = ordersByStatus.reduce((sum, row) => sum + row._count.id, 0);
    const cancelled = ordersByStatus.find((row) => row.status === 'CANCELLED')?._count.id ?? 0;

    return {
      period: query.period,
      from: r.from.toISOString(),
      to: r.to.toISOString(),
      ordersByStatus: ordersByStatus.map((row) => ({ status: row.status, count: row._count.id })),
      totalOrders: total,
      cancelledOrders: cancelled,
      cancelRate: total > 0 ? Number(((cancelled / total) * 100).toFixed(1)) : 0,
      avgFulfillmentMinutes: avgFulfillment[0]?.avg_minutes
        ? Number(Number(avgFulfillment[0].avg_minutes).toFixed(1))
        : null,
      avgDeliveryMinutes: avgDelivery[0]?.avg_minutes
        ? Number(Number(avgDelivery[0].avg_minutes).toFixed(1))
        : null,
    };
  },
};
