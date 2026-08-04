import type { Request, Response } from 'express';
import { categoryService } from '../services/category.service.js';
import {
  createCategorySchema,
  reorderCategoriesSchema,
  updateCategorySchema,
} from '../validators/category.schemas.js';
import { serialize } from '../utils/serialize.js';

export const categoryController = {
  async list(req: Request, res: Response) {
    const result = await categoryService.list(req.user!.establishmentId);
    res.json(serialize(result));
  },

  async getById(req: Request, res: Response) {
    const result = await categoryService.getById(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async create(req: Request, res: Response) {
    const body = createCategorySchema.parse(req.body);
    const result = await categoryService.create(req.user!.establishmentId, body);
    res.status(201).json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateCategorySchema.parse(req.body);
    const result = await categoryService.update(req.params.id!, req.user!.establishmentId, body);
    res.json(serialize(result));
  },

  async delete(req: Request, res: Response) {
    await categoryService.delete(req.params.id!, req.user!.establishmentId);
    res.status(204).send();
  },

  async reorder(req: Request, res: Response) {
    const body = reorderCategoriesSchema.parse(req.body);
    const result = await categoryService.reorder(req.user!.establishmentId, body);
    res.json(serialize(result));
  },
};
