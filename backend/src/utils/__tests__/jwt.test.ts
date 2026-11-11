import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
} from '../jwt';
import { RoleName } from '@prisma/client';

describe('access tokens', () => {
  const payload = { sub: 'user_123', role: RoleName.ICT_TECHNICIAN, departmentId: 'dept_1' };

  it('round-trips a signed access token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.departmentId).toBe(payload.departmentId);
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken(payload);
    const tampered = token.slice(0, -2) + 'xx';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('rejects a garbage token', () => {
    expect(() => verifyAccessToken('not-a-real-token')).toThrow();
  });
});

describe('refresh tokens', () => {
  it('round-trips a signed refresh token and preserves the jti', () => {
    const { token, jti } = signRefreshToken('user_123');
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe('user_123');
    expect(decoded.jti).toBe(jti);
  });

  it('hashes the same token deterministically (needed for DB lookup)', () => {
    const { token } = signRefreshToken('user_123');
    expect(hashRefreshToken(token)).toEqual(hashRefreshToken(token));
  });

  it('produces different hashes for different tokens', () => {
    const a = signRefreshToken('user_123').token;
    const b = signRefreshToken('user_456').token;
    expect(hashRefreshToken(a)).not.toEqual(hashRefreshToken(b));
  });
});
