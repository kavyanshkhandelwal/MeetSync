import { describe, expect, it } from 'vitest';
import { Role } from '@prisma/client';
import {
  comparePasswords,
  generateAccessToken,
  hashPassword,
  verifyAccessToken,
} from '../../../src/utils/auth.utils';

describe('auth.utils', () => {
  const payload = {
    userId: '11111111-1111-1111-1111-111111111111',
    email: 'ada@company.com',
    role: Role.EMPLOYEE,
  };

  it('hashes a password and compares the original as valid', async () => {
    const hash = await hashPassword('Secret123');
    expect(hash).not.toBe('Secret123');
    expect(await comparePasswords('Secret123', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('Secret123');
    expect(await comparePasswords('wrong-pass', hash)).toBe(false);
  });

  it('signs and verifies an access token with the same claims', () => {
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(Role.EMPLOYEE);
  });

  it('rejects a tampered token', () => {
    const token = generateAccessToken(payload);
    expect(() => verifyAccessToken(`${token}x`)).toThrow();
  });
});
