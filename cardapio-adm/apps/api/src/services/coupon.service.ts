import { couponRepository } from '../repositories/coupon.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateCouponInput,
  ListCouponsQuery,
  UpdateCouponInput,
} from '../validators/coupon.schemas.js';

function parseDate(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

export const couponService = {
  async list(establishmentId: string, filters: ListCouponsQuery) {
    return couponRepository.findAll(establishmentId, filters);
  },

  async getById(id: string, establishmentId: string) {
    const coupon = await couponRepository.findById(id, establishmentId);
    if (!coupon) {
      throw new AppError('Cupom não encontrado.', 404);
    }
    return coupon;
  },

  async create(establishmentId: string, input: CreateCouponInput) {
    const existing = await couponRepository.findByCode(establishmentId, input.code);
    if (existing) {
      throw new AppError('Já existe um cupom com este código.', 409);
    }

    return couponRepository.create(establishmentId, {
      ...input,
      startsAt: parseDate(input.startsAt) ?? null,
      endsAt: parseDate(input.endsAt) ?? null,
    });
  },

  async update(id: string, establishmentId: string, input: UpdateCouponInput) {
    await this.getById(id, establishmentId);

    if (input.code) {
      const existing = await couponRepository.findByCode(establishmentId, input.code);
      if (existing && existing.id !== id) {
        throw new AppError('Já existe um cupom com este código.', 409);
      }
    }

    return couponRepository.update(id, establishmentId, {
      ...input,
      startsAt: parseDate(input.startsAt),
      endsAt: parseDate(input.endsAt),
    });
  },

  async setArchived(id: string, establishmentId: string, isArchived: boolean) {
    await this.getById(id, establishmentId);
    return couponRepository.setArchived(id, establishmentId, isArchived);
  },

  async delete(id: string, establishmentId: string) {
    const coupon = await this.getById(id, establishmentId);
    if (coupon.usageCount > 0) {
      throw new AppError(
        'Este cupom já foi utilizado e não pode ser excluído. Arquive-o em vez disso.',
        400,
      );
    }
    const result = await couponRepository.delete(id, establishmentId);
    if (result.count === 0) {
      throw new AppError('Cupom não encontrado.', 404);
    }
  },
};
