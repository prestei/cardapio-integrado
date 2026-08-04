import { Router } from 'express';
import { promotionController } from '../controllers/promotion.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('promotions:list'), asyncHandler(promotionController.list));
router.post('/', requirePermission('promotions:manage'), asyncHandler(promotionController.create));
router.get('/:id', requirePermission('promotions:list'), asyncHandler(promotionController.getById));
router.patch(
  '/:id',
  requirePermission('promotions:manage'),
  asyncHandler(promotionController.update),
);
router.delete(
  '/:id',
  requirePermission('promotions:manage'),
  asyncHandler(promotionController.delete),
);

export default router;
