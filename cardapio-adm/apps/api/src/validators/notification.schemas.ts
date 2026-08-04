import { z } from 'zod';

export const updateNotificationSettingsSchema = z.object({
  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  eventsJson: z.record(z.boolean()).optional().nullable(),
});

export const listNotificationsQuerySchema = z.object({
  isRead: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
