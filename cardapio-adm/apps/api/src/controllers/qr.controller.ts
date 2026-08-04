import type { Request, Response } from 'express';
import { qrService } from '../services/qr.service.js';
import { createQrCodeSchema, updateQrCodeSchema } from '../validators/qr.schemas.js';
import { serialize } from '../utils/serialize.js';

export const qrController = {
  async list(req: Request, res: Response) {
    const result = await qrService.list(req.user!.establishmentId);
    res.json(serialize(result));
  },

  async getById(req: Request, res: Response) {
    const result = await qrService.getById(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async create(req: Request, res: Response) {
    const body = createQrCodeSchema.parse(req.body);
    const result = await qrService.create(req.user!.establishmentId, body);
    res.status(201).json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateQrCodeSchema.parse(req.body);
    const result = await qrService.update(req.params.id!, req.user!.establishmentId, body);
    res.json(serialize(result));
  },

  async delete(req: Request, res: Response) {
    await qrService.delete(req.params.id!, req.user!.establishmentId);
    res.status(204).send();
  },
};
