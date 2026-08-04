import { Prisma, type NotificationChannel, type NotificationLogStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const notificationRepository = {
  findSettings(establishmentId: string) {
    return prisma.notificationSetting.findUnique({ where: { establishmentId } });
  },

  upsertSettings(
    establishmentId: string,
    data: {
      whatsappEnabled?: boolean;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      eventsJson?: Prisma.InputJsonValue | null;
    },
  ) {
    return prisma.notificationSetting.upsert({
      where: { establishmentId },
      create: {
        establishmentId,
        whatsappEnabled: data.whatsappEnabled ?? false,
        emailEnabled: data.emailEnabled ?? false,
        pushEnabled: data.pushEnabled ?? false,
        eventsJson: data.eventsJson ?? undefined,
      },
      update: {
        ...(data.whatsappEnabled !== undefined ? { whatsappEnabled: data.whatsappEnabled } : {}),
        ...(data.emailEnabled !== undefined ? { emailEnabled: data.emailEnabled } : {}),
        ...(data.pushEnabled !== undefined ? { pushEnabled: data.pushEnabled } : {}),
        ...(data.eventsJson !== undefined
          ? { eventsJson: data.eventsJson ?? Prisma.JsonNull }
          : {}),
      },
    });
  },

  findLogByIdempotencyKey(idempotencyKey: string) {
    return prisma.notificationLog.findUnique({ where: { idempotencyKey } });
  },

  createLog(data: {
    establishmentId: string;
    channel: NotificationChannel;
    eventKey: string;
    recipient: string;
    payload?: Prisma.InputJsonValue;
    idempotencyKey: string;
  }) {
    return prisma.notificationLog.create({
      data: {
        establishmentId: data.establishmentId,
        channel: data.channel,
        eventKey: data.eventKey,
        recipient: data.recipient,
        payload: data.payload,
        idempotencyKey: data.idempotencyKey,
        status: 'PENDING',
      },
    });
  },

  updateLogStatus(
    id: string,
    status: NotificationLogStatus,
    data: { error?: string | null; sentAt?: Date | null } = {},
  ) {
    return prisma.notificationLog.update({
      where: { id },
      data: {
        status,
        error: data.error ?? null,
        sentAt: data.sentAt ?? (status === 'SENT' ? new Date() : null),
        attempts: { increment: 1 },
      },
    });
  },

  listLogs(establishmentId: string, page: number, pageSize: number) {
    return Promise.all([
      prisma.notificationLog.findMany({
        where: { establishmentId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notificationLog.count({ where: { establishmentId } }),
    ]);
  },

  // In-app notifications (Notification model)
  createInApp(data: { establishmentId: string; title: string; message: string; type?: string }) {
    return prisma.notification.create({
      data: {
        establishmentId: data.establishmentId,
        title: data.title,
        message: data.message,
        type: data.type ?? 'info',
      },
    });
  },

  listInApp(establishmentId: string, filters: { isRead?: boolean; page: number; pageSize: number }) {
    const where = {
      establishmentId,
      ...(filters.isRead !== undefined ? { isRead: filters.isRead } : {}),
    };
    return Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { establishmentId, isRead: false } }),
    ]);
  },

  markInAppRead(id: string, establishmentId: string) {
    return prisma.notification.updateMany({
      where: { id, establishmentId },
      data: { isRead: true },
    });
  },

  markAllInAppRead(establishmentId: string) {
    return prisma.notification.updateMany({
      where: { establishmentId, isRead: false },
      data: { isRead: true },
    });
  },
};
