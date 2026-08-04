import { Router } from 'express';
import { bannerController } from '../controllers/banner.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('banners:list'), asyncHandler(bannerController.list));
router.post('/', requirePermission('banners:manage'), asyncHandler(bannerController.create));
router.get('/:id', requirePermission('banners:list'), asyncHandler(bannerController.getById));
router.patch('/:id', requirePermission('banners:manage'), asyncHandler(bannerController.update));
router.delete('/:id', requirePermission('banners:manage'), asyncHandler(bannerController.delete));

export default router;
