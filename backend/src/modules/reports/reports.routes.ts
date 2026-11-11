import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as c from './reports.controller';

const router = Router();
router.use(authenticate); // Admin, Technician, Dept Rep, Auditor can all view reports

// Inventory
router.get('/inventory/by-type', c.inventoryByType);
router.get('/inventory/by-department', c.inventoryByDepartment);
router.get('/inventory/by-building', c.inventoryByBuilding);

// Hardware
router.get('/hardware/ram-distribution', c.ramDistribution);
router.get('/hardware/storage-distribution', c.storageDistribution);
router.get('/hardware/processor-distribution', c.processorDistribution);

// Maintenance
router.get('/maintenance/summary', c.maintenanceSummary); // ?period=today|week|month|year
router.get('/maintenance/most-repaired', c.mostRepairedAssets); // ?minCount=&limit=
router.get('/maintenance/overdue', c.overdueMaintenance);
router.get('/maintenance/average-repair-time', c.averageRepairTime);
router.get('/maintenance/technician-performance', c.technicianPerformance);

// Replacement
router.get('/replacement/warranty-expiring', c.warrantyExpiring); // ?withinDays=
router.get('/replacement/aging', c.agingAssets); // ?olderThanYears=
router.get('/replacement/recommendations', c.replacementRecommendations);

// Software
router.get('/software/os-distribution', c.osDistribution);

// Network
router.get('/network/inventory', c.networkInventory);

export default router;
