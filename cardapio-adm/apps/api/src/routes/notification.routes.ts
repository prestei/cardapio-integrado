import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(notificationController.list));
router.patch('/read-all', asyncHandler(notificationController.markAllRead));
router.patch('/:id/read', asyncHandler(notificationController.markRead));

export default router;
