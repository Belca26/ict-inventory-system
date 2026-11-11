import { Router } from 'express';
import { RoleName } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createAssetSchema,
  updateAssetSchema,
  changeAssetStatusSchema,
  listAssetsQuerySchema,
} from './asset.schema';
import {
  createAssetHandler,
  getAssetHandler,
  listAssetsHandler,
  updateAssetHandler,
  changeAssetStatusHandler,
  deleteAssetHandler,
} from './asset.controller';

const router = Router();

router.use(authenticate); // every asset route requires a logged-in user

// All four roles can view — department-scoping for Dept Reps happens inside the service.
router.get('/', validate(listAssetsQuerySchema), listAssetsHandler);
router.get('/:id', getAssetHandler);

// Only Admin + Technician can register or edit assets.
router.post(
  '/',
  authorize(RoleName.SYSTEM_ADMIN, RoleName.ICT_TECHNICIAN),
  validate(createAssetSchema),
  createAssetHandler,
);
router.patch(
  '/:id',
  authorize(RoleName.SYSTEM_ADMIN, RoleName.ICT_TECHNICIAN),
  validate(updateAssetSchema),
  updateAssetHandler,
);
router.patch(
  '/:id/status',
  authorize(RoleName.SYSTEM_ADMIN, RoleName.ICT_TECHNICIAN),
  validate(changeAssetStatusSchema),
  changeAssetStatusHandler,
);

// Retiring/disposing an asset record is Admin-only.
router.delete('/:id', authorize(RoleName.SYSTEM_ADMIN), deleteAssetHandler);

export default router;
