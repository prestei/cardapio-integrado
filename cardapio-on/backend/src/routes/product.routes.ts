import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(productController.list));
router.post('/', requireRole('OWNER', 'ADMIN', 'MANAGER'), asyncHandler(productController.create));
router.get('/:id', asyncHandler(productController.getById));
router.patch('/:id', requireRole('OWNER', 'ADMIN', 'MANAGER'), asyncHandler(productController.update));
router.delete('/:id', requireRole('OWNER', 'ADMIN', 'MANAGER'), asyncHandler(productController.delete));
router.post('/:id/duplicate', requireRole('OWNER', 'ADMIN', 'MANAGER'), asyncHandler(productController.duplicate));
router.patch('/:id/price', requireRole('OWNER', 'ADMIN', 'MANAGER'), asyncHandler(productController.updatePrice));

export default router;
