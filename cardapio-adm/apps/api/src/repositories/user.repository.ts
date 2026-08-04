import type { UserRole } from '@prisma/client';
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

  findAllByEstablishment(establishmentId: string) {
    return prisma.user.findMany({
      where: { establishmentId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  },

  findByIdAndEstablishment(id: string, establishmentId: string) {
    return prisma.user.findFirst({ where: { id, establishmentId } });
  },

  createTeamMember(data: {
    establishmentId: string;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    phone?: string;
  }) {
    return prisma.user.create({ data });
  },

  updateTeamMember(
    id: string,
    establishmentId: string,
    data: {
      name?: string;
      role?: UserRole;
      phone?: string;
      avatarUrl?: string | null;
      isActive?: boolean;
    },
  ) {
    return prisma.user
      .updateMany({ where: { id, establishmentId }, data })
      .then(() => this.findByIdAndEstablishment(id, establishmentId));
  },

  countActiveByRole(establishmentId: string, role: UserRole) {
    return prisma.user.count({ where: { establishmentId, role, isActive: true } });
  },
};
