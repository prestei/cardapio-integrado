import { Router } from 'express';
import { notificationSettingsController } from '../controllers/notification.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('notifications:manage'));

router.get('/', asyncHandler(notificationSettingsController.get));
router.patch('/', asyncHandler(notificationSettingsController.update));

export default router;
