import { z } from 'zod';

const campaignBase = z.object({
  name: z.string().min(2, 'Nome é obrigatório.'),
  objective: z.string().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  segment: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']).optional(),
  isActive: z.boolean().optional(),
  bannerIds: z.array(z.string().min(1)).optional(),
  promotionIds: z.array(z.string().min(1)).optional(),
});

export const createCampaignSchema = campaignBase;
export const updateCampaignSchema = campaignBase.partial();

export const listCampaignsQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;
