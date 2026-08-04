import type { Request, Response } from 'express';
import { productService } from '../services/product.service.js';
import {
  createProductSchema,
  updateProductPriceSchema,
  updateProductSchema,
} from '../validators/product.schemas.js';
import { serialize } from '../utils/serialize.js';

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
    const result = await productService.create(req.user!.establishmentId, body);
    res.status(201).json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateProductSchema.parse(req.body);
    const result = await productService.update(req.params.id!, req.user!.establishmentId, body);
    res.json(serialize(result));
  },

  async delete(req: Request, res: Response) {
    await productService.delete(req.params.id!, req.user!.establishmentId);
    res.status(204).send();
  },

  async duplicate(req: Request, res: Response) {
    const result = await productService.duplicate(req.params.id!, req.user!.establishmentId);
    res.status(201).json(serialize(result));
  },

  async updatePrice(req: Request, res: Response) {
    const body = updateProductPriceSchema.parse(req.body);
    const result = await productService.updatePrice(req.params.id!, req.user!.establishmentId, body);
    res.json(serialize(result));
  },
};
