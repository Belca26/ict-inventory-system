import { RoleName } from '@prisma/client';
import * as reports from '../reports/reports.service';

interface RequestContext {
  role: RoleName;
  departmentId: string | null;
}

type ReportFn = (ctx: RequestContext, query: Record<string, string>) => Promise<unknown>;

// Registry of every report the export endpoint can produce. Keeping this as
// a lookup table (rather than one route per report) means CSV/XLSX/PDF
// support is automatic for every report added here — no export-specific
// code needed per report.
export const REPORT_REGISTRY: Record<string, ReportFn> = {
  'inventory-by-type': (ctx) => reports.inventoryByType(ctx),
  'inventory-by-department': (ctx) => reports.inventoryByDepartment(ctx),
  'inventory-by-building': (ctx) => reports.inventoryByBuilding(ctx),

  'hardware-ram-distribution': (ctx) => reports.ramDistribution(ctx),
  'hardware-storage-distribution': (ctx) => reports.storageDistribution(ctx),
  'hardware-processor-distribution': (ctx) => reports.processorDistribution(ctx),

  'maintenance-summary': (ctx, q) => reports.maintenanceSummary(ctx, (q.period as any) || 'month'),
  'maintenance-most-repaired': (ctx, q) =>
    reports.mostRepairedAssets(ctx, Number(q.minCount) || 3, Number(q.limit) || 50),
  'maintenance-overdue': (ctx) => reports.overdueMaintenance(ctx),
  'maintenance-average-repair-time': (ctx) => reports.averageRepairTime(ctx),
  'maintenance-technician-performance': (ctx) => reports.technicianPerformance(ctx),

  'replacement-warranty-expiring': (ctx, q) => reports.warrantyExpiring(ctx, Number(q.withinDays) || 90),
  'replacement-aging': (ctx, q) => reports.agingAssets(ctx, Number(q.olderThanYears) || 5),
  'replacement-recommendations': (ctx) => reports.replacementRecommendations(ctx),

  'software-os-distribution': (ctx) => reports.osDistribution(ctx),

  // network-inventory returns { byType, byFirmwareVersion, ipUsage } — pick
  // one via ?section=, since a tabular export needs one flat list, not three.
  'network-inventory': async (ctx, q) => {
    const result = await reports.networkInventory(ctx);
    const section = (q.section as keyof typeof result) || 'ipUsage';
    return result[section] ?? result.ipUsage;
  },
};

/**
 * Normalizes any report's return shape into an array of row objects,
 * which is what the CSV/XLSX/PDF writers expect. Single-object summaries
 * (e.g. maintenance-summary, average-repair-time) become a one-row table.
 */
export function normalizeToRows(result: unknown): Record<string, any>[] {
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object') return [result as Record<string, any>];
  return [{ value: result }];
}
