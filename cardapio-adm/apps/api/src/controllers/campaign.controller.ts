import type { Request, Response } from 'express';
import { campaignService } from '../services/campaign.service.js';
import {
  createCampaignSchema,
  listCampaignsQuerySchema,
  updateCampaignSchema,
} from '../validators/campaign.schemas.js';
import { serialize } from '../utils/serialize.js';

export const campaignController = {
  async list(req: Request, res: Response) {
    const filters = listCampaignsQuerySchema.parse(req.query);
    const result = await campaignService.list(req.user!.establishmentId, filters);
    res.json(serialize(result));
  },

  async getById(req: Request, res: Response) {
    const result = await campaignService.getById(req.params.id!, req.user!.establishmentId);
    res.json(serialize(result));
  },

  async create(req: Request, res: Response) {
    const body = createCampaignSchema.parse(req.body);
    const result = await campaignService.create(req.user!.establishmentId, body);
    res.status(201).json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateCampaignSchema.parse(req.body);
    const result = await campaignService.update(req.params.id!, req.user!.establishmentId, body);
    res.json(serialize(result));
  },

  async delete(req: Request, res: Response) {
    await campaignService.delete(req.params.id!, req.user!.establishmentId);
    res.status(204).send();
  },
};
