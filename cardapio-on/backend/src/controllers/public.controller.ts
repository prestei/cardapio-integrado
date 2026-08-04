import type { Request, Response } from 'express';
import { publicService } from '../services/public.service.js';
import {
  calculateDeliverySchema,
  createPublicOrderSchema,
  validateCouponSchema,
} from '../validators/public.schemas.js';
import { serialize } from '../utils/serialize.js';

export const publicController = {
  async getMenu(req: Request, res: Response) {
    const result = await publicService.getMenu(req.params.slug!);
    res.json(serialize(result));
  },

  async getProduct(req: Request, res: Response) {
    const result = await publicService.getProduct(req.params.slug!, req.params.productId!);
    res.json(serialize(result));
  },

  async validateCoupon(req: Request, res: Response) {
    const body = validateCouponSchema.parse(req.body);
    const result = await publicService.validateCoupon(req.params.slug!, body);
    res.json(serialize(result));
  },

  async calculateDelivery(req: Request, res: Response) {
    const body = calculateDeliverySchema.parse(req.body);
    const result = await publicService.calculateDelivery(req.params.slug!, body);
    res.json(serialize(result));
  },

  async createOrder(req: Request, res: Response) {
    const body = createPublicOrderSchema.parse(req.body);
    const result = await publicService.createOrder(req.params.slug!, body);
    res.status(201).json(serialize(result));
  },

  async trackOrder(req: Request, res: Response) {
    const result = await publicService.trackOrder(req.params.slug!, req.params.code!);
    res.json(serialize(result));
  },
};
