import type { Request, Response } from 'express';
import { deliveryService } from '../services/delivery.service.js';
import {
  assignCourierSchema,
  createDeliveryZoneSchema,
  listDeliveriesQuerySchema,
  updateDeliveryTimesSchema,
  updateDeliveryZoneSchema,
} from '../validators/delivery.schemas.js';
import { serialize } from '../utils/serialize.js';
import { menuEvents } from '../lib/menuEvents.js';

function notifyMenu(establishmentId: string) {
  menuEvents.publish('menu:updated', establishmentId);
}

export const deliveryController = {
  async listZones(req: Request, res: Response) {
    const result = await deliveryService.listZones(req.user!.establishmentId);
    res.json(serialize(result));
  },

  async getZone(req: Request, res: Response) {
    const result = await deliveryService.getZone(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async createZone(req: Request, res: Response) {
    const body = createDeliveryZoneSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await deliveryService.createZone(establishmentId, body);
    notifyMenu(establishmentId);
    res.status(201).json(serialize(result));
  },

  async updateZone(req: Request, res: Response) {
    const body = updateDeliveryZoneSchema.parse(req.body);
    const establishmentId = req.user!.establishmentId;
    const result = await deliveryService.updateZone(req.params.id!, establishmentId, body);
    notifyMenu(establishmentId);
    res.json(serialize(result));
  },

  async deleteZone(req: Request, res: Response) {
    const establishmentId = req.user!.establishmentId;
    await deliveryService.deleteZone(req.params.id!, establishmentId);
    notifyMenu(establishmentId);
    res.status(204).send();
  },

  async listDeliveries(req: Request, res: Response) {
    const filters = listDeliveriesQuerySchema.parse(req.query);
    const result = await deliveryService.listDeliveries(req.user!.establishmentId, filters);
    res.json(serialize(result));
  },

  async getDelivery(req: Request, res: Response) {
    const result = await deliveryService.getDelivery(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async assignCourier(req: Request, res: Response) {
    const body = assignCourierSchema.parse(req.body);
    const result = await deliveryService.assignCourier(
      req.params.id!,
      req.user!.establishmentId,
      body,
    );
    res.json(serialize(result));
  },

  async updateTimes(req: Request, res: Response) {
    const body = updateDeliveryTimesSchema.parse(req.body);
    const result = await deliveryService.updateTimes(
      req.params.id!,
      req.user!.establishmentId,
      body,
    );
    res.json(serialize(result));
  },
};
