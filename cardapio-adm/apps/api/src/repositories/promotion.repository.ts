import { Prisma, PromotionStatus, PromotionType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface PromotionData {
  name?: string;
  description?: string;
  type?: PromotionType;
  value?: number;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  imageUrl?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  startTime?: string | null;
  endTime?: string | null;
  usageLimit?: number | null;
  priority?: number;
  sortOrder?: number;
  status?: PromotionStatus;
  isActive?: boolean;
  productIds?: string[];
  categoryIds?: string[];
}

const includeLinks = {
  products: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
  categories: { include: { category: { select: { id: true, name: true } } } },
};

export const promotionRepository = {
  findAll(
    establishmentId: string,
    filters: { status?: PromotionStatus; search?: string; includeInactive?: boolean } = {},
  ) {
    const where: Prisma.PromotionWhereInput = {
      establishmentId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.includeInactive ? {} : { isActive: true }),
      ...(filters.search
        ? { name: { contains: filters.search, mode: 'insensitive' } }
        : {}),
    };

    return prisma.promotion.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: includeLinks,
    });
  },

  findById(id: string, establishmentId: string) {
    return prisma.promotion.findFirst({
      where: { id, establishmentId },
      include: includeLinks,
    });
  },

  create(establishmentId: string, data: PromotionData & { name: string; type: PromotionType }) {
    return prisma.promotion.create({
      data: {
        establishmentId,
        name: data.name,
        description: data.description,
        type: data.type,
        value: new Prisma.Decimal(data.value ?? 0),
        buyQuantity: data.buyQuantity ?? null,
        getQuantity: data.getQuantity ?? null,
        imageUrl: data.imageUrl || null,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        usageLimit: data.usageLimit ?? null,
        priority: data.priority,
        sortOrder: data.sortOrder,
        status: data.status,
        isActive: data.isActive,
        products: data.productIds?.length
          ? { create: data.productIds.map((productId) => ({ productId })) }
          : undefined,
        categories: data.categoryIds?.length
          ? { create: data.categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      include: includeLinks,
    });
  },

  async update(id: string, establishmentId: string, data: PromotionData) {
    const updateData: Prisma.PromotionUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = new Prisma.Decimal(data.value);
    if (data.buyQuantity !== undefined) updateData.buyQuantity = data.buyQuantity;
    if (data.getQuantity !== undefined) updateData.getQuantity = data.getQuantity;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
    if (data.endsAt !== undefined) updateData.endsAt = data.endsAt;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.$transaction(async (tx) => {
      await tx.promotion.updateMany({ where: { id, establishmentId }, data: updateData });

      if (data.productIds !== undefined) {
        await tx.promotionProduct.deleteMany({ where: { promotionId: id } });
        if (data.productIds.length) {
          await tx.promotionProduct.createMany({
            data: data.productIds.map((productId) => ({ promotionId: id, productId })),
          });
        }
      }

      if (data.categoryIds !== undefined) {
        await tx.promotionCategory.deleteMany({ where: { promotionId: id } });
        if (data.categoryIds.length) {
          await tx.promotionCategory.createMany({
            data: data.categoryIds.map((categoryId) => ({ promotionId: id, categoryId })),
          });
        }
      }
    });

    return this.findById(id, establishmentId);
  },

  delete(id: string, establishmentId: string) {
    return prisma.promotion.deleteMany({ where: { id, establishmentId } });
  },

  findActiveForPublic(establishmentId: string) {
    const now = new Date();
    return prisma.promotion.findMany({
      where: {
        establishmentId,
        isActive: true,
        status: PromotionStatus.ACTIVE,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ priority: 'desc' }, { sortOrder: 'asc' }],
      include: includeLinks,
    });
  },
};
