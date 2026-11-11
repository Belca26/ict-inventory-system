import { z } from 'zod';

const assetStatusEnum = z.enum([
  'ACTIVE',
  'FAULTY',
  'UNDER_MAINTENANCE',
  'RETIRED',
  'LOST',
  'DISPOSED',
]);

const computerSpecSchema = z.object({
  cpu: z.string().optional(),
  ramGb: z.coerce.number().int().positive().optional(),
  storageGb: z.coerce.number().int().positive().optional(),
  storageType: z.string().optional(), // SSD / HDD / NVMe
  gpu: z.string().optional(),
  os: z.string().optional(),
});

const networkDeviceSpecSchema = z.object({
  numberOfPorts: z.coerce.number().int().positive().optional(),
  isManaged: z.boolean().optional(),
  firmwareVersion: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  macAddress: z
    .string()
    .regex(
      /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/,
      'MAC address must look like AA:BB:CC:DD:EE:FF'
    )
    .optional(),
});

const printerSpecSchema = z.object({
  printerType: z.string().optional(),
  isNetworkPrinter: z.boolean().optional(),
  isUsbPrinter: z.boolean().optional(),
  tonerModel: z.string().optional(),
});

/**
 * Base schema (used for create and update)
 */
const assetBodyBaseSchema = z.object({
  assetTag: z.string().min(3, 'Asset tag (UOE Tag Number) is required'),
  serialNumber: z.string().optional(),
  assetTypeId: z.string().cuid(),
  manufacturerId: z.string().cuid().optional(),
  model: z.string().optional(),

  purchaseDate: z.coerce.date().optional(),
  warrantyExpiry: z.coerce.date().optional(),
  vendor: z.string().optional(),
  cost: z.coerce.number().nonnegative().optional(),
  status: assetStatusEnum.optional().default('ACTIVE'),

  campus: z.string().optional(),
  buildingId: z.string().cuid().optional(),
  roomId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),

  // Only ONE of these should be provided
  computerSpec: computerSpecSchema.optional(),
  networkDeviceSpec: networkDeviceSpecSchema.optional(),
  printerSpec: printerSpecSchema.optional(),
});

/**
 * Create schema (adds validation)
 */
const assetBodySchema = assetBodyBaseSchema.refine(
  (data) =>
    [data.computerSpec, data.networkDeviceSpec, data.printerSpec].filter(Boolean)
      .length <= 1,
  {
    message: 'Provide specs for only one device category at a time',
  }
);

export const createAssetSchema = z.object({
  body: assetBodySchema,
});

export const updateAssetSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: assetBodyBaseSchema.deepPartial(),
});

export const changeAssetStatusSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    status: assetStatusEnum,
  }),
});

export const listAssetsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(25),

    sortBy: z
      .enum([
        'createdAt',
        'assetTag',
        'purchaseDate',
        'cost',
        'status',
      ])
      .default('createdAt'),

    sortDir: z.enum(['asc', 'desc']).default('desc'),

    // Filters
    search: z.string().optional(),
    status: assetStatusEnum.optional(),
    assetTypeId: z.string().cuid().optional(),
    manufacturerId: z.string().cuid().optional(),
    departmentId: z.string().cuid().optional(),
    buildingId: z.string().cuid().optional(),
    minRamGb: z.coerce.number().int().positive().optional(),
    maxRamGb: z.coerce.number().int().positive().optional(),
    os: z.string().optional(),
    warrantyExpiringBefore: z.coerce.date().optional(),
    olderThanYears: z.coerce.number().int().positive().optional(),
  }),
});