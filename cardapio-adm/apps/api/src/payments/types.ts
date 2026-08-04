import type { PaymentMethod } from '@prisma/client';

export interface PaymentIntentInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  description: string;
  payer?: { name?: string | null; email?: string | null };
}

export interface PaymentIntentResult {
  provider: string;
  externalId: string;
  qrCodeBase64?: string | null;
  copyPaste?: string | null;
  checkoutUrl?: string | null;
  expiresAt?: Date | null;
}

export interface PaymentGateway {
  readonly name: string;
  createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
}
