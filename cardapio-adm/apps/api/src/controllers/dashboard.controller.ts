import type { Request, Response } from 'express';
import { dashboardService, type DashboardPeriod } from '../services/dashboard.service.js';
import { serialize } from '../utils/serialize.js';

export const dashboardController = {
  async metrics(req: Request, res: Response) {
    const period = (req.query.period as DashboardPeriod) ?? 'today';
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;

    const result = await dashboardService.getMetrics(
      req.user!.establishmentId,
      period,
      from,
      to,
    );
    res.json(serialize(result));
  },

  async alerts(req: Request, res: Response) {
    const result = await dashboardService.getAlerts(req.user!.establishmentId);
    res.json(serialize(result));
  },
};
