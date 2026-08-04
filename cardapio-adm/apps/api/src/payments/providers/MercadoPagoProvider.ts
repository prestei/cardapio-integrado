import { AppError } from '../../utils/AppError.js';
import { logger } from '../../lib/logger.js';
import type { PaymentGateway, PaymentIntentInput, PaymentIntentResult } from '../types.js';

interface MercadoPagoPaymentResponse {
  id: number | string;
  date_of_expiration?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
}

interface MercadoPagoPreferenceResponse {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
}

const EXPIRATION_MINUTES = 30;

/**
 * Integração Mercado Pago — PIX via Payments API e cartão online via Preferences.
 * Em produção, sem token configurado, falha explicitamente (não simula sucesso).
 */
export class MercadoPagoProvider implements PaymentGateway {
  readonly name = 'mercadopago';

  private get token(): string | undefined {
    return process.env.MERCADOPAGO_ACCESS_TOKEN;
  }

  isConfigured(): boolean {
    return Boolean(this.token);
  }

  private ensureConfigured() {
    if (!this.isConfigured()) {
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        throw new AppError(
          'Pagamento online indisponível: MERCADOPAGO_ACCESS_TOKEN não configurado.',
          503,
        );
      }
      throw new AppError(
        'Mercado Pago não configurado. Defina MERCADOPAGO_ACCESS_TOKEN ou use PAYMENT_PROVIDER=mock.',
        503,
      );
    }
  }

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    this.ensureConfigured();

    if (input.method === 'ONLINE') {
      return this.createCheckoutPreference(input);
    }

    return this.createPixPayment(input);
  }

  private async createPixPayment(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    try {
      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
          'X-Idempotency-Key': `${input.orderId}-pix`,
        },
        body: JSON.stringify({
          transaction_amount: input.amount,
          description: input.description,
          payment_method_id: 'pix',
          payer: {
            email: input.payer?.email || 'cliente@cardapio.app',
            first_name: input.payer?.name || 'Cliente',
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        logger.warn({ status: response.status, text }, 'Mercado Pago recusou PIX');
        throw new AppError('Não foi possível gerar o PIX. Tente novamente.', 502);
      }

      const data = (await response.json()) as MercadoPagoPaymentResponse;
      const transactionData = data.point_of_interaction?.transaction_data;

      return {
        provider: this.name,
        externalId: String(data.id),
        qrCodeBase64: transactionData?.qr_code_base64 ?? null,
        copyPaste: transactionData?.qr_code ?? null,
        checkoutUrl: transactionData?.ticket_url ?? null,
        expiresAt: data.date_of_expiration
          ? new Date(data.date_of_expiration)
          : new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.warn({ err: error }, 'Erro ao integrar PIX com Mercado Pago');
      throw new AppError('Falha na comunicação com o gateway de pagamento.', 502);
    }
  }

  private async createCheckoutPreference(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    try {
      const notificationUrl = process.env.PAYMENT_WEBHOOK_URL;
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          external_reference: input.orderId,
          items: [
            {
              id: input.orderId,
              title: input.description,
              quantity: 1,
              unit_price: input.amount,
              currency_id: 'BRL',
            },
          ],
          payer: {
            name: input.payer?.name || undefined,
            email: input.payer?.email || undefined,
          },
          payment_methods: {
            excluded_payment_types: [{ id: 'ticket' }],
            installments: Number(process.env.MERCADOPAGO_MAX_INSTALLMENTS ?? 12),
          },
          ...(notificationUrl ? { notification_url: notificationUrl } : {}),
          expires: true,
          expiration_date_to: new Date(
            Date.now() + EXPIRATION_MINUTES * 60 * 1000,
          ).toISOString(),
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        logger.warn({ status: response.status, text }, 'Mercado Pago recusou preferência de checkout');
        throw new AppError('Não foi possível iniciar o pagamento com cartão.', 502);
      }

      const data = (await response.json()) as MercadoPagoPreferenceResponse;
      const checkoutUrl =
        process.env.MERCADOPAGO_SANDBOX === 'true'
          ? data.sandbox_init_point ?? data.init_point
          : data.init_point ?? data.sandbox_init_point;

      return {
        provider: this.name,
        externalId: data.id,
        qrCodeBase64: null,
        copyPaste: null,
        checkoutUrl: checkoutUrl ?? null,
        expiresAt: new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.warn({ err: error }, 'Erro ao criar preferência Mercado Pago');
      throw new AppError('Falha na comunicação com o gateway de pagamento.', 502);
    }
  }
}
