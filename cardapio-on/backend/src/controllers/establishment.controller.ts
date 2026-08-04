import type { Request, Response } from 'express';
import { z } from 'zod';
import { establishmentService } from '../services/establishment.service.js';
import { serialize } from '../utils/serialize.js';

const updateEstablishmentSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('E-mail inválido.').optional(),
  address: z.string().optional(),
  cnpj: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  isOpen: z.boolean().optional(),
});

export const establishmentController = {
  async get(req: Request, res: Response) {
    const result = await establishmentService.get(req.user!.establishmentId);
    res.json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateEstablishmentSchema.parse(req.body);
    const result = await establishmentService.update(req.user!.establishmentId, {
      ...body,
      logoUrl: body.logoUrl === '' ? undefined : body.logoUrl,
      bannerUrl: body.bannerUrl === '' ? undefined : body.bannerUrl,
    });
    res.json(serialize(result));
  },
};
