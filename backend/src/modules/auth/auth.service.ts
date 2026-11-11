import { prisma } from '../../config/prisma';
import { comparePassword, hashPassword } from '../../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
} from '../../utils/jwt';
import { env } from '../../config/env';

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
  }
}

function refreshExpiryDate(): Date {
  // JWT_REFRESH_EXPIRES_IN can be a number or a duration string (e.g. "7d")
  const expiresIn = String(env.JWT_REFRESH_EXPIRES_IN);

  const match = expiresIn.match(/^(\d+)([smhd])$/);

  if (!match) {
    // Default to 7 days if the format is invalid
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const value  = parseInt(match[1], 10);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';

  const msPerUnit = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * msPerUnit[unit]);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || user.deletedAt || !user.isActive) {
    throw new AuthError('Invalid email or password');
  }

  const passwordValid = await comparePassword(password, user.passwordHash);
  if (!passwordValid) {
    throw new AuthError('Invalid email or password');
  }

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role.name,
    departmentId: user.departmentId,
  });

  const { token: refreshToken } = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt: refreshExpiryDate(),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      departmentId: user.departmentId,
    },
  };
}

export async function refresh(oldRefreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new AuthError('Invalid or expired refresh token');
  }

  const tokenHash = hashRefreshToken(oldRefreshToken);
  const storedToken = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    throw new AuthError('Refresh token has been revoked or expired');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
  if (!user || user.deletedAt || !user.isActive) {
    throw new AuthError('User no longer active');
  }

  // Rotate: revoke the old refresh token and issue a new pair.
  // This limits the blast radius if a refresh token is ever stolen.
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role.name,
    departmentId: user.departmentId,
  });
  const { token: newRefreshToken } = signRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(newRefreshToken),
      userId: user.id,
      expiresAt: refreshExpiryDate(),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshTokenRaw: string) {
  const tokenHash = hashRefreshToken(refreshTokenRaw);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AuthError('User not found', 404);

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw new AuthError('Current password is incorrect');

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

  // Revoke all existing refresh tokens on password change — forces
  // re-login everywhere, standard practice after a credential change.
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
