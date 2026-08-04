import { dashboardRepository } from '../repositories/dashboard.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { AppError } from '../utils/AppError.js';
import { decimalToNumber } from '../utils/serialize.js';

export type DashboardPeriod = 'today' | '7d' | '30d' | 'custom';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function resolvePeriod(
  period: DashboardPeriod,
  from?: string,
  to?: string,
): { from: Date; to: Date; previousFrom: Date; previousTo: Date } {
  const now = new Date();

  if (period === 'custom') {
    if (!from || !to) {
      throw new AppError('Informe from e to para o período customizado.', 400);
    }
    const fromDate = startOfDay(new Date(from));
    const toDate = endOfDay(new Date(to));
    const duration = toDate.getTime() - fromDate.getTime();
    const previousTo = new Date(fromDate.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - duration);
    return { from: fromDate, to: toDate, previousFrom, previousTo };
  }

  if (period === 'today') {
    const fromDate = startOfDay(now);
    const toDate = endOfDay(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      from: fromDate,
      to: toDate,
      previousFrom: startOfDay(yesterday),
      previousTo: endOfDay(yesterday),
    };
  }

  if (period === '7d') {
    const fromDate = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
    const toDate = endOfDay(now);
    const previousTo = new Date(fromDate.getTime() - 1);
    const previousFrom = startOfDay(new Date(previousTo.getTime() - 6 * 24 * 60 * 60 * 1000));
    return { from: fromDate, to: toDate, previousFrom, previousTo };
  }

  const fromDate = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
  const toDate = endOfDay(now);
  const previousTo = new Date(fromDate.getTime() - 1);
  const previousFrom = startOfDay(new Date(previousTo.getTime() - 29 * 24 * 60 * 60 * 1000));
  return { from: fromDate, to: toDate, previousFrom, previousTo };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

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
};
