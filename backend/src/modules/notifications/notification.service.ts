import { NotificationType, RoleName } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { sendEmail } from '../../utils/email';
import { AuthError } from '../auth/auth.service';

interface CreateNotificationInput {
  type: NotificationType;
  message: string;
  userId?: string;
  departmentId?: string;
  assetId?: string;
}

async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({ data: input });

  // Resolve who to email: a specific user, or everyone in a department, or
  // (for department-less alerts) every System Admin.
  const recipients = await resolveEmailRecipients(input.userId, input.departmentId);
  await Promise.all(recipients.map((email) => sendEmail(email, notificationSubject(input.type), input.message)));

  return notification;
}

async function resolveEmailRecipients(userId?: string, departmentId?: string): Promise<string[]> {
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    return user ? [user.email] : [];
  }
  if (departmentId) {
    const users = await prisma.user.findMany({
      where: { departmentId, isActive: true, deletedAt: null },
      select: { email: true },
    });
    return users.map((u) => u.email);
  }
  const admins = await prisma.user.findMany({
    where: { role: { name: RoleName.SYSTEM_ADMIN }, isActive: true, deletedAt: null },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

function notificationSubject(type: NotificationType): string {
  return {
    MAINTENANCE_DUE: 'Maintenance Due — ICT Inventory System',
    MAINTENANCE_OVERDUE: 'Maintenance Overdue — ICT Inventory System',
    WARRANTY_EXPIRING: 'Warranty Expiring Soon — ICT Inventory System',
    ASSET_RETIRED: 'Asset Retired — ICT Inventory System',
  }[type];
}

// ---------------------------------------------------------------------------
// Trigger functions — called either by the daily scan job (below) or
// directly by other services on a relevant state change (e.g. asset.service
// calling notifyAssetRetired when status flips to RETIRED).
// ---------------------------------------------------------------------------

export async function notifyMaintenanceDue(scheduleId: string) {
  const schedule = await prisma.maintenanceSchedule.findUnique({
    where: { id: scheduleId },
    include: { asset: { include: { department: true } } },
  });
  if (!schedule) return;

  const overdue = schedule.nextDueDate < new Date();
  await createNotification({
    type: overdue ? NotificationType.MAINTENANCE_OVERDUE : NotificationType.MAINTENANCE_DUE,
    message: `Asset ${schedule.asset.assetTag} (${schedule.asset.model ?? 'unspecified model'}) is ${
      overdue ? 'overdue for' : 'due for'
    } maintenance as of ${schedule.nextDueDate.toDateString()}.`,
    departmentId: schedule.asset.departmentId ?? undefined,
    assetId: schedule.asset.id,
  });
}

export async function notifyWarrantyExpiring(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset || !asset.warrantyExpiry) return;

  await createNotification({
    type: NotificationType.WARRANTY_EXPIRING,
    message: `Asset ${asset.assetTag} (${asset.model ?? 'unspecified model'}) has a warranty expiring on ${asset.warrantyExpiry.toDateString()}.`,
    departmentId: asset.departmentId ?? undefined,
    assetId: asset.id,
  });
}

export async function notifyAssetRetired(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return;

  await createNotification({
    type: NotificationType.ASSET_RETIRED,
    message: `Asset ${asset.assetTag} (${asset.model ?? 'unspecified model'}) has been marked RETIRED.`,
    departmentId: asset.departmentId ?? undefined,
    assetId: asset.id,
  });
}

// ---------------------------------------------------------------------------
// Daily scan — call this once a day from a scheduled job (see cron.ts).
// Dedupes against notifications already sent today so it's safe to run
// repeatedly without spamming the same alert every run.
// ---------------------------------------------------------------------------

export async function runDailyNotificationScan() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const alreadyNotifiedToday = async (assetId: string, type: NotificationType) =>
    (await prisma.notification.count({ where: { assetId, type, createdAt: { gte: todayStart } } })) > 0;

  // Maintenance due within 7 days, or overdue
  const dueSchedules = await prisma.maintenanceSchedule.findMany({
    where: { isActive: true, nextDueDate: { lte: in7Days } },
  });
  for (const schedule of dueSchedules) {
    const type = schedule.nextDueDate < new Date() ? NotificationType.MAINTENANCE_OVERDUE : NotificationType.MAINTENANCE_DUE;
    if (!(await alreadyNotifiedToday(schedule.assetId, type))) {
      await notifyMaintenanceDue(schedule.id);
    }
  }

  // Warranty expiring within 30 days
  const expiringAssets = await prisma.asset.findMany({
    where: { deletedAt: null, warrantyExpiry: { lte: in30Days, gte: new Date() } },
  });
  for (const asset of expiringAssets) {
    if (!(await alreadyNotifiedToday(asset.id, NotificationType.WARRANTY_EXPIRING))) {
      await notifyWarrantyExpiring(asset.id);
    }
  }

  return { checkedSchedules: dueSchedules.length, checkedWarranties: expiringAssets.length };
}

// ---------------------------------------------------------------------------
// In-app notification inbox
// ---------------------------------------------------------------------------

export async function listMyNotifications(userId: string, departmentId: string | null, unreadOnly: boolean) {
  return prisma.notification.findMany({
    where: {
      OR: [{ userId }, ...(departmentId ? [{ departmentId }] : [])],
      ...(unreadOnly && { isRead: false }),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function markNotificationRead(id: string, userId: string, departmentId: string | null) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  const belongsToUser = notification?.userId === userId;
  const belongsToDept = departmentId && notification?.departmentId === departmentId;
  if (!notification || (!belongsToUser && !belongsToDept)) {
    throw new AuthError('Notification not found', 404);
  }
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}
