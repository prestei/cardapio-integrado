import { Router } from 'express';
import { publicController } from '../controllers/public.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/:slug/menu', asyncHandler(publicController.getMenu));
router.get('/:slug/events', asyncHandler(publicController.subscribeMenuEvents));
router.get('/:slug/products/:productId', asyncHandler(publicController.getProduct));
router.post('/:slug/coupons/validate', asyncHandler(publicController.validateCoupon));
router.post('/:slug/delivery/calculate', asyncHandler(publicController.calculateDelivery));
router.post('/:slug/orders', asyncHandler(publicController.createOrder));
router.get('/:slug/orders/:code', asyncHandler(publicController.trackOrder));
router.post('/:slug/orders/:code/pay', asyncHandler(publicController.payOrder));
router.get('/:slug/promotions', asyncHandler(publicController.getPromotions));
router.get('/:slug/banners', asyncHandler(publicController.getBanners));
router.post('/:slug/banners/:bannerId/view', asyncHandler(publicController.registerBannerView));
router.post('/:slug/banners/:bannerId/click', asyncHandler(publicController.registerBannerClick));
router.get('/:slug/favorites', asyncHandler(publicController.listFavorites));
router.post('/:slug/favorites', asyncHandler(publicController.addFavorite));
router.delete('/:slug/favorites/:productId', asyncHandler(publicController.removeFavorite));
router.get('/:slug/customers/:phone/orders', asyncHandler(publicController.customerOrderHistory));
router.post('/:slug/reorder', asyncHandler(publicController.reorder));
router.get('/:slug/geo/autocomplete', asyncHandler(publicController.geoAutocomplete));
router.post('/:slug/geo/geocode', asyncHandler(publicController.geoGeocode));

export default router;
