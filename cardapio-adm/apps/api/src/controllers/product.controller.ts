import type { Request, Response } from 'express';
import { productService } from '../services/product.service.js';
import {
  createProductSchema,
  updateProductPriceSchema,
  updateProductSchema,
  reorderProductsSchema,
} from '../validators/product.schemas.js';
import { serialize } from '../utils/serialize.js';
import { menuEvents, type MenuEventType } from '../lib/menuEvents.js';

function notifyMenu(establishmentId: string, type: MenuEventType) {
  menuEvents.publish(type, establishmentId);
}

export const productController = {
  async list(req: Request, res: Response) {
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
    const result = await productService.list(req.user!.establishmentId, categoryId);
    res.json(serialize(result));
  },

  async getById(req: Request, res: Response) {
    const result = await productService.getById(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async create(req: Request, res: Response) {
    const body = createProductSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await productService.create(establishmentId, body);
    notifyMenu(establishmentId, 'product:created');
    res.status(201).json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateProductSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await productService.update(req.params.id!, establishmentId, body);
    const eventType: MenuEventType =
      body.isAvailable !== undefined
        ? 'product:availability-changed'
        : 'product:updated';
    notifyMenu(establishmentId, eventType);
    res.json(serialize(result));
  },

  async delete(req: Request, res: Response) {
    const establishmentId = req.user!.establishmentId;
    await productService.delete(req.params.id!, establishmentId);
    notifyMenu(establishmentId, 'product:deleted');
    res.status(204).send();
  },

  async duplicate(req: Request, res: Response) {
    const establishmentId = req.user!.establishmentId;
    const result = await productService.duplicate(req.params.id!, establishmentId);
    notifyMenu(establishmentId, 'product:created');
    res.status(201).json(serialize(result));
  },

  async updatePrice(req: Request, res: Response) {
    const body = updateProductPriceSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await productService.updatePrice(req.params.id!, establishmentId, body);
    notifyMenu(establishmentId, 'product:updated');
    res.json(serialize(result));
  },

  async reorder(req: Request, res: Response) {
    const body = reorderProductsSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await productService.reorder(establishmentId, body);
    notifyMenu(establishmentId, 'product:updated');
    res.json(serialize(result));
  },
};
