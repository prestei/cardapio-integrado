import { Router } from 'express';
import { qrController } from '../controllers/qr.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('qr:list'), asyncHandler(qrController.list));
router.post('/', requirePermission('qr:manage'), asyncHandler(qrController.create));
router.get('/:id', requirePermission('qr:list'), asyncHandler(qrController.getById));
router.patch('/:id', requirePermission('qr:manage'), asyncHandler(qrController.update));
router.delete('/:id', requirePermission('qr:manage'), asyncHandler(qrController.delete));

export default router;
