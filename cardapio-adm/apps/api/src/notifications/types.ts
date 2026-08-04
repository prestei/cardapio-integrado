import type { NotificationChannel } from '@prisma/client';

export interface NotificationRecipient {
  name?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  pushToken?: string | null;
}

export interface NotificationContext {
  eventKey: string;
  establishmentId: string;
  recipient: NotificationRecipient;
  subject: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationSendResult {
  success: boolean;
  error?: string;
  externalId?: string;
  skipped?: boolean;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  isEnabled(): boolean;
  send(context: NotificationContext): Promise<NotificationSendResult>;
}
