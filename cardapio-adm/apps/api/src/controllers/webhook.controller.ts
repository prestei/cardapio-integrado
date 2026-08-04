import type { Request, Response } from 'express';
import { paymentService } from '../services/payment.service.js';
import { serialize } from '../utils/serialize.js';

export const webhookController = {
  async handlePaymentWebhook(req: Request, res: Response) {
    const provider = req.params.provider!;
    const secret = req.headers['x-webhook-secret'];
    const secretHeader = Array.isArray(secret) ? secret[0] : secret;

    const result = await paymentService.handleWebhook(
      provider,
      secretHeader,
      req.body as Record<string, unknown>,
    );
    res.json(serialize(result));
  },
};
