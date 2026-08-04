import { NotificationChannel } from '@prisma/client';
import { logger } from '../../lib/logger.js';
import type { NotificationContext, NotificationProvider, NotificationSendResult } from '../types.js';

/**
 * Fallback provider — sempre habilitado. Usado quando nenhum provedor real
 * (WhatsApp/Email/Push) está configurado, garantindo que o fluxo de
 * notificações nunca falhe silenciosamente e fique visível nos logs.
 */
export class ConsoleProvider implements NotificationProvider {
  constructor(readonly channel: NotificationChannel) {}

  isEnabled(): boolean {
    return true;
  }

  async send(context: NotificationContext): Promise<NotificationSendResult> {
    logger.info(
      {
        channel: this.channel,
        eventKey: context.eventKey,
        recipient: context.recipient,
        subject: context.subject,
      },
      `[notify:console] ${context.message}`,
    );
    return { success: true };
  }
}
