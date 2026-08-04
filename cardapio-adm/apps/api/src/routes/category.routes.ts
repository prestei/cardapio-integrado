import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('categories:list'), asyncHandler(categoryController.list));
router.post(
  '/',
  requirePermission('categories:create'),
  asyncHandler(categoryController.create),
);
router.patch(
  '/reorder',
  requirePermission('categories:reorder'),
  asyncHandler(categoryController.reorder),
);
router.get(
  '/:id',
  requirePermission('categories:list'),
  asyncHandler(categoryController.getById),
);
router.patch(
  '/:id',
  requirePermission('categories:update'),
  asyncHandler(categoryController.update),
);
router.delete(
  '/:id',
  requirePermission('categories:delete'),
  asyncHandler(categoryController.delete),
);

export default router;
