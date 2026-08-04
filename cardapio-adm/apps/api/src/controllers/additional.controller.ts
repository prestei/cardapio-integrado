import type { Request, Response } from 'express';
import { additionalService } from '../services/additional.service.js';
import {
  createAdditionalGroupSchema,
  updateAdditionalGroupSchema,
  createAdditionalSchema,
  updateAdditionalSchema,
  linkProductToGroupSchema,
} from '../validators/additional.schemas.js';
import { serialize } from '../utils/serialize.js';
import { menuEvents } from '../lib/menuEvents.js';

function notifyMenu(establishmentId: string) {
  menuEvents.publish('menu:updated', establishmentId);
}

export const additionalController = {
  async list(req: Request, res: Response) {
    const result = await additionalService.list(req.user!.establishmentId);
    res.json(serialize(result));
  },

  async getById(req: Request, res: Response) {
    const result = await additionalService.getById(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async create(req: Request, res: Response) {
    const body = createAdditionalGroupSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await additionalService.create(establishmentId, body);
    notifyMenu(establishmentId);
    res.status(201).json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateAdditionalGroupSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await additionalService.update(req.params.id!, establishmentId, body);
    notifyMenu(establishmentId);
    res.json(serialize(result));
  },

  async delete(req: Request, res: Response) {
    const establishmentId = req.user!.establishmentId;
    const result = await additionalService.delete(req.params.id!, establishmentId);
    notifyMenu(establishmentId);
    if (result.softDeleted) {
      res.json(serialize(result));
      return;
    }
    res.status(204).send();
  },

  async createAdditional(req: Request, res: Response) {
    const body = createAdditionalSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await additionalService.createAdditional(
      req.params.id!,
      establishmentId,
      body,
    );
    notifyMenu(establishmentId);
    res.status(201).json(serialize(result));
  },

  async updateAdditional(req: Request, res: Response) {
    const body = updateAdditionalSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await additionalService.updateAdditional(
      req.params.additionalId!,
      establishmentId,
      body,
    );
    notifyMenu(establishmentId);
    res.json(serialize(result));
  },

  async deleteAdditional(req: Request, res: Response) {
    const establishmentId = req.user!.establishmentId;
    await additionalService.deleteAdditional(req.params.additionalId!, establishmentId);
    notifyMenu(establishmentId);
    res.status(204).send();
  },

  async linkProduct(req: Request, res: Response) {
    const body = linkProductToGroupSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await additionalService.linkProduct(req.params.id!, establishmentId, body);
    notifyMenu(establishmentId);
    res.status(201).json(serialize(result));
  },

  async unlinkProduct(req: Request, res: Response) {
    const establishmentId = req.user!.establishmentId;
    await additionalService.unlinkProduct(
      req.params.id!,
      establishmentId,
      req.params.productId!,
    );
    notifyMenu(establishmentId);
    res.status(204).send();
  },
};
