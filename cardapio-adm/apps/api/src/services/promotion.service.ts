import { promotionRepository } from '../repositories/promotion.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreatePromotionInput,
  ListPromotionsQuery,
  UpdatePromotionInput,
} from '../validators/promotion.schemas.js';

function parseDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function isWithinTimeWindow(startTime: string | null, endTime: string | null): boolean {
  if (!startTime || !endTime) return true;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const start = parseTimeToMinutes(startTime);
  let end = parseTimeToMinutes(endTime);
  let current = nowMinutes;
  if (end <= start) end += 24 * 60;
  if (current < start) current += 24 * 60;
  return current >= start && current < end;
}

export const promotionService = {
  async list(establishmentId: string, filters: ListPromotionsQuery) {
    return promotionRepository.findAll(establishmentId, filters);
  },

  async getById(id: string, establishmentId: string) {
    const promotion = await promotionRepository.findById(id, establishmentId);
    if (!promotion) {
      throw new AppError('Promoção não encontrada.', 404);
    }
    return promotion;
  },

  async create(establishmentId: string, input: CreatePromotionInput) {
    return promotionRepository.create(establishmentId, {
      ...input,
      startsAt: parseDate(input.startsAt) ?? null,
      endsAt: parseDate(input.endsAt) ?? null,
    });
  },

  async update(id: string, establishmentId: string, input: UpdatePromotionInput) {
    await this.getById(id, establishmentId);
    return promotionRepository.update(id, establishmentId, {
      ...input,
      startsAt: parseDate(input.startsAt),
      endsAt: parseDate(input.endsAt),
    });
  },

  async delete(id: string, establishmentId: string) {
    await this.getById(id, establishmentId);
    const result = await promotionRepository.delete(id, establishmentId);
    if (result.count === 0) {
      throw new AppError('Promoção não encontrada.', 404);
    }
  },

  async listActiveForPublic(establishmentId: string) {
    const promotions = await promotionRepository.findActiveForPublic(establishmentId);
    return promotions
      .filter((p) => isWithinTimeWindow(p.startTime, p.endTime))
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.type,
        value: Number(p.value),
        buyQuantity: p.buyQuantity,
        getQuantity: p.getQuantity,
        imageUrl: p.imageUrl,
        startsAt: p.startsAt,
        endsAt: p.endsAt,
        startTime: p.startTime,
        endTime: p.endTime,
        priority: p.priority,
        products: p.products.map((link) => link.product),
        categories: p.categories.map((link) => link.category),
      }));
  },
};
