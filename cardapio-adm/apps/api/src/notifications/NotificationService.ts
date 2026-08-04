import type { NotificationChannel, NotificationLogStatus, Prisma } from '@prisma/client';
import { notificationRepository } from '../repositories/notification.repository.js';
import { logger } from '../lib/logger.js';
import { ConsoleProvider } from './providers/ConsoleProvider.js';
import { WhatsAppProvider } from './providers/WhatsAppProvider.js';
import { EmailProvider } from './providers/EmailProvider.js';
import { PushProvider } from './providers/PushProvider.js';
import type { NotificationContext, NotificationProvider, NotificationRecipient } from './types.js';

interface OrderLike {
  id: string;
  code: string;
  status?: string;
  total?: unknown;
  customer?: { name?: string | null; phone?: string | null; email?: string | null } | null;
}

interface PaymentLike {
  id: string;
  status?: string;
  order?: { id?: string; code?: string } | null;
}

interface NotifyParams {
  establishmentId: string;
  order?: OrderLike | null;
  payment?: PaymentLike | null;
  recipientOverride?: Partial<NotificationRecipient>;
}

const whatsappProvider = new WhatsAppProvider();
const emailProvider = new EmailProvider();
const pushProvider = new PushProvider();
const consoleProviders: Partial<Record<NotificationChannel, ConsoleProvider>> = {};

function consoleProviderFor(channel: NotificationChannel): ConsoleProvider {
  if (!consoleProviders[channel]) {
    consoleProviders[channel] = new ConsoleProvider(channel);
  }
  return consoleProviders[channel]!;
}

function recipientValueFor(channel: NotificationChannel, recipient: NotificationRecipient): string | null {
  if (channel === 'WHATSAPP') return recipient.whatsapp ?? null;
  if (channel === 'EMAIL') return recipient.email ?? null;
  if (channel === 'PUSH') return recipient.pushToken ?? null;
  return recipient.name ?? null;
}

function buildMessage(eventKey: string, order?: OrderLike | null): { subject: string; message: string } {
  const code = order?.code ?? '';

  if (eventKey.startsWith('order:')) {
    const status = eventKey.slice('order:'.length);
    const map: Record<string, string> = {
      new: `Recebemos seu pedido ${code}! Em breve confirmaremos.`,
      confirmed: `Seu pedido ${code} foi confirmado e entrará em preparo.`,
      preparing: `Seu pedido ${code} está sendo preparado.`,
      ready: `Seu pedido ${code} está pronto!`,
      out_for_delivery: `Seu pedido ${code} saiu para entrega.`,
      completed: `Seu pedido ${code} foi concluído. Obrigado pela preferência!`,
      cancelled: `Seu pedido ${code} foi cancelado.`,
    };
    return { subject: `Pedido ${code}`, message: map[status] ?? `Atualização do pedido ${code}.` };
  }

  if (eventKey.startsWith('payment:')) {
    const status = eventKey.slice('payment:'.length);
    const map: Record<string, string> = {
      paid: `Pagamento do pedido ${code} confirmado!`,
      failed: `Não conseguimos confirmar o pagamento do pedido ${code}.`,
      refunded: `O pagamento do pedido ${code} foi estornado.`,
      pending: `Aguardando confirmação do pagamento do pedido ${code}.`,
    };
    return {
      subject: `Pagamento — pedido ${code}`,
      message: map[status] ?? `Atualização de pagamento do pedido ${code}.`,
    };
  }

  return { subject: 'Notificação', message: eventKey };
}

export const notificationService = {
  /**
   * Dispara notificações para os canais habilitados nas configurações do
   * estabelecimento. Nunca lança exceção — falhas são logadas e registradas
   * em NotificationLog para auditoria/idempotência.
   */
  async notify(eventKey: string, params: NotifyParams): Promise<void> {
    try {
      if (process.env.NOTIFICATIONS_ENABLED === 'false') return;

      const { establishmentId, order, payment } = params;
      const settings = await notificationRepository.findSettings(establishmentId).catch(() => null);
      const eventsOverride = (settings?.eventsJson as Record<string, boolean> | null) ?? null;
      if (eventsOverride && eventsOverride[eventKey] === false) return;

      const { subject, message } = buildMessage(eventKey, order);

      const recipient: NotificationRecipient = {
        name: order?.customer?.name ?? null,
        whatsapp: order?.customer?.phone ?? null,
        email: order?.customer?.email ?? null,
        pushToken: null,
        ...params.recipientOverride,
      };

      await notificationRepository
        .createInApp({
          establishmentId,
          title: subject,
          message,
          type: eventKey.startsWith('payment:') ? 'payment' : 'order',
        })
        .catch((err: unknown) => logger.warn({ err }, 'Falha ao criar notificação in-app'));

      const entityId = order?.id ?? payment?.id ?? String(Date.now());
      const context: NotificationContext = {
        eventKey,
        establishmentId,
        recipient,
        subject,
        message,
        data: { orderId: order?.id, paymentId: payment?.id },
      };

      const channels: Array<{ enabled: boolean; provider: NotificationProvider }> = [
        { enabled: Boolean(settings?.whatsappEnabled), provider: whatsappProvider },
        { enabled: Boolean(settings?.emailEnabled), provider: emailProvider },
        { enabled: Boolean(settings?.pushEnabled), provider: pushProvider },
      ];

      await Promise.all(
        channels
          .filter((c) => c.enabled && recipientValueFor(c.provider.channel, recipient))
          .map((c) => this.dispatch(c.provider, context, entityId)),
      );
    } catch (error) {
      logger.error({ err: error }, 'Erro inesperado ao processar notificação');
    }
  },

  async dispatch(provider: NotificationProvider, context: NotificationContext, entityId: string): Promise<void> {
    const idempotencyKey = `${context.eventKey}:${provider.channel}:${entityId}`;

    try {
      const existing = await notificationRepository.findLogByIdempotencyKey(idempotencyKey);
      if (existing && existing.status === 'SENT') return;

      const log =
        existing ??
        (await notificationRepository.createLog({
          establishmentId: context.establishmentId,
          channel: provider.channel,
          eventKey: context.eventKey,
          recipient: recipientValueFor(provider.channel, context.recipient) ?? 'desconhecido',
          payload: (context.data ?? {}) as Prisma.InputJsonValue,
          idempotencyKey,
        }));

      const activeProvider = provider.isEnabled() ? provider : consoleProviderFor(provider.channel);
      const result = await activeProvider.send(context);
      const status: NotificationLogStatus = result.success ? 'SENT' : result.skipped ? 'SKIPPED' : 'FAILED';

      await notificationRepository.updateLogStatus(log.id, status, { error: result.error ?? null });
    } catch (error) {
      logger.warn({ err: error, channel: provider.channel }, 'Falha ao despachar notificação');
    }
  },
};
