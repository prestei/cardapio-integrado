import type { Request, Response } from 'express';
import { bannerService } from '../services/banner.service.js';
import {
  createBannerSchema,
  listBannersQuerySchema,
  updateBannerSchema,
} from '../validators/banner.schemas.js';
import { serialize } from '../utils/serialize.js';
import { menuEvents } from '../lib/menuEvents.js';

function notifyMenu(establishmentId: string) {
  menuEvents.publish('menu:updated', establishmentId);
}

export const bannerController = {
  async list(req: Request, res: Response) {
    const filters = listBannersQuerySchema.parse(req.query);
    const result = await bannerService.list(req.user!.establishmentId, filters);
    res.json(serialize(result));
  },

  async getById(req: Request, res: Response) {
    const result = await bannerService.getById(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async create(req: Request, res: Response) {
    const body = createBannerSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await bannerService.create(establishmentId, body);
    notifyMenu(establishmentId);
    res.status(201).json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateBannerSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await bannerService.update(req.params.id!, establishmentId, body);
    notifyMenu(establishmentId);
    res.json(serialize(result));
  },

  async delete(req: Request, res: Response) {
    const establishmentId = req.user!.establishmentId;
    await bannerService.delete(req.params.id!, establishmentId);
    notifyMenu(establishmentId);
    res.status(204).send();
  },
};
