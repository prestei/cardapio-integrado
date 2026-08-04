import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(orderController.list));
router.get('/:id', asyncHandler(orderController.getById));
router.patch('/:id/status', asyncHandler(orderController.updateStatus));

export default router;
