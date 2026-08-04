import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/payments/:provider', asyncHandler(webhookController.handlePaymentWebhook));

export default router;
