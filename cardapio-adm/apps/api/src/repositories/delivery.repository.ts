import { DeliveryZoneType, OrderStatus, OrderType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface DeliveryOrderFilters {
  status?: OrderStatus;
  search?: string;
  from?: Date;
  to?: Date;
  unassignedOnly?: boolean;
}

const deliveryOrderInclude = {
  customer: { select: { id: true, name: true, phone: true, email: true } },
  address: true,
  payment: true,
  assignedDelivery: { select: { id: true, name: true, phone: true, avatarUrl: true } },
} satisfies Prisma.OrderInclude;

export const deliveryRepository = {
  findZones(establishmentId: string) {
    return prisma.deliveryZone.findMany({
      where: { establishmentId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  },

  findZoneById(id: string, establishmentId: string) {
    return prisma.deliveryZone.findFirst({ where: { id, establishmentId } });
  },

  createZone(
    establishmentId: string,
    data: {
      name: string;
      zoneType?: DeliveryZoneType;
      fee: number;
      minOrderValue?: number | null;
      estimatedMinutes?: number | null;
      zipPrefix?: string;
      radiusKm?: number;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return prisma.deliveryZone.create({
      data: {
        establishmentId,
        name: data.name,
        zoneType: data.zoneType,
        fee: new Prisma.Decimal(data.fee),
        minOrderValue: data.minOrderValue != null ? new Prisma.Decimal(data.minOrderValue) : null,
        estimatedMinutes: data.estimatedMinutes,
        zipPrefix: data.zipPrefix,
        radiusKm: data.radiusKm != null ? new Prisma.Decimal(data.radiusKm) : null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
  },

  update(
    id: string,
    establishmentId: string,
    data: {
      name?: string;
      zoneType?: DeliveryZoneType;
      fee?: number;
      minOrderValue?: number | null;
      estimatedMinutes?: number | null;
      zipPrefix?: string;
      radiusKm?: number;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const updateData: Prisma.DeliveryZoneUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.zoneType !== undefined) updateData.zoneType = data.zoneType;
    if (data.fee !== undefined) updateData.fee = new Prisma.Decimal(data.fee);
    if (data.minOrderValue !== undefined) {
      updateData.minOrderValue =
        data.minOrderValue != null ? new Prisma.Decimal(data.minOrderValue) : null;
    }
    if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes;
    if (data.zipPrefix !== undefined) updateData.zipPrefix = data.zipPrefix;
    if (data.radiusKm !== undefined) {
      updateData.radiusKm = data.radiusKm != null ? new Prisma.Decimal(data.radiusKm) : null;
    }
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.deliveryZone
      .updateMany({ where: { id, establishmentId }, data: updateData })
      .then(() => this.findZoneById(id, establishmentId));
  },

  deleteZone(id: string, establishmentId: string) {
    return prisma.deliveryZone.deleteMany({ where: { id, establishmentId } });
  },

  getMaxZoneSortOrder(establishmentId: string) {
    return prisma.deliveryZone.aggregate({
      where: { establishmentId },
      _max: { sortOrder: true },
    });
  },

  findDeliveryOrders(establishmentId: string, filters: DeliveryOrderFilters = {}) {
    const where: Prisma.OrderWhereInput = {
      establishmentId,
      type: OrderType.DELIVERY,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.unassignedOnly ? { assignedDeliveryUserId: null } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { code: { contains: filters.search, mode: 'insensitive' } },
              { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
              { customer: { phone: { contains: filters.search } } },
            ],
          }
        : {}),
    };

    return prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: deliveryOrderInclude,
    });
  },

  findDeliveryOrderById(id: string, establishmentId: string) {
    return prisma.order.findFirst({
      where: { id, establishmentId, type: OrderType.DELIVERY },
      include: {
        ...deliveryOrderInclude,
        items: { include: { additionals: true } },
      },
    });
  },

  findCourier(id: string, establishmentId: string) {
    return prisma.user.findFirst({ where: { id, establishmentId, isActive: true } });
  },

  assignCourier(id: string, establishmentId: string, courierId: string | null) {
    return prisma.order
      .updateMany({
        where: { id, establishmentId, type: OrderType.DELIVERY },
        data: { assignedDeliveryUserId: courierId },
      })
      .then(() => this.findDeliveryOrderById(id, establishmentId));
  },

  updateTimes(
    id: string,
    establishmentId: string,
    data: { deliveryLeftAt?: Date | null; deliveryCompletedAt?: Date | null },
  ) {
    const updateData: Prisma.OrderUpdateManyMutationInput = {};
    if (data.deliveryLeftAt !== undefined) updateData.deliveryLeftAt = data.deliveryLeftAt;
    if (data.deliveryCompletedAt !== undefined) {
      updateData.deliveryCompletedAt = data.deliveryCompletedAt;
    }

    return prisma.order
      .updateMany({
        where: { id, establishmentId, type: OrderType.DELIVERY },
        data: updateData,
      })
      .then(() => this.findDeliveryOrderById(id, establishmentId));
  },
};
