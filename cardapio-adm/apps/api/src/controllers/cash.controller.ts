import type { Request, Response } from 'express';
import { cashService } from '../services/cash.service.js';
import {
  closeCashRegisterSchema,
  createCashMovementSchema,
  listCashHistoryQuerySchema,
  openCashRegisterSchema,
} from '../validators/cash.schemas.js';
import { serialize } from '../utils/serialize.js';

export const cashController = {
  async getCurrent(req: Request, res: Response) {
    const result = await cashService.getCurrent(req.user!.establishmentId);
    res.json(serialize(result));
  },

  async open(req: Request, res: Response) {
    const body = openCashRegisterSchema.parse(req.body);
    const result = await cashService.open(req.user!.establishmentId, req.user!.userId, body);
    res.status(201).json(serialize(result));
  },

  async addMovement(req: Request, res: Response) {
    const body = createCashMovementSchema.parse(req.body);
    const result = await cashService.addMovement(
      req.params.id!,
      req.user!.establishmentId,
      req.user!.userId,
      body,
    );
    res.status(201).json(serialize(result));
  },

  async close(req: Request, res: Response) {
    const body = closeCashRegisterSchema.parse(req.body);
    const result = await cashService.close(
      req.params.id!,
      req.user!.establishmentId,
      req.user!.userId,
      body,
    );
    res.json(serialize(result));
  },

  async history(req: Request, res: Response) {
    const query = listCashHistoryQuerySchema.parse(req.query);
    const result = await cashService.history(req.user!.establishmentId, query);
    res.json(serialize(result));
  },
};
