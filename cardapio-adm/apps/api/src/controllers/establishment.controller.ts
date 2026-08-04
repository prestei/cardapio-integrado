import type { Request, Response } from 'express';
import { establishmentService } from '../services/establishment.service.js';
import {
  replaceBusinessHoursSchema,
  updateEstablishmentSchema,
  updateSettingsSchema,
} from '../validators/establishment.schemas.js';
import { serialize } from '../utils/serialize.js';

export const establishmentController = {
  async get(req: Request, res: Response) {
    const result = await establishmentService.get(req.user!.establishmentId);
    res.json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateEstablishmentSchema.parse(req.body);
    const result = await establishmentService.update(req.user!.establishmentId, body);
    res.json(serialize(result));
  },

  async updateSettings(req: Request, res: Response) {
    const body = updateSettingsSchema.parse(req.body);
    const result = await establishmentService.updateSettings(req.user!.establishmentId, body);
    res.json(serialize(result));
  },

  async replaceBusinessHours(req: Request, res: Response) {
    const body = replaceBusinessHoursSchema.parse(req.body);
    const result = await establishmentService.replaceBusinessHours(
      req.user!.establishmentId,
      body,
    );
    res.json(serialize(result));
  },
};
