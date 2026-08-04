import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('reports:view'));

router.get('/overview', asyncHandler(reportController.overview));
router.get('/sales', asyncHandler(reportController.sales));
router.get('/products', asyncHandler(reportController.products));
router.get('/customers', asyncHandler(reportController.customers));
router.get('/payments', asyncHandler(reportController.payments));
router.get('/operations', asyncHandler(reportController.operations));

export default router;
