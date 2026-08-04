import { Router } from 'express';
import { publicController } from '../controllers/public.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/:slug/menu', asyncHandler(publicController.getMenu));
router.get('/:slug/products/:productId', asyncHandler(publicController.getProduct));
router.post('/:slug/coupons/validate', asyncHandler(publicController.validateCoupon));
router.post('/:slug/delivery/calculate', asyncHandler(publicController.calculateDelivery));
router.post('/:slug/orders', asyncHandler(publicController.createOrder));
router.get('/:slug/orders/:code', asyncHandler(publicController.trackOrder));

export default router;
