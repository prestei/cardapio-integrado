import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('users:list'), asyncHandler(userController.list));
router.post('/', requirePermission('users:manage'), asyncHandler(userController.create));
router.patch('/:id', requirePermission('users:manage'), asyncHandler(userController.update));

export default router;
