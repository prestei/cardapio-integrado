import { AppError } from './AppError.js';

export type ReportPeriod = 'today' | '7d' | '30d' | 'custom';

export interface ResolvedPeriod {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function resolvePeriod(period: ReportPeriod, from?: string, to?: string): ResolvedPeriod {
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

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
