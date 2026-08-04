import { NotificationChannel } from '@prisma/client';
import { logger } from '../../lib/logger.js';
import type { NotificationContext, NotificationProvider, NotificationSendResult } from '../types.js';

export class WhatsAppProvider implements NotificationProvider {
  readonly channel = NotificationChannel.WHATSAPP;

  private get apiUrl(): string | undefined {
    return process.env.WHATSAPP_API_URL;
  }

  private get apiToken(): string | undefined {
    return process.env.WHATSAPP_API_TOKEN;
  }

  isEnabled(): boolean {
    return Boolean(this.apiUrl && this.apiToken);
  }

  async send(context: NotificationContext): Promise<NotificationSendResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'WhatsApp não configurado.', skipped: true };
    }

    const to = context.recipient.whatsapp;
    if (!to) {
      return { success: false, error: 'Destinatário sem número de WhatsApp.', skipped: true };
    }

    try {
      const response = await fetch(this.apiUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          to,
          message: context.message,
          eventKey: context.eventKey,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return { success: false, error: `HTTP ${response.status}: ${text.slice(0, 200)}` };
      }

      const body = (await response.json().catch(() => null)) as { id?: string } | null;
      return { success: true, externalId: body?.id };
    } catch (error) {
      logger.warn({ err: error }, 'Falha ao enviar notificação via WhatsApp');
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' };
    }
  }
}
