import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const establishmentRepository = {
  findById(id: string) {
    return prisma.establishment.findUnique({
      where: { id },
      include: {
        businessHours: { orderBy: [{ sortOrder: 'asc' }, { dayOfWeek: 'asc' }] },
        settings: true,
      },
    });
  },

  findBySlug(slug: string) {
    return prisma.establishment.findUnique({
      where: { slug },
    });
  },

  create(data: {
    name: string;
    slug: string;
    email?: string;
  }) {
    return prisma.establishment.create({ data });
  },

  update(
    id: string,
    data: {
      name?: string;
      displayName?: string;
      slug?: string;
      description?: string;
      phone?: string;
      whatsapp?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      cnpj?: string;
      logoUrl?: string;
      bannerUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      isOpen?: boolean;
      closedReason?: string | null;
    },
  ) {
    return prisma.establishment.update({
      where: { id },
      data,
      include: {
        businessHours: { orderBy: [{ sortOrder: 'asc' }, { dayOfWeek: 'asc' }] },
        settings: true,
      },
    });
  },

  upsertSettings(
    establishmentId: string,
    data: {
      deliveryFeeType?: string;
      fixedDeliveryFee?: number | null;
      minOrderValue?: number | null;
      minOrderDelivery?: number | null;
      minOrderMessage?: string | null;
      freeDeliveryAbove?: number | null;
      deliveryRadiusKm?: number | null;
      estimatedMinutes?: number | null;
      acceptCash?: boolean;
      acceptPix?: boolean;
      acceptCard?: boolean;
      acceptOnline?: boolean;
      acceptDelivery?: boolean;
      acceptPickup?: boolean;
      acceptDineIn?: boolean;
      allowScheduledOrders?: boolean;
      scheduleMinLeadMinutes?: number;
      publicMenuSlug?: string | null;
      themeMode?: string;
      cancellationPolicy?: string | null;
      deliveryPolicy?: string | null;
      privacyPolicy?: string | null;
      termsOfUse?: string | null;
      extraInfo?: string | null;
    },
  ) {
    const decimalFields = {
      fixedDeliveryFee:
        data.fixedDeliveryFee !== undefined
          ? data.fixedDeliveryFee != null
            ? new Prisma.Decimal(data.fixedDeliveryFee)
            : null
          : undefined,
      minOrderValue:
        data.minOrderValue !== undefined
          ? data.minOrderValue != null
            ? new Prisma.Decimal(data.minOrderValue)
            : null
          : undefined,
      minOrderDelivery:
        data.minOrderDelivery !== undefined
          ? data.minOrderDelivery != null
            ? new Prisma.Decimal(data.minOrderDelivery)
            : null
          : undefined,
      freeDeliveryAbove:
        data.freeDeliveryAbove !== undefined
          ? data.freeDeliveryAbove != null
            ? new Prisma.Decimal(data.freeDeliveryAbove)
            : null
          : undefined,
      deliveryRadiusKm:
        data.deliveryRadiusKm !== undefined
          ? data.deliveryRadiusKm != null
            ? new Prisma.Decimal(data.deliveryRadiusKm)
            : null
          : undefined,
    };

    const rest = {
      minOrderMessage: data.minOrderMessage,
      estimatedMinutes: data.estimatedMinutes,
      acceptCash: data.acceptCash,
      acceptPix: data.acceptPix,
      acceptCard: data.acceptCard,
      acceptOnline: data.acceptOnline,
      acceptDelivery: data.acceptDelivery,
      acceptPickup: data.acceptPickup,
      acceptDineIn: data.acceptDineIn,
      allowScheduledOrders: data.allowScheduledOrders,
      scheduleMinLeadMinutes: data.scheduleMinLeadMinutes,
      publicMenuSlug: data.publicMenuSlug,
      themeMode: data.themeMode,
      cancellationPolicy: data.cancellationPolicy,
      deliveryPolicy: data.deliveryPolicy,
      privacyPolicy: data.privacyPolicy,
      termsOfUse: data.termsOfUse,
      extraInfo: data.extraInfo,
    };

    return prisma.settings.upsert({
      where: { establishmentId },
      create: {
        establishmentId,
        deliveryFeeType: data.deliveryFeeType ?? 'FIXED',
        ...decimalFields,
        ...rest,
      },
      update: {
        ...(data.deliveryFeeType !== undefined ? { deliveryFeeType: data.deliveryFeeType } : {}),
        ...decimalFields,
        ...rest,
      },
    });
  },

  replaceBusinessHours(
    establishmentId: string,
    hours: Array<{
      dayOfWeek: number;
      openTime?: string | null;
      closeTime?: string | null;
      breakStart?: string | null;
      breakEnd?: string | null;
      isClosed?: boolean;
      sortOrder?: number;
    }>,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.businessHours.deleteMany({ where: { establishmentId } });
      await tx.businessHours.createMany({
        data: hours.map((h, index) => ({
          establishmentId,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime ?? null,
          closeTime: h.closeTime ?? null,
          breakStart: h.breakStart ?? null,
          breakEnd: h.breakEnd ?? null,
          isClosed: h.isClosed ?? false,
          sortOrder: h.sortOrder ?? index,
        })),
      });
      return tx.businessHours.findMany({
        where: { establishmentId },
        orderBy: [{ sortOrder: 'asc' }, { dayOfWeek: 'asc' }],
      });
    });
  },
};
