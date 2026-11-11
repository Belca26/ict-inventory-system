import { Prisma, RoleName, AssetStatus, MaintenanceStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

interface RequestContext {
  role: RoleName;
  departmentId: string | null;
}

// Department Representatives only ever see their own department's numbers.
// Every report function below applies this the same way.
function scopedAssetWhere(ctx: RequestContext, extra: Prisma.AssetWhereInput = {}): Prisma.AssetWhereInput {
  const base: Prisma.AssetWhereInput = { deletedAt: null, ...extra };
  if (ctx.role === RoleName.DEPARTMENT_REPRESENTATIVE) {
    base.departmentId = ctx.departmentId ?? '__none__';
  }
  return base;
}

function scopedMaintenanceWhere(
  ctx: RequestContext,
  extra: Prisma.MaintenanceRecordWhereInput = {},
): Prisma.MaintenanceRecordWhereInput {
  const base: Prisma.MaintenanceRecordWhereInput = { ...extra };
  if (ctx.role === RoleName.DEPARTMENT_REPRESENTATIVE) {
    base.asset = { departmentId: ctx.departmentId ?? '__none__' };
  }
  return base;
}

// ---------------------------------------------------------------------------
// 1. INVENTORY REPORTS
// ---------------------------------------------------------------------------

export async function inventoryByType(ctx: RequestContext) {
  const assets = await prisma.asset.findMany({
    where: scopedAssetWhere(ctx),
    select: { assetType: { select: { name: true, category: true } } },
  });
  const counts = new Map<string, number>();
  for (const a of assets) {
    counts.set(a.assetType.name, (counts.get(a.assetType.name) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([assetType, count]) => ({ assetType, count }));
}

export async function inventoryByDepartment(ctx: RequestContext) {
  const rows = await prisma.asset.groupBy({
    by: ['departmentId'],
    where: scopedAssetWhere(ctx),
    _count: { _all: true },
    _sum: { cost: true },
  });
  const departments = await prisma.department.findMany({ select: { id: true, name: true } });
  const nameById = new Map(departments.map((d) => [d.id, d.name]));
  return rows
    .map((r) => ({
      departmentId: r.departmentId,
      department: r.departmentId ? nameById.get(r.departmentId) ?? 'Unknown' : 'Unassigned',
      assetCount: r._count._all,
      totalValue: r._sum.cost ?? 0,
    }))
    .sort((a, b) => Number(b.totalValue) - Number(a.totalValue)); // "most expensive department inventory" first
}

export async function inventoryByBuilding(ctx: RequestContext) {
  const rows = await prisma.asset.groupBy({
    by: ['buildingId'],
    where: scopedAssetWhere(ctx),
    _count: { _all: true },
  });
  const buildings = await prisma.building.findMany({ select: { id: true, name: true, campus: true } });
  const byId = new Map(buildings.map((b) => [b.id, b]));
  return rows.map((r) => ({
    buildingId: r.buildingId,
    building: r.buildingId ? byId.get(r.buildingId)?.name ?? 'Unknown' : 'Unassigned',
    campus: r.buildingId ? byId.get(r.buildingId)?.campus : null,
    assetCount: r._count._all,
  }));
}

// ---------------------------------------------------------------------------
// 2. HARDWARE REPORTS
// ---------------------------------------------------------------------------

const RAM_BUCKETS = [4, 8, 16, 32];

export async function ramDistribution(ctx: RequestContext) {
  const specs = await prisma.computerSpec.findMany({
    where: { asset: scopedAssetWhere(ctx) },
    select: { ramGb: true },
  });
  const buckets: Record<string, number> = {};
  for (const bucket of RAM_BUCKETS) buckets[`${bucket}GB`] = 0;
  buckets['Other'] = 0;

  for (const s of specs) {
    const key = RAM_BUCKETS.includes(s.ramGb ?? -1) ? `${s.ramGb}GB` : 'Other';
    buckets[key]++;
  }
  return buckets;
}

export async function storageDistribution(ctx: RequestContext) {
  const specs = await prisma.computerSpec.findMany({
    where: { asset: scopedAssetWhere(ctx) },
    select: { storageGb: true, storageType: true },
  });
  const counts = new Map<string, number>();
  for (const s of specs) {
    const label = `${s.storageGb ?? '?'}GB ${s.storageType ?? 'Unknown'}`;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

export async function processorDistribution(ctx: RequestContext) {
  const specs = await prisma.computerSpec.findMany({
    where: { asset: scopedAssetWhere(ctx) },
    select: { cpu: true },
  });
  const counts = new Map<string, number>();
  for (const s of specs) {
    const label = s.cpu?.trim() || 'Unknown';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([cpu, count]) => ({ cpu, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// 3. MAINTENANCE REPORTS
// ---------------------------------------------------------------------------

export async function maintenanceSummary(ctx: RequestContext, period: 'today' | 'week' | 'month' | 'year') {
  const now = new Date();
  const from = new Date(now);
  if (period === 'today') from.setHours(0, 0, 0, 0);
  if (period === 'week') from.setDate(now.getDate() - 7);
  if (period === 'month') from.setMonth(now.getMonth() - 1);
  if (period === 'year') from.setFullYear(now.getFullYear() - 1);

  const count = await prisma.maintenanceRecord.count({
    where: scopedMaintenanceWhere(ctx, { createdAt: { gte: from } }),
  });
  return { period, from, to: now, count };
}

// "Which assets have required maintenance more than N times" / most-repaired devices.
export async function mostRepairedAssets(ctx: RequestContext, minCount = 3, limit = 20) {
  const rows = await prisma.maintenanceRecord.groupBy({
    by: ['assetId'],
    where: scopedMaintenanceWhere(ctx),
    _count: { _all: true },
    having: { assetId: { _count: { gte: minCount } } },
    orderBy: { _count: { assetId: 'desc' } },
    take: limit,
  });
  const assets = await prisma.asset.findMany({
    where: { id: { in: rows.map((r) => r.assetId) } },
    select: { id: true, assetTag: true, model: true, assetType: { select: { name: true } } },
  });
  const byId = new Map(assets.map((a) => [a.id, a]));
  return rows.map((r) => ({ asset: byId.get(r.assetId), maintenanceCount: r._count._all }));
}

export async function overdueMaintenance(ctx: RequestContext) {
  const schedules = await prisma.maintenanceSchedule.findMany({
    where: {
      isActive: true,
      nextDueDate: { lt: new Date() },
      asset: scopedAssetWhere(ctx),
    },
    include: {
      asset: { select: { id: true, assetTag: true, model: true, departmentId: true } },
    },
    orderBy: { nextDueDate: 'asc' },
  });
  return schedules.map((s) => ({
    asset: s.asset,
    nextDueDate: s.nextDueDate,
    daysOverdue: Math.floor((Date.now() - s.nextDueDate.getTime()) / (1000 * 60 * 60 * 24)),
  }));
}

export async function averageRepairTime(ctx: RequestContext) {
  const result = await prisma.maintenanceRecord.aggregate({
    where: scopedMaintenanceWhere(ctx, { status: MaintenanceStatus.COMPLETED, labourHours: { not: null } }),
    _avg: { labourHours: true },
    _count: { _all: true },
  });
  return { averageLabourHours: result._avg.labourHours ?? 0, sampleSize: result._count._all };
}

export async function technicianPerformance(ctx: RequestContext) {
  const rows = await prisma.maintenanceRecord.groupBy({
    by: ['technicianId', 'status'],
    where: scopedMaintenanceWhere(ctx),
    _count: { _all: true },
    _avg: { labourHours: true },
  });

  const technicianIds = [...new Set(rows.map((r) => r.technicianId))];
  const technicians = await prisma.user.findMany({
    where: { id: { in: technicianIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const byId = new Map(technicians.map((t) => [t.id, `${t.firstName} ${t.lastName}`]));

  const perTechnician = new Map<string, { technician: string; completed: number; pending: number; cancelled: number; avgLabourHours: number[] }>();
  for (const r of rows) {
    const key = r.technicianId;
    if (!perTechnician.has(key)) {
      perTechnician.set(key, { technician: byId.get(key) ?? 'Unknown', completed: 0, pending: 0, cancelled: 0, avgLabourHours: [] });
    }
    const entry = perTechnician.get(key)!;
    if (r.status === MaintenanceStatus.COMPLETED) entry.completed = r._count._all;
    if (r.status === MaintenanceStatus.PENDING) entry.pending = r._count._all;
    if (r.status === MaintenanceStatus.CANCELLED) entry.cancelled = r._count._all;
    if (r._avg.labourHours !== null) {
  entry.avgLabourHours.push(Number(r._avg.labourHours));
}
  }

  return Array.from(perTechnician.values()).map((e) => ({
    technician: e.technician,
    completed: e.completed,
    pending: e.pending,
    cancelled: e.cancelled,
    averageLabourHours: e.avgLabourHours.length
      ? e.avgLabourHours.reduce((a, b) => a + b, 0) / e.avgLabourHours.length
      : null,
  }));
}

// ---------------------------------------------------------------------------
// 4. REPLACEMENT REPORTS
// ---------------------------------------------------------------------------

export async function warrantyExpiring(ctx: RequestContext, withinDays = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);
  return prisma.asset.findMany({
    where: scopedAssetWhere(ctx, { warrantyExpiry: { lte: cutoff, gte: new Date() } }),
    select: { id: true, assetTag: true, model: true, warrantyExpiry: true, department: { select: { name: true } } },
    orderBy: { warrantyExpiry: 'asc' },
  });
}

export async function agingAssets(ctx: RequestContext, olderThanYears = 5) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - olderThanYears);
  return prisma.asset.findMany({
    where: scopedAssetWhere(ctx, { purchaseDate: { lte: cutoff } }),
    select: { id: true, assetTag: true, model: true, purchaseDate: true, department: { select: { name: true } } },
    orderBy: { purchaseDate: 'asc' },
  });
}

// "Recommended for replacement" = aging AND frequently repaired — a simple,
// explainable heuristic rather than a black-box score. Refine later with
// real depreciation/failure-cost data if the university wants it weighted.
export async function replacementRecommendations(ctx: RequestContext) {
  const [aging, repaired] = await Promise.all([agingAssets(ctx, 5), mostRepairedAssets(ctx, 3, 100)]);
  const repairedIds = new Set(repaired.map((r) => r.asset?.id));
  return aging
    .filter((a) => repairedIds.has(a.id))
    .map((a) => ({ ...a, maintenanceCount: repaired.find((r) => r.asset?.id === a.id)?.maintenanceCount }));
}

// ---------------------------------------------------------------------------
// 5. SOFTWARE REPORTS
// ---------------------------------------------------------------------------
// NOTE: the schema doesn't have a dedicated software-inventory table (only
// ComputerSpec.os). ERP/Office/Antivirus status is therefore inferred from
// maintenance procedure history, which is a proxy, not a live install state.
// If precise software tracking becomes a requirement, add a SoftwareInstalled
// join table (assetId, softwareName, version, installedAt) — flagging this
// as a schema gap rather than faking precision here.

export async function osDistribution(ctx: RequestContext) {
  const specs = await prisma.computerSpec.findMany({
    where: { asset: scopedAssetWhere(ctx) },
    select: { os: true },
  });
  const counts = new Map<string, number>();
  for (const s of specs) {
    const label = s.os?.trim() || 'Unknown';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([os, count]) => ({ os, count }));
}

// ---------------------------------------------------------------------------
// 6. NETWORK REPORTS
// ---------------------------------------------------------------------------

export async function networkInventory(ctx: RequestContext) {
  const assets = await prisma.asset.findMany({
    where: scopedAssetWhere(ctx, { assetType: { category: 'NETWORK_DEVICE' } }),
    include: { assetType: true, networkDeviceSpec: true, department: { select: { name: true } } },
  });

  const byType = new Map<string, number>();
  const byFirmware = new Map<string, number>();
  const ipUsage: { assetTag: string; ipAddress: string | null }[] = [];

  for (const a of assets) {
    byType.set(a.assetType.name, (byType.get(a.assetType.name) ?? 0) + 1);
    const fw = a.networkDeviceSpec?.firmwareVersion || 'Unknown';
    byFirmware.set(fw, (byFirmware.get(fw) ?? 0) + 1);
    ipUsage.push({ assetTag: a.assetTag, ipAddress: a.networkDeviceSpec?.ipAddress ?? null });
  }

  return {
    byType: Array.from(byType.entries()).map(([type, count]) => ({ type, count })),
    byFirmwareVersion: Array.from(byFirmware.entries()).map(([firmwareVersion, count]) => ({ firmwareVersion, count })),
    ipUsage,
  };
}

// ---------------------------------------------------------------------------
// 7. DASHBOARD
// ---------------------------------------------------------------------------

export async function dashboardSummary(ctx: RequestContext) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalAssets, underMaintenance, completedToday, pendingJobs, overdue, departments, technicians] =
    await Promise.all([
      prisma.asset.count({ where: scopedAssetWhere(ctx) }),
      prisma.asset.count({ where: scopedAssetWhere(ctx, { status: AssetStatus.UNDER_MAINTENANCE }) }),
      prisma.maintenanceRecord.count({
        where: scopedMaintenanceWhere(ctx, { status: MaintenanceStatus.COMPLETED, updatedAt: { gte: todayStart } }),
      }),
      prisma.maintenanceRecord.count({ where: scopedMaintenanceWhere(ctx, { status: MaintenanceStatus.PENDING }) }),
      prisma.maintenanceSchedule.count({
        where: { isActive: true, nextDueDate: { lt: new Date() }, asset: scopedAssetWhere(ctx) },
      }),
      ctx.role === RoleName.DEPARTMENT_REPRESENTATIVE ? 1 : prisma.department.count(),
      prisma.user.count({ where: { role: { name: RoleName.ICT_TECHNICIAN }, isActive: true, deletedAt: null } }),
    ]);

  return { totalAssets, underMaintenance, completedToday, pendingJobs, overdueMaintenance: overdue, departments, technicians };
}

export async function dashboardCharts(ctx: RequestContext) {
  const [byDepartment, byStatus, byRam, monthlyTrend] = await Promise.all([
    inventoryByDepartment(ctx),
    prisma.asset.groupBy({ by: ['status'], where: scopedAssetWhere(ctx), _count: { _all: true } }),
    ramDistribution(ctx),
    monthlyMaintenanceTrend(ctx),
  ]);

  return {
    assetsByDepartment: byDepartment.map((d) => ({ label: d.department, value: d.assetCount })),
    assetsByStatus: byStatus.map((s) => ({ label: s.status, value: s._count._all })),
    assetsByRam: Object.entries(byRam).map(([label, value]) => ({ label, value })),
    monthlyMaintenanceTrend: monthlyTrend,
  };
}

async function monthlyMaintenanceTrend(ctx: RequestContext, monthsBack = 12) {
  const from = new Date();
  from.setMonth(from.getMonth() - monthsBack);
  from.setDate(1);
  from.setHours(0, 0, 0, 0);

  const records = await prisma.maintenanceRecord.findMany({
    where: scopedMaintenanceWhere(ctx, { createdAt: { gte: from } }),
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (const r of records) {
    const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}
