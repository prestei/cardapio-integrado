import type { Request, Response } from 'express';
import { customerService } from '../services/customer.service.js';
import { listCustomersQuerySchema, updateCustomerSchema } from '../validators/customer.schemas.js';
import { serialize } from '../utils/serialize.js';

export const customerController = {
  async list(req: Request, res: Response) {
    const filters = listCustomersQuerySchema.parse(req.query);
    const result = await customerService.list(req.user!.establishmentId, filters);
    res.json(serialize(result));
  },

  async getById(req: Request, res: Response) {
    const result = await customerService.getById(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateCustomerSchema.parse(req.body);
    const result = await customerService.update(req.params.id!, req.user!.establishmentId, body);
    res.json(serialize(result));
  },
};
