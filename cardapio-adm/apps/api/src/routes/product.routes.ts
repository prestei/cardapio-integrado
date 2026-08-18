import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('products:list'), asyncHandler(productController.list));
router.post('/', requirePermission('products:create'), asyncHandler(productController.create));
router.patch(
  '/reorder',
  requirePermission('products:reorder'),
  asyncHandler(productController.reorder),
);
router.get('/:id', requirePermission('products:list'), asyncHandler(productController.getById));
router.patch(
  '/:id',
  requirePermission('products:update'),
  asyncHandler(productController.update),
);
router.delete(
  '/:id',
  requirePermission('products:delete'),
  asyncHandler(productController.delete),
);
router.post(
  '/:id/duplicate',
  requirePermission('products:duplicate'),
  asyncHandler(productController.duplicate),
);
router.patch(
  '/:id/price',
  requirePermission('products:updatePrice'),
  asyncHandler(productController.updatePrice),
);

export default router;
