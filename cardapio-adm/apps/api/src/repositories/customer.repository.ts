import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface CustomerFilters {
  search?: string;
  isActive?: boolean;
  page: number;
  pageSize: number;
}

export const customerRepository = {
  async findAll(establishmentId: string, filters: CustomerFilters) {
    const where: Prisma.CustomerWhereInput = {
      establishmentId,
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { phone: { contains: filters.search } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        include: {
          _count: { select: { orders: true, addresses: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string, establishmentId: string) {
    return prisma.customer.findFirst({
      where: { id, establishmentId },
      include: {
        addresses: { orderBy: { isDefault: 'desc' } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            payment: { select: { method: true, status: true } },
          },
        },
      },
    });
  },

  findByPhone(establishmentId: string, phone: string) {
    return prisma.customer.findUnique({
      where: { establishmentId_phone: { establishmentId, phone } },
    });
  },

  update(
    id: string,
    establishmentId: string,
    data: {
      name?: string;
      phone?: string;
      email?: string | null;
      notes?: string;
      isActive?: boolean;
    },
  ) {
    return prisma.customer
      .updateMany({ where: { id, establishmentId }, data })
      .then(() => this.findById(id, establishmentId));
  },

  async orderStatsByCustomerIds(establishmentId: string, customerIds: string[]) {
    if (customerIds.length === 0) return new Map<string, { totalOrders: number; totalSpent: number; lastOrderAt: Date | null }>();

    const groups = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        establishmentId,
        customerId: { in: customerIds },
        status: { not: OrderStatus.CANCELLED },
      },
      _count: { id: true },
      _sum: { total: true },
      _max: { createdAt: true },
    });

    const map = new Map<string, { totalOrders: number; totalSpent: number; lastOrderAt: Date | null }>();
    for (const group of groups) {
      if (!group.customerId) continue;
      map.set(group.customerId, {
        totalOrders: group._count.id,
        totalSpent: Number(group._sum.total ?? 0),
        lastOrderAt: group._max.createdAt,
      });
    }
    return map;
  },
};
