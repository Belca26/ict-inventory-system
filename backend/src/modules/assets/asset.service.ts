import { Prisma, RoleName, AssetStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AuthError } from '../auth/auth.service';
import { writeAuditLog } from '../../utils/audit';
import { notifyAssetRetired } from '../notifications/notification.service';

interface RequestContext {
  userId: string;
  role: RoleName;
  departmentId: string | null;
  ipAddress?: string;
}

const FULL_ASSET_INCLUDE = {
  assetType: true,
  manufacturer: true,
  building: true,
  room: true,
  department: true,
  computerSpec: true,
  networkDeviceSpec: true,
  printerSpec: true,
  schedules: true,
  maintenanceRecords: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      technician: { select: { id: true, firstName: true, lastName: true } },
      procedures: { include: { procedureType: true } },
      parts: true,
      attachments: true,
      signatures: true,
    },
  },
} satisfies Prisma.AssetInclude;

export async function createAsset(input: any, ctx: RequestContext) {
  const assetType = await prisma.assetType.findUnique({ where: { id: input.assetTypeId } });
  if (!assetType) throw new AuthError('Asset type not found', 404);

  // Enforce that the spec object provided actually matches the asset type's category.
  const categorySpecMap: Record<string, string | null> = {
    COMPUTER: 'computerSpec',
    NETWORK_DEVICE: 'networkDeviceSpec',
    PRINTER: 'printerSpec',
    UPS: null,
    PROJECTOR: null,
    SCANNER: null,
    OTHER: null,
  };
  const expectedSpecKey = categorySpecMap[assetType.category];
  const providedSpecKeys = ['computerSpec', 'networkDeviceSpec', 'printerSpec'].filter(
    (k) => input[k] !== undefined,
  );
  if (providedSpecKeys.length > 0 && providedSpecKeys[0] !== expectedSpecKey) {
    throw new AuthError(
      `Asset type "${assetType.name}" (${assetType.category}) does not accept "${providedSpecKeys[0]}"`,
      400,
    );
  }

  const asset = await prisma.asset.create({
    data: {
      assetTag: input.assetTag,
      serialNumber: input.serialNumber,
      assetTypeId: input.assetTypeId,
      manufacturerId: input.manufacturerId,
      model: input.model,
      purchaseDate: input.purchaseDate,
      warrantyExpiry: input.warrantyExpiry,
      vendor: input.vendor,
      cost: input.cost,
      status: input.status ?? AssetStatus.ACTIVE,
      campus: input.campus,
      buildingId: input.buildingId,
      roomId: input.roomId,
      departmentId: input.departmentId,
      createdById: ctx.userId,
      ...(input.computerSpec && { computerSpec: { create: input.computerSpec } }),
      ...(input.networkDeviceSpec && { networkDeviceSpec: { create: input.networkDeviceSpec } }),
      ...(input.printerSpec && { printerSpec: { create: input.printerSpec } }),
    },
    include: FULL_ASSET_INCLUDE,
  });

  await writeAuditLog(ctx, 'CREATE', 'Asset', asset.id, null, asset);
  return asset;
}

export async function getAssetById(id: string, ctx: RequestContext) {
  const asset = await prisma.asset.findUnique({
    where: { id, deletedAt: null },
    include: FULL_ASSET_INCLUDE,
  });
  if (!asset) throw new AuthError('Asset not found', 404);

  enforceDepartmentScope(ctx, asset.departmentId);
  return asset;
}

