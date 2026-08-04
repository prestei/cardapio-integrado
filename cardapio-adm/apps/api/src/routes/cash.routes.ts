import { Router } from 'express';
import { cashController } from '../controllers/cash.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/current', requirePermission('cash:list'), asyncHandler(cashController.getCurrent));
router.get('/history', requirePermission('cash:list'), asyncHandler(cashController.history));
router.post('/open', requirePermission('cash:manage'), asyncHandler(cashController.open));
router.post(
  '/:id/movements',
  requirePermission('cash:manage'),
  asyncHandler(cashController.addMovement),
);
router.post('/:id/close', requirePermission('cash:manage'), asyncHandler(cashController.close));

export default router;
