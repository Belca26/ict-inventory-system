import { Request, Response, NextFunction } from 'express';
import * as maintenanceService from './maintenance.service';

function contextFrom(req: Request) {
  return {
    userId: req.user!.sub,
    role: req.user!.role,
    departmentId: req.user!.departmentId,
    ipAddress: req.ip,
  };
}

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await maintenanceService.createMaintenanceRecord(req.body, contextFrom(req));
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
}

export async function getHandler(   req: Request, res: Response, next: NextFunction) {
  try {
    const record = await maintenanceService.getMaintenanceRecordById(req.params.id, contextFrom(req));
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

export async function updateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await maintenanceService.updateMaintenanceRecord(req.params.id, req.body, contextFrom(req));
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

export async function addProceduresHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await maintenanceService.addProcedures(req.params.id, req.body.procedures, contextFrom(req));
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

export async function addPartsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await maintenanceService.addParts(req.params.id, req.body.parts, contextFrom(req));
    res.status(200).json(record);
  } catch (err) {
    next(err);
  }
}

export async function uploadAttachmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded (expected multipart field name "file")' });
    }

    const typeMap: Record<string, 'PHOTO' | 'PDF_REPORT' | 'INVOICE' | 'DOCUMENT'> = {
      'image/jpeg': 'PHOTO',
      'image/png': 'PHOTO',
      'image/webp': 'PHOTO',
      'application/pdf': 'PDF_REPORT',
    };

    const attachment = await maintenanceService.addAttachment(
      req.params.id,
      {
        type: (req.body.type as any) || typeMap[req.file.mimetype] || 'DOCUMENT',
        filePath: req.file.path,
        fileName: req.file.originalname,
        fileSizeBytes: req.file.size,
      },
      contextFrom(req),
    );
    res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
}

export async function signHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = await maintenanceService.signMaintenanceRecord(
      req.params.id,
      req.body.signatureImagePath,
      contextFrom(req),
    );
    res.status(201).json(signature);
  } catch (err) {
    next(err);
  }
}

export async function listHandler(
  req: Request,
  res: Response,
  next: NextFunction
) { 
  try {
    const records = await maintenanceService.listMaintenanceRecords(
      req.query,
      contextFrom(req)
    );

    res.status(200).json(records);
  } catch (err) {
    next(err);
  }
}