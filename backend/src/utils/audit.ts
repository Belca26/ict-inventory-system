import { Prisma, AuditAction } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface AuditContext {
  userId: string;
  ipAddress?: string;
}

export async function writeAuditLog(
  ctx: AuditContext,
  action: AuditAction,
  entityType: string,
  entityId: string,
  oldValue: unknown,
  newValue: unknown,
) {
  await prisma.auditLog.create({
    data: {
      userId: ctx.userId,
      action,
      entityType,
      entityId,
      oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : Prisma.JsonNull,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : Prisma.JsonNull,
      ipAddress: ctx.ipAddress,
    },
  });
}
