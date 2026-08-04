import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const productRepository = {
  findAll(establishmentId: string, categoryId?: string) {
    return prisma.product.findMany({
      where: {
        establishmentId,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        additionalGroups: {
          include: {
            additionalGroup: {
              include: { additionals: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
    });
  },

  findById(id: string, establishmentId: string) {
    return prisma.product.findFirst({
      where: { id, establishmentId },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        additionalGroups: {
          include: {
            additionalGroup: {
              include: { additionals: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
    });
  },

  create(establishmentId: string, data: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    promoPrice?: number | null;
    imageUrl?: string;
    internalCode?: string;
    prepTimeMinutes?: number | null;
    stock?: number | null;
    isAvailable?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
  }) {
    return prisma.product.create({
      data: {
        establishmentId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        promoPrice: data.promoPrice != null ? new Prisma.Decimal(data.promoPrice) : null,
        imageUrl: data.imageUrl || null,
        internalCode: data.internalCode,
        prepTimeMinutes: data.prepTimeMinutes,
        stock: data.stock,
        isAvailable: data.isAvailable,
        isFeatured: data.isFeatured,
        sortOrder: data.sortOrder,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
  },

  update(id: string, establishmentId: string, data: {
    categoryId?: string;
    name?: string;
    description?: string;
    price?: number;
    promoPrice?: number | null;
    imageUrl?: string;
    internalCode?: string;
    prepTimeMinutes?: number | null;
    stock?: number | null;
    isAvailable?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
  }) {
    const updateData: Prisma.ProductUpdateInput = {};

    if (data.categoryId !== undefined) {
      updateData.category = { connect: { id: data.categoryId } };
    }
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
    if (data.promoPrice !== undefined) {
      updateData.promoPrice = data.promoPrice != null ? new Prisma.Decimal(data.promoPrice) : null;
    }
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
    if (data.internalCode !== undefined) updateData.internalCode = data.internalCode;
    if (data.prepTimeMinutes !== undefined) updateData.prepTimeMinutes = data.prepTimeMinutes;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    return prisma.product.update({
      where: { id, establishmentId },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        additionalGroups: {
          include: {
            additionalGroup: {
              include: { additionals: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
    });
  },

  updatePrice(id: string, establishmentId: string, price: number, promoPrice?: number | null) {
    return prisma.product.update({
      where: { id, establishmentId },
      data: {
        price: new Prisma.Decimal(price),
        promoPrice: promoPrice != null ? new Prisma.Decimal(promoPrice) : null,
      },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        additionalGroups: {
          include: {
            additionalGroup: {
              include: { additionals: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
    });
  },

  delete(id: string, establishmentId: string) {
    return prisma.product.deleteMany({
      where: { id, establishmentId },
    });
  },

  duplicate(id: string, establishmentId: string) {
    return prisma.$transaction(async (tx) => {
      const original = await tx.product.findFirst({
        where: { id, establishmentId },
        include: {
          images: true,
          additionalGroups: true,
        },
      });

      if (!original) return null;

      const copy = await tx.product.create({
        data: {
          establishmentId: original.establishmentId,
          categoryId: original.categoryId,
          name: `${original.name} (cópia)`,
          description: original.description,
          price: original.price,
          promoPrice: original.promoPrice,
          imageUrl: original.imageUrl,
          internalCode: original.internalCode ? `${original.internalCode}-COPY` : null,
          prepTimeMinutes: original.prepTimeMinutes,
          stock: original.stock,
          isAvailable: false,
          isFeatured: false,
          sortOrder: original.sortOrder + 1,
          images: {
            create: original.images.map((img) => ({
              url: img.url,
              sortOrder: img.sortOrder,
            })),
          },
          additionalGroups: {
            create: original.additionalGroups.map((g) => ({
              additionalGroupId: g.additionalGroupId,
            })),
          },
        },
        include: {
          category: { select: { id: true, name: true } },
          images: true,
        },
      });

      return copy;
    });
  },

  getMaxSortOrder(establishmentId: string, categoryId: string) {
    return prisma.product.aggregate({
      where: { establishmentId, categoryId },
      _max: { sortOrder: true },
    });
  },
};
