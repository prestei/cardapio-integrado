import { randomUUID } from 'node:crypto';
import type { PaymentGateway, PaymentIntentInput, PaymentIntentResult } from '../types.js';

const EXPIRATION_MINUTES = 30;

/**
 * Provedor de pagamento simulado — gera PIX fake ou URL de checkout para ONLINE.
 * Confirmação apenas via POST /api/webhooks/payments/mock (nunca pelo frontend).
 */
export class MockPaymentProvider implements PaymentGateway {
  readonly name = 'mock';

  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const externalId = `mock_${randomUUID()}`;
    const expiresAt = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000);
    const amount = input.amount.toFixed(2);

    if (input.method === 'ONLINE') {
      return {
        provider: this.name,
        externalId,
        qrCodeBase64: null,
        copyPaste: null,
        checkoutUrl: `https://example.invalid/mock-checkout/${externalId}?amount=${amount}`,
        expiresAt,
      };
    }

    const copyPaste = `00020126360014BR.GOV.BCB.PIX0114+MOCK${externalId}5204000053039865406${amount}5802BR5920Cardapio Mock Pagamentos6009SAO PAULO62070503***6304MOCK`;
    const qrCodeBase64 = Buffer.from(copyPaste, 'utf-8').toString('base64');

    return {
      provider: this.name,
      externalId,
      qrCodeBase64,
      copyPaste,
      checkoutUrl: null,
      expiresAt,
    };
  }
}
