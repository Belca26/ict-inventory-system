import { hashPassword, comparePassword } from '../password';

describe('password utils', () => {
  it('hashes a password to something other than the plaintext', async () => {
    const hash = await hashPassword('SuperSecret123');
    expect(hash).not.toEqual('SuperSecret123');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('SuperSecret123');
    await expect(comparePassword('SuperSecret123', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password against the hash', async () => {
    const hash = await hashPassword('SuperSecret123');
    await expect(comparePassword('WrongPassword', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time (random salt)', async () => {
    const hashA = await hashPassword('SamePassword1');
    const hashB = await hashPassword('SamePassword1');
    expect(hashA).not.toEqual(hashB);
  });
});
