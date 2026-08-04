import type { Request, Response } from 'express';
import { orderService } from '../services/order.service.js';
import { listOrdersSchema, updateOrderStatusSchema } from '../validators/order.schemas.js';
import { serialize } from '../utils/serialize.js';

export const orderController = {
  async list(req: Request, res: Response) {
    const filters = listOrdersSchema.parse(req.query);
    const result = await orderService.list(req.user!.establishmentId, filters);
    res.json(serialize(result));
  },

  async getById(req: Request, res: Response) {
    const result = await orderService.getById(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async updateStatus(req: Request, res: Response) {
    const body = updateOrderStatusSchema.parse(req.body);
    const result = await orderService.updateStatus(
      req.params.id!,
      req.user!.establishmentId,
      body,
      req.user!.userId,
    );
    res.json(serialize(result));
  },
};
