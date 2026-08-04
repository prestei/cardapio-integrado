import type { Request, Response } from 'express';
import { reportService } from '../services/report.service.js';
import { reportQuerySchema } from '../validators/report.schemas.js';
import { serialize } from '../utils/serialize.js';

export const reportController = {
  async overview(req: Request, res: Response) {
    const query = reportQuerySchema.parse(req.query);
    const result = await reportService.overview(req.user!.establishmentId, query);
    res.json(serialize(result));
  },

  async sales(req: Request, res: Response) {
    const query = reportQuerySchema.parse(req.query);
    const result = await reportService.sales(req.user!.establishmentId, query);
    res.json(serialize(result));
  },

  async products(req: Request, res: Response) {
    const query = reportQuerySchema.parse(req.query);
    const result = await reportService.products(req.user!.establishmentId, query);
    res.json(serialize(result));
  },

  async customers(req: Request, res: Response) {
    const query = reportQuerySchema.parse(req.query);
    const result = await reportService.customers(req.user!.establishmentId, query);
    res.json(serialize(result));
  },

  async payments(req: Request, res: Response) {
    const query = reportQuerySchema.parse(req.query);
    const result = await reportService.payments(req.user!.establishmentId, query);
    res.json(serialize(result));
  },

  async operations(req: Request, res: Response) {
    const query = reportQuerySchema.parse(req.query);
    const result = await reportService.operations(req.user!.establishmentId, query);
    res.json(serialize(result));
  },
};
