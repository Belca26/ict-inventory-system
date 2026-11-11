import { Prisma, RoleName, MaintenanceStatus, AssetStatus, SignerRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AuthError } from '../auth/auth.service';
import { writeAuditLog } from '../../utils/audit';

interface RequestContext {
  userId: string;
  role: RoleName;
  departmentId: string | null;
  ipAddress?: string;
}

const FULL_RECORD_INCLUDE = {
  asset: { select: { id: true, assetTag: true, departmentId: true, status: true } },
  technician: { select: { id: true, firstName: true, lastName: true } },
  department: true,
  procedures: { include: { procedureType: true } },
  parts: true,
  attachments: true,
  signatures: { include: { signerUser: { select: { id: true, firstName: true, lastName: true } } } },
} satisfies Prisma.MaintenanceRecordInclude;

async function validateProcedureEntries(entries: { procedureTypeId: string; customLabel?: string }[]) {
  if (entries.length === 0) return;
  const ids = entries.map((e) => e.procedureTypeId);
  const types = await prisma.procedureType.findMany({ where: { id: { in: ids } } });
  const byId = new Map(types.map((t) => [t.id, t]));

  for (const entry of entries) {
    const type = byId.get(entry.procedureTypeId);
    if (!type) throw new AuthError(`Unknown procedure type: ${entry.procedureTypeId}`, 400);
    if (type.isCustom && !entry.customLabel) {
      throw new AuthError(`Procedure "${type.name}" requires a customLabel describing the work done`, 400);
    }
  }
}

export async function createMaintenanceRecord(input: any, ctx: RequestContext) {
  const asset = await prisma.asset.findUnique({ where: { id: input.assetId, deletedAt: null } });
  if (!asset) throw new AuthError('Asset not found', 404);

  await validateProcedureEntries(input.procedures);

  const labourHours = computeLabourHours(input.timeStarted, input.timeFinished);

  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.maintenanceRecord.create({
      data: {
        assetId: input.assetId,
        technicianId: ctx.userId,
        departmentId: input.departmentId ?? asset.departmentId,
        maintenanceType: input.maintenanceType,
        status: input.status ?? MaintenanceStatus.PENDING,
        technicianNotes: input.technicianNotes,
        recommendations: input.recommendations,
        timeStarted: input.timeStarted,
        timeFinished: input.timeFinished,
        labourHours,
        procedures: {
          create: input.procedures.map((p: any) => ({
            procedureTypeId: p.procedureTypeId,
            customLabel: p.customLabel,
          })),
        },
        parts: { create: input.parts },
      },
      include: FULL_RECORD_INCLUDE,
    });

    // Opening a maintenance job puts the asset into UNDER_MAINTENANCE unless
// it's already in a terminal state (RETIRED / DISPOSED / LOST).
if (
  asset.status !== AssetStatus.RETIRED &&
  asset.status !== AssetStatus.DISPOSED &&
  asset.status !== AssetStatus.LOST
) {
  await tx.asset.update({
    where: { id: asset.id },
    data: { status: AssetStatus.UNDER_MAINTENANCE },
  });
}
    return created;
  });

  await writeAuditLog(ctx, 'CREATE', 'MaintenanceRecord', record.id, null, record);
  return record;
}

export async function getMaintenanceRecordById(id: string, ctx: RequestContext) {
  const record = await prisma.maintenanceRecord.findUnique({
    where: { id },
    include: FULL_RECORD_INCLUDE,
  });
  if (!record) throw new AuthError('Maintenance record not found', 404);
  enforceDepartmentScope(ctx, record.asset.departmentId);
  return record;
}

export async function listMaintenanceRecords(query: any, ctx: RequestContext) {
  const {
  assetId,
  technicianId,
  departmentId,
  maintenanceType,
  status,
  dateFrom,
  dateTo,
} = query;

const page = Math.max(1, Number(query.page) || 1);
const pageSize = Math.max(1, Math.min(100, Number(query.pageSize) || 25));

const sortDir =
  query.sortDir === 'asc' || query.sortDir === 'desc'
    ? query.sortDir
    : 'desc';

  const where: Prisma.MaintenanceRecordWhereInput = {};

  if (ctx.role === RoleName.DEPARTMENT_REPRESENTATIVE) {
    where.asset = { departmentId: ctx.departmentId ?? '__none__' };
  } else if (departmentId) {
    where.departmentId = departmentId;
  }

  if (assetId) where.assetId = assetId;
  if (technicianId) where.technicianId = technicianId;
  if (maintenanceType) where.maintenanceType = maintenanceType;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    };
  }

  const [items, total] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      where,
      include: FULL_RECORD_INCLUDE,
      orderBy: { createdAt: sortDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.maintenanceRecord.count({ where }),
  ]);

  return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function updateMaintenanceRecord(id: string, input: any, ctx: RequestContext) {
  const existing = await prisma.maintenanceRecord.findUnique({
    where: { id },
    include: { asset: true },
  });
  if (!existing) throw new AuthError('Maintenance record not found', 404);
  enforceDepartmentScope(ctx, existing.asset.departmentId);

  // Only the technician who opened the job (or an Admin) can update it.
  if (ctx.role === RoleName.ICT_TECHNICIAN && existing.technicianId !== ctx.userId) {
    throw new AuthError('Forbidden — only the assigned technician can update this record', 403);
  }

  const timeStarted = input.timeStarted ?? existing.timeStarted ?? undefined;
  const timeFinished = input.timeFinished ?? existing.timeFinished ?? undefined;
  const labourHours = computeLabourHours(timeStarted, timeFinished);

  const record = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRecord.update({
      where: { id },
      data: {
        status: input.status,
        technicianNotes: input.technicianNotes,
        recommendations: input.recommendations,
        timeStarted: input.timeStarted,
        timeFinished: input.timeFinished,
        ...(labourHours !== undefined && { labourHours }),
      },
      include: FULL_RECORD_INCLUDE,
    });

    // Completing the job reverts the asset to ACTIVE — but only if the asset
    // wasn't independently moved to a terminal state in the meantime.
    if (
      input.status === MaintenanceStatus.COMPLETED &&
      existing.asset.status === AssetStatus.UNDER_MAINTENANCE
    ) {
      await tx.asset.update({ where: { id: existing.assetId }, data: { status: AssetStatus.ACTIVE } });
    }

    return updated;
  });

  await writeAuditLog(ctx, 'UPDATE', 'MaintenanceRecord', id, existing, record);
  return record;
}

