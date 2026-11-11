import { prisma } from '../../src/config/prisma';
import { hashPassword } from '../../src/utils/password';
import { RoleName } from '@prisma/client';

export const TEST_ADMIN_EMAIL = 'test-admin@fixture.local';
export const TEST_ADMIN_PASSWORD = 'TestPassword123';

/**
 * Ensures a known SYSTEM_ADMIN test user exists, for tests that need to log
 * in. Idempotent (upsert) so it's safe to call in multiple test files'
 * beforeAll hooks without collisions.
 *
 * Requires a real Postgres reachable via DATABASE_URL and migrations already
 * applied — run `npx prisma migrate deploy` against your test DB first.
 */
export async function ensureTestAdmin() {
  const role = await prisma.role.upsert({
    where: { name: RoleName.SYSTEM_ADMIN },
    update: {},
    create: { name: RoleName.SYSTEM_ADMIN, description: 'Test fixture role' },
  });

  const passwordHash = await hashPassword(TEST_ADMIN_PASSWORD);

  return prisma.user.upsert({
    where: { email: TEST_ADMIN_EMAIL },
    update: { passwordHash, isActive: true, deletedAt: null },
    create: {
      email: TEST_ADMIN_EMAIL,
      passwordHash,
      firstName: 'Test',
      lastName: 'Admin',
      roleId: role.id,
    },
  });
}

export async function cleanupTestUser(email: string) {
  await prisma.refreshToken.deleteMany({ where: { user: { email } } });
  await prisma.user.deleteMany({ where: { email } });
}
