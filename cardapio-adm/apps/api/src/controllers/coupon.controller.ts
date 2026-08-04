import type { Request, Response } from 'express';
import { couponService } from '../services/coupon.service.js';
import {
  archiveCouponSchema,
  createCouponSchema,
  listCouponsQuerySchema,
  updateCouponSchema,
} from '../validators/coupon.schemas.js';
import { serialize } from '../utils/serialize.js';

export const couponController = {
  async list(req: Request, res: Response) {
    const filters = listCouponsQuerySchema.parse(req.query);
    const result = await couponService.list(req.user!.establishmentId, filters);
    res.json(serialize(result));
  },

  async getById(req: Request, res: Response) {
    const result = await couponService.getById(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async create(req: Request, res: Response) {
    const body = createCouponSchema.parse(req.body);
    const result = await couponService.create(req.user!.establishmentId, body);
    res.status(201).json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateCouponSchema.parse(req.body);
    const result = await couponService.update(req.params.id!, req.user!.establishmentId, body);
    res.json(serialize(result));
  },

  async archive(req: Request, res: Response) {
    const body = archiveCouponSchema.parse(req.body);
    const result = await couponService.setArchived(
      req.params.id!,
      req.user!.establishmentId,
      body.isArchived,
    );
    res.json(serialize(result));
  },

  async delete(req: Request, res: Response) {
    await couponService.delete(req.params.id!, req.user!.establishmentId);
    res.status(204).send();
  },
};
