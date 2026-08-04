import { campaignRepository } from '../repositories/campaign.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateCampaignInput,
  ListCampaignsQuery,
  UpdateCampaignInput,
} from '../validators/campaign.schemas.js';

function parseDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

export const campaignService = {
  async list(establishmentId: string, filters: ListCampaignsQuery) {
    return campaignRepository.findAll(establishmentId, filters);
  },

  async getById(id: string, establishmentId: string) {
    const campaign = await campaignRepository.findById(id, establishmentId);
    if (!campaign) {
      throw new AppError('Campanha não encontrada.', 404);
    }
    return campaign;
  },

  async create(establishmentId: string, input: CreateCampaignInput) {
    return campaignRepository.create(establishmentId, {
      ...input,
      startsAt: parseDate(input.startsAt) ?? null,
      endsAt: parseDate(input.endsAt) ?? null,
    });
  },

  async update(id: string, establishmentId: string, input: UpdateCampaignInput) {
    await this.getById(id, establishmentId);
    return campaignRepository.update(id, establishmentId, {
      ...input,
      startsAt: parseDate(input.startsAt),
      endsAt: parseDate(input.endsAt),
    });
  },

  async delete(id: string, establishmentId: string) {
    await this.getById(id, establishmentId);
    const result = await campaignRepository.delete(id, establishmentId);
    if (result.count === 0) {
      throw new AppError('Campanha não encontrada.', 404);
    }
  },
};
