import { z } from 'zod';

export const searchAssetsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(25),

    // Free-text — matched against tag, serial, model, vendor
    q: z.string().optional(),

    // Identity
    assetTag: z.string().optional(),
    serialNumber: z.string().optional(),

    // Classification
    assetTypeId: z.string().cuid().optional(),
    deviceCategory: z
      .enum(['COMPUTER', 'NETWORK_DEVICE', 'PRINTER', 'UPS', 'PROJECTOR', 'SCANNER', 'OTHER'])
      .optional(),
    manufacturerId: z.string().cuid().optional(),
    brand: z.string().optional(), // free-text manufacturer name match, alternative to manufacturerId
    model: z.string().optional(),

    // Location / org
    departmentId: z.string().cuid().optional(),
    buildingId: z.string().cuid().optional(),
    campus: z.string().optional(),

    // Lifecycle
    status: z.enum(['ACTIVE', 'FAULTY', 'UNDER_MAINTENANCE', 'RETIRED', 'LOST', 'DISPOSED']).optional(),
    purchaseDateFrom: z.coerce.date().optional(),
    purchaseDateTo: z.coerce.date().optional(),
    warrantyExpiringBefore: z.coerce.date().optional(),
    olderThanYears: z.coerce.number().int().positive().optional(),

    // Computer specs
    cpu: z.string().optional(),
    ramGbMin: z.coerce.number().int().positive().optional(),
    ramGbMax: z.coerce.number().int().positive().optional(),
    storageGbMin: z.coerce.number().int().positive().optional(),
    storageType: z.string().optional(),
    os: z.string().optional(),

    // Network device specs
    ipAddress: z.string().optional(),
    macAddress: z.string().optional(),
    isManaged: z.coerce.boolean().optional(),
    firmwareVersion: z.string().optional(),

    // Printer specs
    printerType: z.string().optional(),
    tonerModel: z.string().optional(),

    // Maintenance history (matches assets that HAVE a record meeting these criteria)
    technicianId: z.string().cuid().optional(),
    maintenanceType: z.enum(['ROUTINE', 'CORRECTIVE', 'PREVENTIVE', 'EMERGENCY']).optional(),
    maintenanceStatus: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
    maintenanceDateFrom: z.coerce.date().optional(),
    maintenanceDateTo: z.coerce.date().optional(),
  }),
});
