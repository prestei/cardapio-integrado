import { Router } from 'express';
import { menuImportController, menuImportUpload } from '../controllers/menu-import.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permissions.js';

const router = Router();

router.use(requireAuth);

router.get('/', requirePermission('menu:import'), asyncHandler(menuImportController.list));
router.post(
  '/',
  requirePermission('menu:import'),
  menuImportUpload,
  asyncHandler(menuImportController.create),
);
router.get('/:id', requirePermission('menu:import'), asyncHandler(menuImportController.getById));
router.put('/:id', requirePermission('menu:import'), asyncHandler(menuImportController.update));
router.post(
  '/:id/process',
  requirePermission('menu:import'),
  asyncHandler(menuImportController.process),
);
router.post(
  '/:id/confirm',
  requirePermission('menu:import'),
  asyncHandler(menuImportController.confirm),
);
router.post(
  '/:id/cancel',
  requirePermission('menu:import'),
  asyncHandler(menuImportController.cancel),
);
router.delete('/:id', requirePermission('menu:import'), asyncHandler(menuImportController.delete));
router.get(
  '/:id/files/:fileId',
  requirePermission('menu:import'),
  asyncHandler(menuImportController.getFile),
);

export default router;
