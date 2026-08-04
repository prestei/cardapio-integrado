import { Router } from 'express';
import { additionalController } from '../controllers/additional.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('additionals:list'), asyncHandler(additionalController.list));
router.post(
  '/',
  requirePermission('additionals:manage'),
  asyncHandler(additionalController.create),
);

router.patch(
  '/additionals/:additionalId',
  requirePermission('additionals:manage'),
  asyncHandler(additionalController.updateAdditional),
);
router.delete(
  '/additionals/:additionalId',
  requirePermission('additionals:manage'),
  asyncHandler(additionalController.deleteAdditional),
);

router.get(
  '/:id',
  requirePermission('additionals:list'),
  asyncHandler(additionalController.getById),
);
router.patch(
  '/:id',
  requirePermission('additionals:manage'),
  asyncHandler(additionalController.update),
);
router.delete(
  '/:id',
  requirePermission('additionals:manage'),
  asyncHandler(additionalController.delete),
);

router.post(
  '/:id/additionals',
  requirePermission('additionals:manage'),
  asyncHandler(additionalController.createAdditional),
);

router.post(
  '/:id/products',
  requirePermission('additionals:manage'),
  asyncHandler(additionalController.linkProduct),
);
router.delete(
  '/:id/products/:productId',
  requirePermission('additionals:manage'),
  asyncHandler(additionalController.unlinkProduct),
);

export default router;
