import { prisma } from '../lib/prisma.js';

export const publicRepository = {
  findEstablishmentBySlug(slug: string) {
    return prisma.establishment.findFirst({
      where: {
        OR: [{ slug }, { settings: { publicMenuSlug: slug } }],
      },
      include: {
        businessHours: { orderBy: { dayOfWeek: 'asc' } },
        settings: true,
        deliveryZones: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });
  },

  findMenu(establishmentId: string) {
    return prisma.category.findMany({
      where: {
        establishmentId,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        products: {
          where: {},
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            additionalGroups: {
              include: {
                additionalGroup: {
                  include: {
                    additionals: {
                      where: { isAvailable: true },
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  findProduct(productId: string, establishmentId: string) {
    return prisma.product.findFirst({
      where: { id: productId, establishmentId },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        additionalGroups: {
          include: {
            additionalGroup: {
              include: {
                additionals: {
                  where: { isAvailable: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  },

  findCouponByCode(establishmentId: string, code: string) {
    return prisma.coupon.findFirst({
      where: {
        establishmentId,
        code: { equals: code, mode: 'insensitive' },
      },
    });
  },

  findDeliveryZone(establishmentId: string, neighborhood: string) {
    return prisma.deliveryZone.findFirst({
      where: {
        establishmentId,
        isActive: true,
        name: { equals: neighborhood, mode: 'insensitive' },
      },
    });
  },

  findActiveDeliveryZones(establishmentId: string) {
    return prisma.deliveryZone.findMany({
      where: { establishmentId, isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  findOrderByCode(establishmentId: string, code: string) {
    const normalized = code.startsWith('#') ? code : `#${code}`;
    return prisma.order.findFirst({
      where: {
        establishmentId,
        OR: [{ code }, { code: normalized }, { code: code.replace(/^#/, '') }],
      },
      include: {
        customer: { select: { name: true, phone: true } },
        address: {
          select: {
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
        payment: { select: { method: true, status: true, amount: true } },
        items: {
          include: {
            additionals: { select: { name: true, price: true } },
            product: { select: { imageUrl: true } },
          },
        },
      },
    });
  },

  async getNextOrderCode(establishmentId: string) {
    const orders = await prisma.order.findMany({
      where: { establishmentId },
      select: { code: true },
    });

    if (orders.length === 0) return null;

    let maxCode = orders[0]!.code;
    let maxNum = Number(maxCode.replace(/\D/g, '') || '0');

    for (const order of orders) {
      const num = Number(order.code.replace(/\D/g, '') || '0');
      if (num > maxNum) {
        maxNum = num;
        maxCode = order.code;
      }
    }

    return { code: maxCode };
  },
};
