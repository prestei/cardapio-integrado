import { Router } from 'express';
import { kdsController } from '../controllers/kds.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('kds:view'));

router.get('/orders', asyncHandler(kdsController.list));
router.get('/events', asyncHandler(kdsController.subscribeEvents));

export default router;
