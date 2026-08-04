import type { Request, Response } from 'express';
import { inAppNotificationService, notificationSettingsService } from '../services/notification.service.js';
import {
  listNotificationsQuerySchema,
  updateNotificationSettingsSchema,
} from '../validators/notification.schemas.js';
import { serialize } from '../utils/serialize.js';

export const notificationSettingsController = {
  async get(req: Request, res: Response) {
    const result = await notificationSettingsService.get(req.user!.establishmentId);
    res.json(serialize(result));
  },

  async update(req: Request, res: Response) {
    const body = updateNotificationSettingsSchema.parse(req.body);
    const result = await notificationSettingsService.update(req.user!.establishmentId, body);
    res.json(serialize(result));
  },
};

export const notificationController = {
  async list(req: Request, res: Response) {
    const query = listNotificationsQuerySchema.parse(req.query);
    const result = await inAppNotificationService.list(req.user!.establishmentId, query);
    res.json(serialize(result));
  },

  async markRead(req: Request, res: Response) {
    await inAppNotificationService.markRead(req.params.id!, req.user!.establishmentId);
    res.status(204).send();
  },

  async markAllRead(req: Request, res: Response) {
    await inAppNotificationService.markAllRead(req.user!.establishmentId);
    res.status(204).send();
  },
};
