import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { exportReportHandler, exportAssetsHandler, exportMaintenanceHandler } from './export.controller';

const router = Router();
router.use(authenticate); // same viewers as reports: Admin, Technician, Dept Rep, Auditor

// GET /api/export/assets?format=csv|xlsx|pdf&<any search.service filter>
router.get('/assets', exportAssetsHandler);

// GET /api/export/maintenance?format=csv|xlsx|pdf&<any maintenance list filter>
router.get('/maintenance', exportMaintenanceHandler);

// GET /api/export/reports/:reportKey?format=csv|xlsx|pdf&<report-specific params>
// See export.service.ts REPORT_REGISTRY for the full list of valid reportKey values.
router.get('/reports/:reportKey', exportReportHandler);

export default router;