export async function addProcedures(
  id: string,
  procedures: { procedureTypeId: string; customLabel?: string }[],
  ctx: RequestContext,
) {
  const record = await prisma.maintenanceRecord.findUnique({ where: { id }, include: { asset: true } });
  if (!record) throw new AuthError('Maintenance record not found', 404);
  enforceDepartmentScope(ctx, record.asset.departmentId);
  await validateProcedureEntries(procedures);

  try {
    await prisma.maintenanceProcedurePerformed.createMany({
      data: procedures.map((p) => ({
        maintenanceRecordId: id,
        procedureTypeId: p.procedureTypeId,
        customLabel: p.customLabel,
      })),
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AuthError('One or more of these procedures is already logged on this record', 409);
    }
    throw err;
  }

  return getMaintenanceRecordById(id, ctx);
}

export async function addParts(
  id: string,
  parts: { partName: string; quantity: number; cost?: number }[],
  ctx: RequestContext,
) {
  const record = await prisma.maintenanceRecord.findUnique({ where: { id }, include: { asset: true } });
  if (!record) throw new AuthError('Maintenance record not found', 404);
  enforceDepartmentScope(ctx, record.asset.departmentId);

  await prisma.maintenancePart.createMany({
    data: parts.map((p) => ({ maintenanceRecordId: id, partName: p.partName, quantity: p.quantity, cost: p.cost })),
  });

  return getMaintenanceRecordById(id, ctx);
}

export async function addAttachment(
  id: string,
  attachment: { type: 'PHOTO' | 'PDF_REPORT' | 'INVOICE' | 'DOCUMENT'; filePath: string; fileName: string; fileSizeBytes?: number },
  ctx: RequestContext,
) {
  const record = await prisma.maintenanceRecord.findUnique({ where: { id }, include: { asset: true } });
  if (!record) throw new AuthError('Maintenance record not found', 404);
  enforceDepartmentScope(ctx, record.asset.departmentId);

  const created = await prisma.maintenanceAttachment.create({
    data: { maintenanceRecordId: id, ...attachment },
  });
  await writeAuditLog(ctx, 'CREATE', 'MaintenanceAttachment', created.id, null, created);
  return created;
}

export async function signMaintenanceRecord(id: string, signatureImagePath: string, ctx: RequestContext) {
  const record = await prisma.maintenanceRecord.findUnique({ where: { id }, include: { asset: true } });
  if (!record) throw new AuthError('Maintenance record not found', 404);
  enforceDepartmentScope(ctx, record.asset.departmentId);

  let signerRole: SignerRole;
  if (ctx.role === RoleName.ICT_TECHNICIAN) {
    signerRole = SignerRole.ICT_TECHNICIAN;
  } else if (ctx.role === RoleName.DEPARTMENT_REPRESENTATIVE) {
    // A department rep's sign-off means "I confirm this maintenance was completed" —
    // enforce the record is actually marked COMPLETED before accepting their signature.
    if (record.status !== MaintenanceStatus.COMPLETED) {
      throw new AuthError('Cannot confirm maintenance that is not marked COMPLETED yet', 400);
    }
    signerRole = SignerRole.DEPARTMENT_REPRESENTATIVE;
  } else {
    throw new AuthError('Only the technician or department representative may sign this record', 403);
  }

  const signature = await prisma.signature.create({
    data: {
      maintenanceRecordId: id,
      signerRole,
      signerUserId: ctx.userId,
      signatureImagePath,
    },
  });
  await writeAuditLog(ctx, 'UPDATE', 'MaintenanceRecord', id, null, { signature: signature.id });
  return signature;
}

function computeLabourHours(start?: Date, finish?: Date): number | undefined {
  if (!start || !finish) return undefined;
  const hours = (finish.getTime() - start.getTime()) / (1000 * 60 * 60);
  return hours > 0 ? Math.round(hours * 100) / 100 : undefined;
}

function enforceDepartmentScope(ctx: RequestContext, assetDepartmentId: string | null) {
  if (ctx.role === RoleName.DEPARTMENT_REPRESENTATIVE && ctx.departmentId !== assetDepartmentId) {
    throw new AuthError('Forbidden — this maintenance record is outside your department', 403);
  }
}
