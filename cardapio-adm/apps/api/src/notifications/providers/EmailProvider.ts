import { NotificationChannel } from '@prisma/client';
import nodemailer, { type Transporter } from 'nodemailer';
import { logger } from '../../lib/logger.js';
import type { NotificationContext, NotificationProvider, NotificationSendResult } from '../types.js';

export class EmailProvider implements NotificationProvider {
  readonly channel = NotificationChannel.EMAIL;
  private transporter: Transporter | null = null;

  private get host(): string | undefined {
    return process.env.SMTP_HOST;
  }

  private get port(): number {
    return Number(process.env.SMTP_PORT ?? 587);
  }

  private get user(): string | undefined {
    return process.env.SMTP_USER;
  }

  private get pass(): string | undefined {
    return process.env.SMTP_PASS;
  }

  private get from(): string {
    return process.env.SMTP_FROM ?? this.user ?? 'no-reply@cardapio.app';
  }

  isEnabled(): boolean {
    return Boolean(this.host && this.user && this.pass);
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.port === 465,
        auth: { user: this.user, pass: this.pass },
      });
    }
    return this.transporter;
  }

  async send(context: NotificationContext): Promise<NotificationSendResult> {
    if (!this.isEnabled()) {
      return { success: false, error: 'SMTP não configurado.', skipped: true };
    }

    const to = context.recipient.email;
    if (!to) {
      return { success: false, error: 'Destinatário sem e-mail.', skipped: true };
    }

    try {
      const info = await this.getTransporter().sendMail({
        from: this.from,
        to,
        subject: context.subject,
        text: context.message,
      });
      return { success: true, externalId: info.messageId };
    } catch (error) {
      logger.warn({ err: error }, 'Falha ao enviar notificação via e-mail');
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' };
    }
  }
}
