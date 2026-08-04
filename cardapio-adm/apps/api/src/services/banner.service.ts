import { bannerRepository } from '../repositories/banner.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateBannerInput,
  ListBannersQuery,
  UpdateBannerInput,
} from '../validators/banner.schemas.js';

function parseDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

export const bannerService = {
  async list(establishmentId: string, filters: ListBannersQuery) {
    return bannerRepository.findAll(establishmentId, filters);
  },

  async getById(id: string, establishmentId: string) {
    const banner = await bannerRepository.findById(id, establishmentId);
    if (!banner) {
      throw new AppError('Banner não encontrado.', 404);
    }
    return banner;
  },

  async create(establishmentId: string, input: CreateBannerInput) {
    return bannerRepository.create(establishmentId, {
      ...input,
      startsAt: parseDate(input.startsAt) ?? null,
      endsAt: parseDate(input.endsAt) ?? null,
    });
  },

  async update(id: string, establishmentId: string, input: UpdateBannerInput) {
    await this.getById(id, establishmentId);
    return bannerRepository.update(id, establishmentId, {
      ...input,
      startsAt: parseDate(input.startsAt),
      endsAt: parseDate(input.endsAt),
    });
  },

  async delete(id: string, establishmentId: string) {
    await this.getById(id, establishmentId);
    const result = await bannerRepository.delete(id, establishmentId);
    if (result.count === 0) {
      throw new AppError('Banner não encontrado.', 404);
    }
  },

  async listActiveForPublic(establishmentId: string) {
    const banners = await bannerRepository.findActiveForPublic(establishmentId);
    return banners.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.imageUrl,
      buttonLabel: b.buttonLabel,
      linkUrl: b.linkUrl,
      productId: b.productId,
      categoryId: b.categoryId,
      showDesktop: b.showDesktop,
      showMobile: b.showMobile,
      sortOrder: b.sortOrder,
    }));
  },

  async registerView(id: string) {
    await bannerRepository.registerView(id).catch(() => undefined);
  },

  async registerClick(id: string) {
    await bannerRepository.registerClick(id).catch(() => undefined);
  },
};
