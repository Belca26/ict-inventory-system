import { Request, Response, NextFunction } from 'express';
import * as reports from './reports.service';

function contextFrom(req: Request) {
  return { role: req.user!.role, departmentId: req.user!.departmentId };
}

const wrap = (fn: (ctx: ReturnType<typeof contextFrom>, req: Request) => Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await fn(contextFrom(req), req));
    } catch (err) {
      next(err);
    }
  };

// Inventory
export const inventoryByType = wrap((ctx) => reports.inventoryByType(ctx));
export const inventoryByDepartment = wrap((ctx) => reports.inventoryByDepartment(ctx));
export const inventoryByBuilding = wrap((ctx) => reports.inventoryByBuilding(ctx));

// Hardware
export const ramDistribution = wrap((ctx) => reports.ramDistribution(ctx));
export const storageDistribution = wrap((ctx) => reports.storageDistribution(ctx));
export const processorDistribution = wrap((ctx) => reports.processorDistribution(ctx));

// Maintenance
export const maintenanceSummary = wrap((ctx, req) =>
  reports.maintenanceSummary(ctx, (req.query.period as any) || 'month'),
);
export const mostRepairedAssets = wrap((ctx, req) =>
  reports.mostRepairedAssets(ctx, Number(req.query.minCount) || 3, Number(req.query.limit) || 20),
);
export const overdueMaintenance = wrap((ctx) => reports.overdueMaintenance(ctx));
export const averageRepairTime = wrap((ctx) => reports.averageRepairTime(ctx));
export const technicianPerformance = wrap((ctx) => reports.technicianPerformance(ctx));

// Replacement
export const warrantyExpiring = wrap((ctx, req) => reports.warrantyExpiring(ctx, Number(req.query.withinDays) || 90));
export const agingAssets = wrap((ctx, req) => reports.agingAssets(ctx, Number(req.query.olderThanYears) || 5));
export const replacementRecommendations = wrap((ctx) => reports.replacementRecommendations(ctx));

// Software
export const osDistribution = wrap((ctx) => reports.osDistribution(ctx));

// Network
export const networkInventory = wrap((ctx) => reports.networkInventory(ctx));

// Dashboard
export const dashboardSummary = wrap((ctx) => reports.dashboardSummary(ctx));
export const dashboardCharts = wrap((ctx) => reports.dashboardCharts(ctx));
