import type { PaymentGateway } from './types.js';
import { MockPaymentProvider } from './providers/MockPaymentProvider.js';
import { MercadoPagoProvider } from './providers/MercadoPagoProvider.js';

const mockProvider = new MockPaymentProvider();
const mercadoPagoProvider = new MercadoPagoProvider();

export function getPaymentGateway(providerOverride?: string): PaymentGateway {
  const provider = (providerOverride ?? process.env.PAYMENT_PROVIDER ?? 'mock').toLowerCase();

  if (provider === 'mercadopago') {
    return mercadoPagoProvider;
  }

  return mockProvider;
}

export function getGatewayByName(name: string): PaymentGateway {
  if (name === 'mercadopago') return mercadoPagoProvider;
  return mockProvider;
}
