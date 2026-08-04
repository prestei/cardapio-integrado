import type { Request, Response } from 'express';
import { promotionService } from '../services/promotion.service.js';
import {
  createPromotionSchema,
  listPromotionsQuerySchema,
  updatePromotionSchema,
} from '../validators/promotion.schemas.js';
import { serialize } from '../utils/serialize.js';
import { menuEvents } from '../lib/menuEvents.js';

function notifyMenu(establishmentId: string) {
  menuEvents.publish('menu:updated', establishmentId);
}

export const promotionController = {
  async list(req: Request, res: Response) {
    const filters = listPromotionsQuerySchema.parse(req.query);
    const result = await promotionService.list(req.user!.establishmentId, filters);
    res.json(serialize(result));
  },

  async getById(req: Request, res: Response) {
    const result = await promotionService.getById(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async create(req: Request, res: Response) {
    const body = createPromotionSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await promotionService.create(establishmentId, body);
    notifyMenu(establishmentId);
    res.status(201).json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updatePromotionSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await promotionService.update(req.params.id!, establishmentId, body);
    notifyMenu(establishmentId);
    res.json(serialize(result));
  },

  async delete(req: Request, res: Response) {
    const establishmentId = req.user!.establishmentId;
    await promotionService.delete(req.params.id!, establishmentId);
    notifyMenu(establishmentId);
    res.status(204).send();
  },
};
