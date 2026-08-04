import { NotificationChannel } from '@prisma/client';
import type { NotificationContext, NotificationProvider, NotificationSendResult } from '../types.js';

/**
 * Stub — não há integração com um provedor de push (FCM/APNs/Web Push)
 * configurada ainda. Mantém a interface pronta para uma implementação futura.
 */
export class PushProvider implements NotificationProvider {
  readonly channel = NotificationChannel.PUSH;

  isEnabled(): boolean {
    return false;
  }

  async send(context: NotificationContext): Promise<NotificationSendResult> {
    return {
      success: false,
      skipped: true,
      error: 'Push notifications ainda não implementadas.',
    };
  }
}