export async function listAssets(query: any, ctx: RequestContext) {
  const {
    search,
    status,
    assetTypeId,
    manufacturerId,
    departmentId,
    buildingId,
    minRamGb,
    maxRamGb,
    os,
    warrantyExpiringBefore,
    olderThanYears,
  } = query;

  // Convert query parameters to proper types
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.max(1, Math.min(100, Number(query.pageSize) || 25));

  // Allow sorting only by known fields
  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "assetTag",
    "serialNumber",
    "status",
    "purchaseDate",
    "warrantyExpiry",
  ] as const;

  const sortBy = allowedSortFields.includes(query.sortBy)
    ? query.sortBy
    : "createdAt";

  const sortDir: Prisma.SortOrder =
    query.sortDir === "asc" ? "asc" : "desc";

  const where: Prisma.AssetWhereInput = {
    deletedAt: null,
  };

  // Department Representatives only ever see their own department's assets
  if (ctx.role === RoleName.DEPARTMENT_REPRESENTATIVE) {
    where.departmentId = ctx.departmentId ?? "**none**";
  } else if (departmentId) {
    where.departmentId = departmentId;
  }

  if (status) where.status = status;
  if (assetTypeId) where.assetTypeId = assetTypeId;
  if (manufacturerId) where.manufacturerId = manufacturerId;
  if (buildingId) where.buildingId = buildingId;

  if (search) {
    where.OR = [
      { assetTag: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
    ];
  }

  if (warrantyExpiringBefore) {
    where.warrantyExpiry = {
      lte: new Date(warrantyExpiringBefore),
    };
  }

  if (olderThanYears) {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - Number(olderThanYears));

    where.purchaseDate = {
      lte: cutoff,
    };
  }

  if (minRamGb || maxRamGb || os) {
    where.computerSpec = {
      ...(minRamGb && {
        ramGb: {
          gte: Number(minRamGb),
        },
      }),
      ...(maxRamGb && {
        ramGb: {
          ...(minRamGb ? { gte: Number(minRamGb) } : {}),
          lte: Number(maxRamGb),
        },
      }),
      ...(os && {
        os: {
          contains: os,
          mode: "insensitive",
        },
      }),
    };
  }

  const [items, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        assetType: true,
        manufacturer: true,
        department: true,
        computerSpec: true,
        networkDeviceSpec: true,
        printerSpec: true,
      },
      orderBy: {
        [sortBy]: sortDir,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.asset.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function updateAsset(id: string, input: any, ctx: RequestContext) {
  const existing = await prisma.asset.findUnique({ where: { id, deletedAt: null } });
  if (!existing) throw new AuthError('Asset not found', 404);
  enforceDepartmentScope(ctx, existing.departmentId);

  const { computerSpec, networkDeviceSpec, printerSpec, ...baseFields } = input;

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      ...baseFields,
      ...(computerSpec && {
        computerSpec: { upsert: { create: computerSpec, update: computerSpec } },
      }),
      ...(networkDeviceSpec && {
        networkDeviceSpec: { upsert: { create: networkDeviceSpec, update: networkDeviceSpec } },
      }),
      ...(printerSpec && {
        printerSpec: { upsert: { create: printerSpec, update: printerSpec } },
      }),
    },
    include: FULL_ASSET_INCLUDE,
  });

  await writeAuditLog(ctx, 'UPDATE', 'Asset', asset.id, existing, asset);
  return asset;
}

export async function changeAssetStatus(id: string, status: AssetStatus, ctx: RequestContext) {
  const existing = await prisma.asset.findUnique({ where: { id, deletedAt: null } });
  if (!existing) throw new AuthError('Asset not found', 404);
  enforceDepartmentScope(ctx, existing.departmentId);

  const asset = await prisma.asset.update({ where: { id }, data: { status } });
  await writeAuditLog(ctx, 'UPDATE', 'Asset', id, { status: existing.status }, { status });

  if (status === AssetStatus.RETIRED && existing.status !== AssetStatus.RETIRED) {
    // Best-effort: a notification failure must never fail the status-change request.
    notifyAssetRetired(id).catch((err) => console.error('notifyAssetRetired failed:', err));
  }

  return asset;
}

export async function softDeleteAsset(id: string, ctx: RequestContext) {
  const existing = await prisma.asset.findUnique({ where: { id, deletedAt: null } });
  if (!existing) throw new AuthError('Asset not found', 404);

  await prisma.asset.update({ where: { id }, data: { deletedAt: new Date() } });
  await writeAuditLog(ctx, 'DELETE', 'Asset', id, existing, null);
}

function enforceDepartmentScope(ctx: RequestContext, resourceDepartmentId: string | null) {
  if (ctx.role === RoleName.DEPARTMENT_REPRESENTATIVE && ctx.departmentId !== resourceDepartmentId) {
    throw new AuthError('Forbidden — asset does not belong to your department', 403);
  }
}
