import { Prisma, RoleName } from '@prisma/client';
import { prisma } from '../../config/prisma';

interface RequestContext {
  role: RoleName;
  departmentId: string | null;
}

export async function searchAssets(query: any, ctx: RequestContext) {
  const {
    page,
    pageSize,
    q,
    assetTag,
    serialNumber,
    assetTypeId,
    deviceCategory,
    manufacturerId,
    brand,
    model,
    departmentId,
    buildingId,
    campus,
    status,
    purchaseDateFrom,
    purchaseDateTo,
    warrantyExpiringBefore,
    olderThanYears,
    cpu,
    ramGbMin,
    ramGbMax,
    storageGbMin,
    storageType,
    os,
    ipAddress,
    macAddress,
    isManaged,
    firmwareVersion,
    printerType,
    tonerModel,
    technicianId,
    maintenanceType,
    maintenanceStatus,
    maintenanceDateFrom,
    maintenanceDateTo,
  } = query;

  const where: Prisma.AssetWhereInput = { deletedAt: null };

  // Department Representatives are always confined to their own department,
  // regardless of what departmentId they might pass in.
  if (ctx.role === RoleName.DEPARTMENT_REPRESENTATIVE) {
    where.departmentId = ctx.departmentId ?? '__none__';
  } else if (departmentId) {
    where.departmentId = departmentId;
  }

  if (q) {
    where.OR = [
      { assetTag: { contains: q, mode: 'insensitive' } },
      { serialNumber: { contains: q, mode: 'insensitive' } },
      { model: { contains: q, mode: 'insensitive' } },
      { vendor: { contains: q, mode: 'insensitive' } },
      { manufacturer: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (assetTag) where.assetTag = { contains: assetTag, mode: 'insensitive' };
  if (serialNumber) where.serialNumber = { contains: serialNumber, mode: 'insensitive' };
  if (assetTypeId) where.assetTypeId = assetTypeId;
  if (deviceCategory) where.assetType = { category: deviceCategory };
  if (manufacturerId) where.manufacturerId = manufacturerId;
  if (brand) where.manufacturer = { name: { contains: brand, mode: 'insensitive' } };
  if (model) where.model = { contains: model, mode: 'insensitive' };
  if (buildingId) where.buildingId = buildingId;
  if (campus) where.campus = { contains: campus, mode: 'insensitive' };
  if (status) where.status = status;

  if (purchaseDateFrom || purchaseDateTo) {
    where.purchaseDate = {
      ...(purchaseDateFrom && { gte: purchaseDateFrom }),
      ...(purchaseDateTo && { lte: purchaseDateTo }),
    };
  }
  if (warrantyExpiringBefore) where.warrantyExpiry = { lte: warrantyExpiringBefore };
  if (olderThanYears) {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - olderThanYears);
    where.purchaseDate = { ...(where.purchaseDate as object), lte: cutoff };
  }

  // Computer specs
  if (cpu || ramGbMin || ramGbMax || storageGbMin || storageType || os) {
    where.computerSpec = {
      ...(cpu && { cpu: { contains: cpu, mode: 'insensitive' } }),
      ...(ramGbMin && { ramGb: { gte: ramGbMin } }),
      ...(ramGbMax && { ramGb: { ...(ramGbMin ? { gte: ramGbMin } : {}), lte: ramGbMax } }),
      ...(storageGbMin && { storageGb: { gte: storageGbMin } }),
      ...(storageType && { storageType: { contains: storageType, mode: 'insensitive' } }),
      ...(os && { os: { contains: os, mode: 'insensitive' } }),
    };
  }

  // Network device specs
  if (ipAddress || macAddress || isManaged !== undefined || firmwareVersion) {
    where.networkDeviceSpec = {
      ...(ipAddress && { ipAddress: { contains: ipAddress, mode: 'insensitive' } }),
      ...(macAddress && { macAddress: { equals: macAddress, mode: 'insensitive' } }),
      ...(isManaged !== undefined && { isManaged }),
      ...(firmwareVersion && { firmwareVersion: { contains: firmwareVersion, mode: 'insensitive' } }),
    };
  }

  // Printer specs
  if (printerType || tonerModel) {
    where.printerSpec = {
      ...(printerType && { printerType: { contains: printerType, mode: 'insensitive' } }),
      ...(tonerModel && { tonerModel: { contains: tonerModel, mode: 'insensitive' } }),
    };
  }

  // Maintenance-history filters: match assets that have AT LEAST ONE record
  // meeting all of these criteria together (not independently across different records).
  if (technicianId || maintenanceType || maintenanceStatus || maintenanceDateFrom || maintenanceDateTo) {
    where.maintenanceRecords = {
      some: {
        ...(technicianId && { technicianId }),
        ...(maintenanceType && { maintenanceType }),
        ...(maintenanceStatus && { status: maintenanceStatus }),
        ...((maintenanceDateFrom || maintenanceDateTo) && {
          createdAt: {
            ...(maintenanceDateFrom && { gte: maintenanceDateFrom }),
            ...(maintenanceDateTo && { lte: maintenanceDateTo }),
          },
        }),
      },
    };
  }

  const [items, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        assetType: true,
        manufacturer: true,
        department: true,
        building: true,
        room: true,
        computerSpec: true,
        networkDeviceSpec: true,
        printerSpec: true,
        maintenanceRecords: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: { technician: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.asset.count({ where }),
  ]);

  return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}
