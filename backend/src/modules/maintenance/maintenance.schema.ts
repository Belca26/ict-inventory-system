import { z } from 'zod';

const maintenanceTypeEnum = z.enum(['ROUTINE', 'CORRECTIVE', 'PREVENTIVE', 'EMERGENCY']);
const maintenanceStatusEnum = z.enum(['PENDING', 'COMPLETED', 'CANCELLED']);

const procedureEntrySchema = z.object({
  procedureTypeId: z.string().cuid(),
  customLabel: z.string().optional(), // required only when the ProcedureType.isCustom === true — checked in service
});

const partEntrySchema = z.object({
  partName: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
  cost: z.coerce.number().nonnegative().optional(),
});

export const createMaintenanceRecordSchema = z.object({
  body: z.object({
    assetId: z.string().cuid(),
    departmentId: z.string().cuid().optional(),
    maintenanceType: maintenanceTypeEnum,
    status: maintenanceStatusEnum.optional().default('PENDING'),

    technicianNotes: z.string().optional(),
    recommendations: z.string().optional(),

    timeStarted: z.coerce.date().optional(),
    timeFinished: z.coerce.date().optional(),

    procedures: z.array(procedureEntrySchema).default([]),
    parts: z.array(partEntrySchema).default([]),
  }),
});

export const updateMaintenanceRecordSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    status: maintenanceStatusEnum.optional(),
    technicianNotes: z.string().optional(),
    recommendations: z.string().optional(),
    timeStarted: z.coerce.date().optional(),
    timeFinished: z.coerce.date().optional(),
    // Procedures/parts are append-only via dedicated endpoints below,
    // not overwritten wholesale on a general update — keeps history intact
    // if a technician revisits a record.
  }),
});

export const addProceduresSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({ procedures: z.array(procedureEntrySchema).min(1) }),
});

export const addPartsSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({ parts: z.array(partEntrySchema).min(1) }),
});

export const signMaintenanceRecordSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    // Base64 PNG/JPEG export of a signature-pad canvas, or a scanned image
    // already uploaded — the service just persists whatever path/data URI
    // the frontend hands it.
    signatureImagePath: z.string().min(1),
  }),
});

export const listMaintenanceQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(25),
    sortDir: z.enum(['asc', 'desc']).default('desc'),

    assetId: z.string().cuid().optional(),
    technicianId: z.string().cuid().optional(),
    departmentId: z.string().cuid().optional(),
    maintenanceType: maintenanceTypeEnum.optional(),
    status: maintenanceStatusEnum.optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  }),
});
