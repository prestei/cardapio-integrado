import { Router } from 'express';
import { deliveryController } from '../controllers/delivery.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/zones',
  requirePermission('deliveries:list'),
  asyncHandler(deliveryController.listZones),
);
router.post(
  '/zones',
  requirePermission('deliveries:manage'),
  asyncHandler(deliveryController.createZone),
);
router.get(
  '/zones/:id',
  requirePermission('deliveries:list'),
  asyncHandler(deliveryController.getZone),
);
router.patch(
  '/zones/:id',
  requirePermission('deliveries:manage'),
  asyncHandler(deliveryController.updateZone),
);
router.delete(
  '/zones/:id',
  requirePermission('deliveries:manage'),
  asyncHandler(deliveryController.deleteZone),
);

router.get(
  '/orders',
  requirePermission('deliveries:list'),
  asyncHandler(deliveryController.listDeliveries),
);
router.get(
  '/orders/:id',
  requirePermission('deliveries:list'),
  asyncHandler(deliveryController.getDelivery),
);
router.patch(
  '/orders/:id/assign',
  requirePermission('deliveries:manage'),
  asyncHandler(deliveryController.assignCourier),
);
router.patch(
  '/orders/:id/times',
  requirePermission('deliveries:manage'),
  asyncHandler(deliveryController.updateTimes),
);

export default router;
