import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import establishmentRoutes from './establishment.routes.js';
import publicRoutes from './public.routes.js';
import additionalRoutes from './additional.routes.js';
import couponRoutes from './coupon.routes.js';
import deliveryRoutes from './delivery.routes.js';
import customerRoutes from './customer.routes.js';
import userRoutes from './user.routes.js';
import qrRoutes from './qr.routes.js';
import promotionRoutes from './promotion.routes.js';
import bannerRoutes from './banner.routes.js';
import campaignRoutes from './campaign.routes.js';
import reportRoutes from './report.routes.js';
import cashRoutes from './cash.routes.js';
import kdsRoutes from './kds.routes.js';
import notificationSettingsRoutes from './notification-settings.routes.js';
import notificationRoutes from './notification.routes.js';
import webhookRoutes from './webhook.routes.js';
import menuImportRoutes from './menu-import.routes.js';

const router = Router();

router.use('/public', publicRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/establishment', establishmentRoutes);
router.use('/additional-groups', additionalRoutes);
router.use('/coupons', couponRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/customers', customerRoutes);
router.use('/users', userRoutes);
router.use('/qr-codes', qrRoutes);
router.use('/promotions', promotionRoutes);
router.use('/banners', bannerRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/cash', cashRoutes);
router.use('/kds', kdsRoutes);
router.use('/notification-settings', notificationSettingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/menu-imports', menuImportRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default router;
