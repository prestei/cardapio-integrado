import { prisma } from '../lib/prisma.js';

export const establishmentRepository = {
  findById(id: string) {
    return prisma.establishment.findUnique({
      where: { id },
      include: {
        businessHours: { orderBy: { dayOfWeek: 'asc' } },
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

  update(id: string, data: {
    name?: string;
    description?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    cnpj?: string;
    logoUrl?: string;
    bannerUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    isOpen?: boolean;
  }) {
    return prisma.establishment.update({
      where: { id },
      data,
      include: {
        businessHours: { orderBy: { dayOfWeek: 'asc' } },
        settings: true,
      },
    });
  },
};
