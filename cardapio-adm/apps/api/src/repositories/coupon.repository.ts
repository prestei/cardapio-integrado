import { CouponType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const couponRepository = {
  findAll(establishmentId: string, filters: { includeArchived?: boolean; search?: string } = {}) {
    const where: Prisma.CouponWhereInput = {
      establishmentId,
      ...(filters.includeArchived ? {} : { isArchived: false }),
      ...(filters.search
        ? {
            OR: [
              { code: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string, establishmentId: string) {
    return prisma.coupon.findFirst({ where: { id, establishmentId } });
  },

  findByCode(establishmentId: string, code: string) {
    return prisma.coupon.findFirst({
      where: { establishmentId, code: { equals: code, mode: 'insensitive' } },
    });
  },

  create(
    establishmentId: string,
    data: {
      code: string;
      description?: string;
      type: CouponType;
      value: number;
      minOrderValue?: number | null;
      startsAt?: Date | null;
      endsAt?: Date | null;
      usageLimit?: number | null;
      perCustomerLimit?: number | null;
      isActive?: boolean;
    },
  ) {
    return prisma.coupon.create({
      data: {
        establishmentId,
        code: data.code,
        description: data.description,
        type: data.type,
        value: new Prisma.Decimal(data.value),
        minOrderValue: data.minOrderValue != null ? new Prisma.Decimal(data.minOrderValue) : null,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        usageLimit: data.usageLimit ?? null,
        perCustomerLimit: data.perCustomerLimit ?? null,
        isActive: data.isActive,
      },
    });
  },

  update(
    id: string,
    establishmentId: string,
    data: {
      code?: string;
      description?: string;
      type?: CouponType;
      value?: number;
      minOrderValue?: number | null;
      startsAt?: Date | null;
      endsAt?: Date | null;
      usageLimit?: number | null;
      perCustomerLimit?: number | null;
      isActive?: boolean;
    },
  ) {
    const updateData: Prisma.CouponUpdateInput = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = new Prisma.Decimal(data.value);
    if (data.minOrderValue !== undefined) {
      updateData.minOrderValue =
        data.minOrderValue != null ? new Prisma.Decimal(data.minOrderValue) : null;
    }
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
    if (data.endsAt !== undefined) updateData.endsAt = data.endsAt;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.perCustomerLimit !== undefined) updateData.perCustomerLimit = data.perCustomerLimit;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.coupon
      .updateMany({ where: { id, establishmentId }, data: updateData })
      .then(() => this.findById(id, establishmentId));
  },

  setArchived(id: string, establishmentId: string, isArchived: boolean) {
    return prisma.coupon
      .updateMany({ where: { id, establishmentId }, data: { isArchived } })
      .then(() => this.findById(id, establishmentId));
  },

  delete(id: string, establishmentId: string) {
    return prisma.coupon.deleteMany({ where: { id, establishmentId } });
  },
};
