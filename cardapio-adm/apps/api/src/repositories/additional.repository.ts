import { Prisma, SelectionType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const additionalRepository = {
  findAll(establishmentId: string) {
    return prisma.additionalGroup.findMany({
      where: { establishmentId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        additionals: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true } },
      },
    });
  },

  findById(id: string, establishmentId: string) {
    return prisma.additionalGroup.findFirst({
      where: { id, establishmentId },
      include: {
        additionals: { orderBy: { sortOrder: 'asc' } },
        products: {
          include: { product: { select: { id: true, name: true, imageUrl: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  },

  create(
    establishmentId: string,
    data: {
      name: string;
      description?: string;
      selectionType?: SelectionType;
      isRequired?: boolean;
      minQuantity?: number;
      maxQuantity?: number;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return prisma.additionalGroup.create({
      data: { establishmentId, ...data },
      include: { additionals: true },
    });
  },

  update(
    id: string,
    establishmentId: string,
    data: {
      name?: string;
      description?: string;
      selectionType?: SelectionType;
      isRequired?: boolean;
      minQuantity?: number;
      maxQuantity?: number;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return prisma.additionalGroup
      .updateMany({ where: { id, establishmentId }, data })
      .then(() => this.findById(id, establishmentId));
  },

  softDelete(id: string, establishmentId: string) {
    return prisma.additionalGroup.updateMany({
      where: { id, establishmentId },
      data: { isActive: false },
    });
  },

  hardDelete(id: string, establishmentId: string) {
    return prisma.additionalGroup.deleteMany({ where: { id, establishmentId } });
  },

  async hasOrderHistory(groupId: string) {
    const count = await prisma.orderItemAdditional.count({
      where: { additional: { additionalGroupId: groupId } },
    });
    return count > 0;
  },

  getMaxSortOrder(establishmentId: string) {
    return prisma.additionalGroup.aggregate({
      where: { establishmentId },
      _max: { sortOrder: true },
    });
  },

  findAdditionalById(additionalId: string, establishmentId: string) {
    return prisma.additional.findFirst({
      where: { id: additionalId, additionalGroup: { establishmentId } },
      include: { additionalGroup: { select: { id: true, establishmentId: true } } },
    });
  },

  createAdditional(
    groupId: string,
    data: {
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      isAvailable?: boolean;
      sortOrder?: number;
    },
  ) {
    return prisma.additional.create({
      data: {
        additionalGroupId: groupId,
        name: data.name,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        imageUrl: data.imageUrl || null,
        isAvailable: data.isAvailable,
        sortOrder: data.sortOrder,
      },
    });
  },

  updateAdditional(
    additionalId: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      imageUrl?: string | null;
      isAvailable?: boolean;
      sortOrder?: number;
    },
  ) {
    const updateData: Prisma.AdditionalUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    return prisma.additional.update({
      where: { id: additionalId },
      data: updateData,
    });
  },

  deleteAdditional(additionalId: string) {
    return prisma.additional.delete({ where: { id: additionalId } });
  },

  getMaxAdditionalSortOrder(groupId: string) {
    return prisma.additional.aggregate({
      where: { additionalGroupId: groupId },
      _max: { sortOrder: true },
    });
  },

  findProductInEstablishment(productId: string, establishmentId: string) {
    return prisma.product.findFirst({ where: { id: productId, establishmentId } });
  },

  findLink(groupId: string, productId: string) {
    return prisma.productAdditionalGroup.findUnique({
      where: { productId_additionalGroupId: { productId, additionalGroupId: groupId } },
    });
  },

  linkProduct(groupId: string, productId: string, sortOrder: number) {
    return prisma.productAdditionalGroup.create({
      data: { additionalGroupId: groupId, productId, sortOrder },
    });
  },

  unlinkProduct(groupId: string, productId: string) {
    return prisma.productAdditionalGroup.deleteMany({
      where: { additionalGroupId: groupId, productId },
    });
  },
};
