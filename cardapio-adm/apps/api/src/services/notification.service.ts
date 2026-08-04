import { notificationRepository } from '../repositories/notification.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  ListNotificationsQuery,
  UpdateNotificationSettingsInput,
} from '../validators/notification.schemas.js';

export const notificationSettingsService = {
  async get(establishmentId: string) {
    const settings = await notificationRepository.findSettings(establishmentId);
    return (
      settings ?? {
        establishmentId,
        whatsappEnabled: false,
        emailEnabled: false,
        pushEnabled: false,
        eventsJson: null,
      }
    );
  },

  async update(establishmentId: string, input: UpdateNotificationSettingsInput) {
    return notificationRepository.upsertSettings(establishmentId, input);
  },
};

export const inAppNotificationService = {
  async list(establishmentId: string, query: ListNotificationsQuery) {
    const [items, total, unread] = await notificationRepository.listInApp(establishmentId, {
      isRead: query.isRead,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      items,
      unreadCount: unread,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    };
  },

  async markRead(id: string, establishmentId: string) {
    const result = await notificationRepository.markInAppRead(id, establishmentId);
    if (result.count === 0) {
      throw new AppError('Notificação não encontrada.', 404);
    }
  },

  async markAllRead(establishmentId: string) {
    await notificationRepository.markAllInAppRead(establishmentId);
  },
};
