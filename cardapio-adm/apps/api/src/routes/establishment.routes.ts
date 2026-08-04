import { Router } from 'express';
import { establishmentController } from '../controllers/establishment.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('establishment:view'), asyncHandler(establishmentController.get));
router.patch(
  '/',
  requirePermission('establishment:update'),
  asyncHandler(establishmentController.update),
);
router.patch(
  '/settings',
  requirePermission('establishment:update'),
  asyncHandler(establishmentController.updateSettings),
);
router.put(
  '/business-hours',
  requirePermission('establishment:update'),
  asyncHandler(establishmentController.replaceBusinessHours),
);

export default router;
