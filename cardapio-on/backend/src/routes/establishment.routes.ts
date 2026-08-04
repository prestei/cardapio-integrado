import { Router } from 'express';
import { establishmentController } from '../controllers/establishment.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(establishmentController.get));
router.patch('/', requireRole('OWNER', 'ADMIN'), asyncHandler(establishmentController.update));

export default router;
