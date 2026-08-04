import { PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const orderInclude = {
  order: {
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
    },
  },
};

export const paymentRepository = {
  findByOrderId(orderId: string) {
    return prisma.payment.findUnique({ where: { orderId }, include: orderInclude });
  },

  findById(id: string) {
    return prisma.payment.findUnique({ where: { id }, include: orderInclude });
  },

  findByProviderExternalId(provider: string, externalId: string) {
    return prisma.payment.findFirst({
      where: { provider, externalId },
      include: orderInclude,
    });
  },

  updateIntent(
    id: string,
    data: {
      provider?: string | null;
      externalId?: string | null;
      qrCodeBase64?: string | null;
      copyPaste?: string | null;
      checkoutUrl?: string | null;
      expiresAt?: Date | null;
      failureReason?: string | null;
    },
  ) {
    return prisma.payment.update({
      where: { id },
      data,
      include: orderInclude,
    });
  },

  markStatus(
    id: string,
    status: PaymentStatus,
    data: { failureReason?: string | null; paidAt?: Date | null } = {},
  ) {
    return prisma.payment.update({
      where: { id },
      data: {
        status,
        failureReason: data.failureReason ?? null,
        paidAt: status === PaymentStatus.PAID ? (data.paidAt ?? new Date()) : undefined,
      },
      include: orderInclude,
    });
  },

  createEvent(data: {
    establishmentId: string;
    paymentId: string;
    provider: string;
    eventType: string;
    externalId?: string | null;
    payload?: Prisma.InputJsonValue;
  }) {
    return prisma.paymentEvent.create({
      data: {
        establishmentId: data.establishmentId,
        paymentId: data.paymentId,
        provider: data.provider,
        eventType: data.eventType,
        externalId: data.externalId,
        payload: data.payload,
      },
    });
  },

  findEvent(paymentId: string, eventType: string, externalId: string) {
    return prisma.paymentEvent.findFirst({
      where: { paymentId, eventType, externalId },
    });
  },
};
