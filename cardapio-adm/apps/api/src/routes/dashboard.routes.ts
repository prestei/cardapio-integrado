import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/metrics',
  requirePermission('dashboard:view'),
  asyncHandler(dashboardController.metrics),
);
router.get(
  '/alerts',
  requirePermission('dashboard:view'),
  asyncHandler(dashboardController.alerts),
);

export default router;
