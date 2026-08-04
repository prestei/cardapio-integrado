import { establishmentRepository } from '../repositories/establishment.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  ReplaceBusinessHoursInput,
  UpdateEstablishmentInput,
  UpdateSettingsInput,
} from '../validators/establishment.schemas.js';

export const establishmentService = {
  async get(establishmentId: string) {
    const establishment = await establishmentRepository.findById(establishmentId);
    if (!establishment) {
      throw new AppError('Estabelecimento não encontrado.', 404);
    }
    return establishment;
  },

  async update(establishmentId: string, input: UpdateEstablishmentInput) {
    await this.get(establishmentId);

    if (input.slug) {
      const existing = await establishmentRepository.findBySlug(input.slug);
      if (existing && existing.id !== establishmentId) {
        throw new AppError('Este slug já está em uso por outro estabelecimento.', 409);
      }
    }

    return establishmentRepository.update(establishmentId, {
      ...input,
      logoUrl: input.logoUrl === '' ? undefined : input.logoUrl,
      bannerUrl: input.bannerUrl === '' ? undefined : input.bannerUrl,
      email: input.email === '' ? undefined : input.email,
    });
  },

  async updateSettings(establishmentId: string, input: UpdateSettingsInput) {
    await this.get(establishmentId);
    await establishmentRepository.upsertSettings(establishmentId, input);
    return this.get(establishmentId);
  },

  async replaceBusinessHours(establishmentId: string, input: ReplaceBusinessHoursInput) {
    await this.get(establishmentId);
    return establishmentRepository.replaceBusinessHours(establishmentId, input.hours);
  },
};
