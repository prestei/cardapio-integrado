import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('campaigns:list'), asyncHandler(campaignController.list));
router.post('/', requirePermission('campaigns:manage'), asyncHandler(campaignController.create));
router.get('/:id', requirePermission('campaigns:list'), asyncHandler(campaignController.getById));
router.patch(
  '/:id',
  requirePermission('campaigns:manage'),
  asyncHandler(campaignController.update),
);
router.delete(
  '/:id',
  requirePermission('campaigns:manage'),
  asyncHandler(campaignController.delete),
);

export default router;
