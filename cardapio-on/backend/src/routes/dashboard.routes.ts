import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/metrics', asyncHandler(dashboardController.metrics));

export default router;
