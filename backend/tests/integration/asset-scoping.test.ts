import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { hashPassword } from '../../src/utils/password';
import { RoleName, DeviceCategory } from '@prisma/client';

// Requires a real Postgres with migrations applied — see auth.test.ts header comment.
describe('Asset department-scoping (integration)', () => {
  let deptRepToken: string;
  let deptADeptId: string;
  let assetInDeptB: string;

  beforeAll(async () => {
    const role = await prisma.role.upsert({
      where: { name: RoleName.DEPARTMENT_REPRESENTATIVE },
      update: {},
      create: { name: RoleName.DEPARTMENT_REPRESENTATIVE },
    });

    const deptA = await prisma.department.upsert({
      where: { name: 'Fixture Dept A' },
      update: {},
      create: { name: 'Fixture Dept A' },
    });
    const deptB = await prisma.department.upsert({
      where: { name: 'Fixture Dept B' },
      update: {},
      create: { name: 'Fixture Dept B' },
    });
    deptADeptId = deptA.id;

    const passwordHash = await hashPassword('TestPassword123');
    await prisma.user.upsert({
      where: { email: 'dept-rep@fixture.local' },
      update: { departmentId: deptA.id, isActive: true, deletedAt: null },
      create: {
        email: 'dept-rep@fixture.local',
        passwordHash,
        firstName: 'Dept',
        lastName: 'Rep',
        roleId: role.id,
        departmentId: deptA.id,
      },
    });

    const assetType = await prisma.assetType.upsert({
      where: { name: 'Fixture Desktop' },
      update: {},
      create: { name: 'Fixture Desktop', category: DeviceCategory.COMPUTER },
    });

    const asset = await prisma.asset.upsert({
      where: { assetTag: 'FIXTURE-DEPT-B-001' },
      update: { departmentId: deptB.id },
      create: { assetTag: 'FIXTURE-DEPT-B-001', assetTypeId: assetType.id, departmentId: deptB.id },
    });
    assetInDeptB = asset.id;

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dept-rep@fixture.local', password: 'TestPassword123' });
    deptRepToken = login.body.accessToken;
  });

  afterAll(async () => {
    await prisma.asset.deleteMany({ where: { assetTag: 'FIXTURE-DEPT-B-001' } });
    await prisma.refreshToken.deleteMany({ where: { user: { email: 'dept-rep@fixture.local' } } });
    await prisma.user.deleteMany({ where: { email: 'dept-rep@fixture.local' } });
    await prisma.department.deleteMany({ where: { name: { in: ['Fixture Dept A', 'Fixture Dept B'] } } });
    await prisma.assetType.deleteMany({ where: { name: 'Fixture Desktop' } });
    await prisma.$disconnect();
  });

  it('blocks a Department Representative from viewing an asset outside their department', async () => {
    const res = await request(app)
      .get(`/api/assets/${assetInDeptB}`)
      .set('Authorization', `Bearer ${deptRepToken}`);
    expect(res.status).toBe(403);
  });

  it("forces the department filter to the rep's own department even if a different departmentId is requested", async () => {
    const res = await request(app)
      .get('/api/assets')
      .query({ departmentId: 'some-other-department-id' })
      .set('Authorization', `Bearer ${deptRepToken}`);

    expect(res.status).toBe(200);
    for (const item of res.body.items) {
      expect(item.departmentId).toBe(deptADeptId);
    }
  });
});
