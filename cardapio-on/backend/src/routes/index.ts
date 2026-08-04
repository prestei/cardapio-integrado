import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import establishmentRoutes from './establishment.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/establishment', establishmentRoutes);

// Aliases preparados para o painel administrativo
router.use('/admin/categories', categoryRoutes);
router.use('/admin/products', productRoutes);
router.use('/admin/orders', orderRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default router;
