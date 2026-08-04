import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface BannerData {
  title?: string;
  subtitle?: string | null;
  imageUrl?: string;
  buttonLabel?: string | null;
  linkUrl?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  sortOrder?: number;
  showDesktop?: boolean;
  showMobile?: boolean;
  isActive?: boolean;
}

export const bannerRepository = {
  findAll(establishmentId: string, filters: { includeInactive?: boolean } = {}) {
    return prisma.banner.findMany({
      where: {
        establishmentId,
        ...(filters.includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  },

  findById(id: string, establishmentId: string) {
    return prisma.banner.findFirst({ where: { id, establishmentId } });
  },

  create(establishmentId: string, data: BannerData & { title: string; imageUrl: string }) {
    return prisma.banner.create({
      data: {
        establishmentId,
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        buttonLabel: data.buttonLabel,
        linkUrl: data.linkUrl,
        productId: data.productId,
        categoryId: data.categoryId,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        sortOrder: data.sortOrder,
        showDesktop: data.showDesktop,
        showMobile: data.showMobile,
        isActive: data.isActive,
      },
    });
  },

  update(id: string, establishmentId: string, data: BannerData) {
    const updateData: Prisma.BannerUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.buttonLabel !== undefined) updateData.buttonLabel = data.buttonLabel;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
    if (data.productId !== undefined) updateData.productId = data.productId;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
    if (data.endsAt !== undefined) updateData.endsAt = data.endsAt;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.showDesktop !== undefined) updateData.showDesktop = data.showDesktop;
    if (data.showMobile !== undefined) updateData.showMobile = data.showMobile;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.banner
      .updateMany({ where: { id, establishmentId }, data: updateData })
      .then(() => this.findById(id, establishmentId));
  },

  delete(id: string, establishmentId: string) {
    return prisma.banner.deleteMany({ where: { id, establishmentId } });
  },

  registerView(id: string) {
    return prisma.banner.update({ where: { id }, data: { views: { increment: 1 } } });
  },

  registerClick(id: string) {
    return prisma.banner.update({ where: { id }, data: { clicks: { increment: 1 } } });
  },

  findActiveForPublic(establishmentId: string) {
    const now = new Date();
    return prisma.banner.findMany({
      where: {
        establishmentId,
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: 'asc' }],
    });
  },
};
