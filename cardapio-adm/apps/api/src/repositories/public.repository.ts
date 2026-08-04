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
          // Inclui disponíveis e indisponíveis para o frontend aplicar a regra visual.
          // Produtos excluídos (DELETE) não aparecem — removidos do banco.
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

  findCustomerByPhone(establishmentId: string, phone: string) {
    return prisma.customer.findUnique({
      where: { establishmentId_phone: { establishmentId, phone } },
    });
  },

  countCouponUsagesForCustomer(couponId: string, customerId: string) {
    return prisma.couponUsage.count({ where: { couponId, customerId } });
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

  countScheduledOrdersInSlot(establishmentId: string, slotStart: Date, slotEnd: Date) {
    return prisma.order.count({
      where: {
        establishmentId,
        isScheduled: true,
        scheduledFor: { gte: slotStart, lt: slotEnd },
        status: { not: 'CANCELLED' },
      },
    });
  },

  findOrderForPayment(establishmentId: string, code: string) {
    const normalized = code.startsWith('#') ? code : `#${code}`;
    return prisma.order.findFirst({
      where: {
        establishmentId,
        OR: [{ code }, { code: normalized }, { code: code.replace(/^#/, '') }],
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        payment: true,
      },
    });
  },

  getNextOrderCode(establishmentId: string) {
    return prisma.order.findFirst({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
      select: { code: true },
    });
  },

  listFavorites(establishmentId: string, phone: string) {
    return prisma.customerFavorite.findMany({
      where: { establishmentId, phone },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            category: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  addFavorite(establishmentId: string, phone: string, productId: string, customerId?: string | null) {
    return prisma.customerFavorite.upsert({
      where: { establishmentId_phone_productId: { establishmentId, phone, productId } },
      create: { establishmentId, phone, productId, customerId },
      update: {},
      include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } },
    });
  },

  removeFavorite(establishmentId: string, phone: string, productId: string) {
    return prisma.customerFavorite.deleteMany({ where: { establishmentId, phone, productId } });
  },

  findCustomerOrders(establishmentId: string, phone: string) {
    return prisma.order.findMany({
      where: { establishmentId, customer: { phone } },
      orderBy: { createdAt: 'desc' },
      include: {
        payment: { select: { method: true, status: true, amount: true } },
        items: {
          include: {
            additionals: { select: { name: true, price: true } },
            product: { select: { id: true, imageUrl: true } },
          },
        },
      },
    });
  },

  findOrderForReorder(establishmentId: string, orderId: string, phone: string) {
    return prisma.order.findFirst({
      where: { id: orderId, establishmentId, customer: { phone } },
      include: {
        items: {
          include: { additionals: { select: { name: true, additionalId: true } } },
        },
      },
    });
  },
};
