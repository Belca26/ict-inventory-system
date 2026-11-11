import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as c from './reports.controller';

const router = Router();
router.use(authenticate);

router.get('/summary', c.dashboardSummary); // cards: total assets, under maintenance, completed today, pending, overdue, departments, technicians
router.get('/charts', c.dashboardCharts); // assetsByDepartment, assetsByStatus, assetsByRam, monthlyMaintenanceTrend

export default router;
