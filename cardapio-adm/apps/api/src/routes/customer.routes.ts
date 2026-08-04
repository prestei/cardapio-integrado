import { Router } from 'express';
import { customerController } from '../controllers/customer.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('customers:list'), asyncHandler(customerController.list));
router.get(
  '/:id',
  requirePermission('customers:view'),
  asyncHandler(customerController.getById),
);
router.patch(
  '/:id',
  requirePermission('customers:update'),
  asyncHandler(customerController.update),
);

export default router;
