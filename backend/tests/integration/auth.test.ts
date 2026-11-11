import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/prisma';
import { ensureTestAdmin, cleanupTestUser, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from '../fixtures/testUser';

// These tests require a real Postgres reachable via DATABASE_URL, with
// migrations already applied (`npx prisma migrate deploy`). Run via:
//   docker compose up -d postgres
//   DATABASE_URL=postgresql://ict_inventory:dev_password_change_me@localhost:5432/ict_inventory npm test
describe('Auth flow (integration)', () => {
  beforeAll(async () => {
    await ensureTestAdmin();
  });

  afterAll(async () => {
    await cleanupTestUser(TEST_ADMIN_EMAIL);
    await prisma.$disconnect();
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN_EMAIL, password: 'WrongPassword' });
    expect(res.status).toBe(401);
  });

  it('logs in with correct credentials and returns tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe(TEST_ADMIN_EMAIL);
  });

  it('rejects a protected route without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('accepts a protected route with a valid access token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.sub).toBeDefined();
  });

  it('rotates the refresh token — old one becomes unusable after refresh', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD });
    const oldRefreshToken = login.body.refreshToken;

    const refreshRes = await request(app).post('/api/auth/refresh').send({ refreshToken: oldRefreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.refreshToken).not.toEqual(oldRefreshToken);

    // Reusing the now-revoked old refresh token must fail.
    const reuseRes = await request(app).post('/api/auth/refresh').send({ refreshToken: oldRefreshToken });
    expect(reuseRes.status).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD });

    const logoutRes = await request(app).post('/api/auth/logout').send({ refreshToken: login.body.refreshToken });
    expect(logoutRes.status).toBe(204);

    const refreshAfterLogout = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
  });
});
