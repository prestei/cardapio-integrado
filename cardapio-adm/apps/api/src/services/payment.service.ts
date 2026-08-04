import { OrderStatus, PaymentMethod, PaymentStatus, Prisma, StatusChangeSource } from '@prisma/client';
import { paymentRepository } from '../repositories/payment.repository.js';
import { publicRepository } from '../repositories/public.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { getPaymentGateway } from '../payments/PaymentGatewayFactory.js';
import { AppError } from '../utils/AppError.js';
import { decimalToNumber } from '../utils/serialize.js';
import { orderEvents } from '../lib/orderEvents.js';
import { notificationService } from '../notifications/NotificationService.js';

const PAYABLE_METHODS: PaymentMethod[] = [PaymentMethod.PIX, PaymentMethod.ONLINE];

function serializePayment(payment: {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: Prisma.Decimal;
  provider: string | null;
  externalId: string | null;
  qrCodeBase64: string | null;
  copyPaste: string | null;
  checkoutUrl: string | null;
  expiresAt: Date | null;
}) {
  return {
    id: payment.id,
    method: payment.method,
    status: payment.status,
    amount: decimalToNumber(payment.amount) ?? 0,
    provider: payment.provider,
    externalId: payment.externalId,
    qrCodeBase64: payment.qrCodeBase64,
    copyPaste: payment.copyPaste,
    checkoutUrl: payment.checkoutUrl,
    expiresAt: payment.expiresAt,
  };
}

function mapProviderStatus(payload: Record<string, unknown>): PaymentStatus {
  const raw = String(payload.status ?? payload.action ?? '').toLowerCase();
  if (['approved', 'paid', 'completed', 'success'].includes(raw)) return PaymentStatus.PAID;
  if (['rejected', 'failed', 'error'].includes(raw)) return PaymentStatus.FAILED;
  if (['refunded', 'charged_back', 'cancelled', 'canceled'].includes(raw)) return PaymentStatus.REFUNDED;
  return PaymentStatus.PENDING;
}

export const paymentService = {
  async createOrRefreshIntent(establishmentId: string, code: string) {
    const order = await publicRepository.findOrderForPayment(establishmentId, code);
    if (!order) {
      throw new AppError('Pedido não encontrado.', 404);
    }
    if (!order.payment) {
      throw new AppError('Pedido sem pagamento associado.', 400);
    }
    if (!PAYABLE_METHODS.includes(order.payment.method)) {
      throw new AppError('Este pedido não utiliza pagamento online.', 400);
    }
    if (order.payment.status === PaymentStatus.PAID) {
      throw new AppError('Pagamento já confirmado.', 400);
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new AppError('Pedido cancelado.', 400);
    }

    const stillValid =
      order.payment.externalId && order.payment.expiresAt && order.payment.expiresAt > new Date();

    if (stillValid) {
      return serializePayment(order.payment);
    }

    const gateway = getPaymentGateway();
    const intent = await gateway.createIntent({
      orderId: order.id,
      amount: decimalToNumber(order.payment.amount) ?? 0,
      method: order.payment.method,
      description: `Pedido ${order.code}`,
      payer: { name: order.customer?.name, email: order.customer?.email },
    });

    const updated = await paymentRepository.updateIntent(order.payment.id, {
      provider: intent.provider,
      externalId: intent.externalId,
      qrCodeBase64: intent.qrCodeBase64,
      copyPaste: intent.copyPaste,
      checkoutUrl: intent.checkoutUrl,
      expiresAt: intent.expiresAt,
      failureReason: null,
    });

    await paymentRepository.createEvent({
      establishmentId,
      paymentId: order.payment.id,
      provider: intent.provider,
      eventType: 'intent_created',
      externalId: intent.externalId,
      payload: intent as unknown as Prisma.InputJsonValue,
    });

    return serializePayment(updated);
  },

  async handleWebhook(
    providerName: string,
    secretHeader: string | undefined,
    payload: Record<string, unknown>,
  ) {
    const expectedSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (expectedSecret && secretHeader !== expectedSecret) {
      throw new AppError('Assinatura do webhook inválida.', 401);
    }

    const externalId = String(
      payload.externalId ?? payload.id ?? (payload.data as Record<string, unknown> | undefined)?.id ?? '',
    );
    if (!externalId) {
      throw new AppError('Payload inválido: externalId ausente.', 400);
    }

    const payment = await paymentRepository.findByProviderExternalId(providerName, externalId);
    if (!payment) {
      throw new AppError('Pagamento não encontrado para o evento recebido.', 404);
    }

    const eventType = String(payload.status ?? payload.action ?? 'update');

    const existingEvent = await paymentRepository.findEvent(payment.id, eventType, externalId);
    if (existingEvent) {
      return { alreadyProcessed: true, payment: serializePayment(payment) };
    }

    const newStatus = mapProviderStatus(payload);
    const failureReason =
      newStatus === PaymentStatus.FAILED
        ? String(payload.statusDetail ?? payload.reason ?? 'Pagamento recusado.')
        : null;

    const updatedPayment = await paymentRepository.markStatus(payment.id, newStatus, { failureReason });

    await paymentRepository.createEvent({
      establishmentId: payment.order.establishmentId,
      paymentId: payment.id,
      provider: providerName,
      eventType,
      externalId,
      payload: payload as unknown as Prisma.InputJsonValue,
    });

    const establishmentId = payment.order.establishmentId;

    if (newStatus === PaymentStatus.PAID && payment.order.status === OrderStatus.NEW) {
      const history = Array.isArray(payment.order.statusHistory)
        ? (payment.order.statusHistory as unknown[])
        : [];
      history.push({ status: OrderStatus.CONFIRMED, changedAt: new Date().toISOString() });

      await Promise.all([
        orderRepository.updateStatus(
          payment.order.id,
          establishmentId,
          OrderStatus.CONFIRMED,
          history as unknown as Prisma.InputJsonValue,
        ),
        orderRepository.createStatusHistoryEntry({
          establishmentId,
          orderId: payment.order.id,
          fromStatus: OrderStatus.NEW,
          toStatus: OrderStatus.CONFIRMED,
          source: StatusChangeSource.SYSTEM,
          note: 'Confirmado automaticamente após pagamento aprovado.',
        }),
      ]);

      orderEvents.publish({
        type: 'order:status-changed',
        establishmentId,
        orderId: payment.order.id,
        code: payment.order.code,
        status: OrderStatus.CONFIRMED,
      });
    }

    void notificationService.notify(`payment:${newStatus.toLowerCase()}`, {
      establishmentId,
      payment: { id: payment.id, status: newStatus, order: { id: payment.order.id, code: payment.order.code } },
      order: {
        id: payment.order.id,
        code: payment.order.code,
        customer: payment.order.customer,
      },
    });

    return { payment: serializePayment(updatedPayment) };
  },
};
