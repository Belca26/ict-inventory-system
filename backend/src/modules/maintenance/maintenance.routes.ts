import { Router } from 'express';
import { RoleName } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { uploadMaintenanceAttachment } from './upload.config';
import {
  createMaintenanceRecordSchema,
  updateMaintenanceRecordSchema,
  addProceduresSchema,
  addPartsSchema,
  signMaintenanceRecordSchema,
  listMaintenanceQuerySchema,
} from './maintenance.schema';
import {
  createHandler,
  getHandler,
  listHandler,
  updateHandler,
  addProceduresHandler,
  addPartsHandler,
  uploadAttachmentHandler,
  signHandler,
} from './maintenance.controller';

const router = Router();

router.use(authenticate);

// All 4 roles can view — Department Reps are scoped to their department in the service.
router.get('/', validate(listMaintenanceQuerySchema), listHandler);
router.get('/:id', getHandler);

// Opening/editing a job is Admin + Technician only.
router.post(
  '/',
  authorize(RoleName.SYSTEM_ADMIN, RoleName.ICT_TECHNICIAN),
  validate(createMaintenanceRecordSchema),
  createHandler,
);
router.patch(
  '/:id',
  authorize(RoleName.SYSTEM_ADMIN, RoleName.ICT_TECHNICIAN),
  validate(updateMaintenanceRecordSchema),
  updateHandler,
);
router.post(
  '/:id/procedures',
  authorize(RoleName.SYSTEM_ADMIN, RoleName.ICT_TECHNICIAN),
  validate(addProceduresSchema),
  addProceduresHandler,
);
router.post(
  '/:id/parts',
  authorize(RoleName.SYSTEM_ADMIN, RoleName.ICT_TECHNICIAN),
  validate(addPartsSchema),
  addPartsHandler,
);
router.post(
  '/:id/attachments',
  authorize(RoleName.SYSTEM_ADMIN, RoleName.ICT_TECHNICIAN),
  uploadMaintenanceAttachment.single('file'),
  uploadAttachmentHandler,
);

// Sign-off: technician signs their own work; department rep confirms completion.
// The service enforces a dept rep can only sign a record already marked COMPLETED.
router.post(
  '/:id/signatures',
  authorize(RoleName.SYSTEM_ADMIN, RoleName.ICT_TECHNICIAN, RoleName.DEPARTMENT_REPRESENTATIVE),
  validate(signMaintenanceRecordSchema),
  signHandler,
);

export default router;
