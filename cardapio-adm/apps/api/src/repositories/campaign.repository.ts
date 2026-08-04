import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface CampaignData {
  name?: string;
  objective?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  segment?: string | null;
  status?: string;
  isActive?: boolean;
  bannerIds?: string[];
  promotionIds?: string[];
}

const includeLinks = {
  banners: { include: { banner: true } },
  promotions: { include: { promotion: true } },
};

export const campaignRepository = {
  findAll(establishmentId: string, filters: { status?: string; search?: string } = {}) {
    const where: Prisma.CampaignWhereInput = {
      establishmentId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search ? { name: { contains: filters.search, mode: 'insensitive' } } : {}),
    };

    return prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: includeLinks,
    });
  },

  findById(id: string, establishmentId: string) {
    return prisma.campaign.findFirst({ where: { id, establishmentId }, include: includeLinks });
  },

  create(establishmentId: string, data: CampaignData & { name: string }) {
    return prisma.campaign.create({
      data: {
        establishmentId,
        name: data.name,
        objective: data.objective,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        segment: data.segment,
        status: data.status,
        isActive: data.isActive,
        banners: data.bannerIds?.length
          ? { create: data.bannerIds.map((bannerId) => ({ bannerId })) }
          : undefined,
        promotions: data.promotionIds?.length
          ? { create: data.promotionIds.map((promotionId) => ({ promotionId })) }
          : undefined,
      },
      include: includeLinks,
    });
  },

  async update(id: string, establishmentId: string, data: CampaignData) {
    const updateData: Prisma.CampaignUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.objective !== undefined) updateData.objective = data.objective;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
    if (data.endsAt !== undefined) updateData.endsAt = data.endsAt;
    if (data.segment !== undefined) updateData.segment = data.segment;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.$transaction(async (tx) => {
      await tx.campaign.updateMany({ where: { id, establishmentId }, data: updateData });

      if (data.bannerIds !== undefined) {
        await tx.campaignBanner.deleteMany({ where: { campaignId: id } });
        if (data.bannerIds.length) {
          await tx.campaignBanner.createMany({
            data: data.bannerIds.map((bannerId) => ({ campaignId: id, bannerId })),
          });
        }
      }

      if (data.promotionIds !== undefined) {
        await tx.campaignPromotion.deleteMany({ where: { campaignId: id } });
        if (data.promotionIds.length) {
          await tx.campaignPromotion.createMany({
            data: data.promotionIds.map((promotionId) => ({ campaignId: id, promotionId })),
          });
        }
      }
    });

    return this.findById(id, establishmentId);
  },

  delete(id: string, establishmentId: string) {
    return prisma.campaign.deleteMany({ where: { id, establishmentId } });
  },
};
