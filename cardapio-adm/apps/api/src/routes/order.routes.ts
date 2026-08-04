import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('orders:list'), asyncHandler(orderController.list));
router.get('/:id', requirePermission('orders:view'), asyncHandler(orderController.getById));
router.patch(
  '/:id/status',
  requirePermission('orders:updateStatus'),
  asyncHandler(orderController.updateStatus),
);

export default router;
