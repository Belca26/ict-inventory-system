import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { hashPassword } from '../../utils/password';
import { AuthError } from '../auth/auth.service';
import { writeAuditLog, AuditContext } from '../../utils/audit';

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
} satisfies Prisma.UserSelect;

export async function createUser(input: any, ctx: AuditContext) {
  const role = await prisma.role.findUnique({ where: { name: input.roleName } });
  if (!role) throw new AuthError(`Role ${input.roleName} not found — seed data may be missing`, 500);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AuthError('A user with this email already exists', 409);

  const passwordHash = await hashPassword(input.temporaryPassword);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      roleId: role.id,
      departmentId: input.departmentId,
      passwordHash,
    },
    select: SAFE_USER_SELECT,
  });

  await writeAuditLog(ctx, 'CREATE', 'User', user.id, null, user);
  return user;
}

export async function listUsers(query: any) {
  const { page, pageSize, roleName, departmentId, isActive, search } = query;

  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (roleName) where.role = { name: roleName };
  if (departmentId) where.departmentId = departmentId;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function updateUser(id: string, input: any, ctx: AuditContext) {
  const existing = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!existing) throw new AuthError('User not found', 404);

  let roleId: string | undefined;
  if (input.roleName) {
    const role = await prisma.role.findUnique({ where: { name: input.roleName } });
    if (!role) throw new AuthError(`Role ${input.roleName} not found`, 400);
    roleId = role.id;
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      departmentId: input.departmentId,
      isActive: input.isActive,
      ...(roleId && { roleId }),
    },
    select: SAFE_USER_SELECT,
  });

  // A role or active-status change should invalidate existing sessions so
  // the new permissions (or lockout) take effect immediately, not after
  // the current access token happens to expire.
  if (input.roleName || input.isActive === false) {
    await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  await writeAuditLog(ctx, 'UPDATE', 'User', id, existing, user);
  return user;
}

export async function deactivateUser(id: string, ctx: AuditContext) {
  const existing = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!existing) throw new AuthError('User not found', 404);

  await prisma.user.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
  await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  await writeAuditLog(ctx, 'DELETE', 'User', id, existing, null);
}

export async function adminResetPassword(id: string, temporaryPassword: string, ctx: AuditContext) {
  const existing = await prisma.user.findUnique({ where: { id, deletedAt: null } });
  if (!existing) throw new AuthError('User not found', 404);

  const passwordHash = await hashPassword(temporaryPassword);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  // Force re-login everywhere with the new credential.
  await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });

  await writeAuditLog(ctx, 'UPDATE', 'User', id, null, { action: 'password reset by admin' });
}
