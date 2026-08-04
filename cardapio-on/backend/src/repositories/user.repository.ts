import { prisma } from '../lib/prisma.js';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, isActive: true },
      include: { establishment: true },
    });
  },

  findByEmailAndEstablishment(email: string, establishmentId: string) {
    return prisma.user.findUnique({
      where: {
        establishmentId_email: { establishmentId, email },
      },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { establishment: true },
    });
  },

  findByResetToken(token: string) {
    return prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gt: new Date() },
        isActive: true,
      },
    });
  },

  create(data: {
    establishmentId: string;
    name: string;
    email: string;
    passwordHash: string;
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'ATTENDANT' | 'KITCHEN' | 'DELIVERY';
  }) {
    return prisma.user.create({ data });
  },

  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
      },
    });
  },

  setResetToken(id: string, resetToken: string, resetTokenExp: Date) {
    return prisma.user.update({
      where: { id },
      data: { resetToken, resetTokenExp },
    });
  },
};
