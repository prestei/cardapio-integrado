import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(categoryController.list));
router.post('/', requireRole('OWNER', 'ADMIN', 'MANAGER'), asyncHandler(categoryController.create));
router.patch('/reorder', requireRole('OWNER', 'ADMIN', 'MANAGER'), asyncHandler(categoryController.reorder));
router.get('/:id', asyncHandler(categoryController.getById));
router.patch('/:id', requireRole('OWNER', 'ADMIN', 'MANAGER'), asyncHandler(categoryController.update));
router.delete('/:id', requireRole('OWNER', 'ADMIN', 'MANAGER'), asyncHandler(categoryController.delete));

export default router;
