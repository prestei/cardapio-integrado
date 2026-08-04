import { Router } from 'express';
import { couponController } from '../controllers/coupon.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('coupons:list'), asyncHandler(couponController.list));
router.post('/', requirePermission('coupons:manage'), asyncHandler(couponController.create));
router.get('/:id', requirePermission('coupons:list'), asyncHandler(couponController.getById));
router.patch('/:id', requirePermission('coupons:manage'), asyncHandler(couponController.update));
router.patch(
  '/:id/archive',
  requirePermission('coupons:manage'),
  asyncHandler(couponController.archive),
);
router.delete(
  '/:id',
  requirePermission('coupons:manage'),
  asyncHandler(couponController.delete),
);

export default router;
