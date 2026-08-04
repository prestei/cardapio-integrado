import { prisma } from '../lib/prisma.js';

export const categoryRepository = {
  findAll(establishmentId: string) {
    return prisma.category.findMany({
      where: { establishmentId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
      },
    });
  },

  findById(id: string, establishmentId: string) {
    return prisma.category.findFirst({
      where: { id, establishmentId },
      include: {
        _count: { select: { products: true } },
      },
    });
  },

  create(establishmentId: string, data: {
    name: string;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return prisma.category.create({
      data: { ...data, establishmentId },
    });
  },

  update(id: string, establishmentId: string, data: {
    name?: string;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return prisma.category.updateMany({
      where: { id, establishmentId },
      data,
    }).then(() => this.findById(id, establishmentId));
  },

  delete(id: string, establishmentId: string) {
    return prisma.category.deleteMany({
      where: { id, establishmentId },
    });
  },

  reorder(establishmentId: string, items: Array<{ id: string; sortOrder: number }>) {
    return prisma.$transaction(
      items.map((item) =>
        prisma.category.updateMany({
          where: { id: item.id, establishmentId },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  },

  getMaxSortOrder(establishmentId: string) {
    return prisma.category.aggregate({
      where: { establishmentId },
      _max: { sortOrder: true },
    });
  },
};
