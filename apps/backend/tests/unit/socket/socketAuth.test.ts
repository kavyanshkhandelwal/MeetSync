import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { authenticateSocket } from '../../../src/middlewares/socketAuth';
import { generateAccessToken } from '../../../src/utils/auth.utils';
import { env } from '../../../src/config';
import { USER_ID } from '../../fixtures/ids';

function handshake(auth?: unknown, authorization?: string) {
  return {
    handshake: {
      auth: auth ?? {},
      headers: authorization ? { authorization } : {},
    },
    data: {} as { user?: unknown },
  };
}

describe('authenticateSocket', () => {
  const payload = {
    userId: USER_ID,
    email: 'socket@company.com',
    role: Role.EMPLOYEE,
  };

  it('accepts a valid JWT from handshake.auth.token', async () => {
    const socket = handshake({ token: generateAccessToken(payload) });
    await new Promise<void>((resolve, reject) => {
      authenticateSocket(socket as any, (err) => (err ? reject(err) : resolve()));
    });
    expect((socket.data.user as any).userId).toBe(USER_ID);
  });

  it('accepts a Bearer token from the handshake header', async () => {
    const socket = handshake({}, `Bearer ${generateAccessToken(payload)}`);
    await new Promise<void>((resolve, reject) => {
      authenticateSocket(socket as any, (err) => (err ? reject(err) : resolve()));
    });
    expect((socket.data.user as any).email).toBe('socket@company.com');
  });

  it('rejects a missing token', async () => {
    const socket = handshake();
    const err = await new Promise<Error | undefined>((resolve) => {
      authenticateSocket(socket as any, (error) => resolve(error));
    });
    expect(err?.message).toBe('Unauthorized');
    expect(socket.data.user).toBeUndefined();
  });

  it('rejects an invalid token', async () => {
    const socket = handshake({ token: 'not-a-jwt' });
    const err = await new Promise<Error | undefined>((resolve) => {
      authenticateSocket(socket as any, (error) => resolve(error));
    });
    expect(err?.message).toBe('Unauthorized');
  });

  it('rejects a malformed token', async () => {
    const socket = handshake({ token: 'abc.def' });
    const err = await new Promise<Error | undefined>((resolve) => {
      authenticateSocket(socket as any, (error) => resolve(error));
    });
    expect(err?.message).toBe('Unauthorized');
  });

  it('rejects an expired token', async () => {
    const token = jwt.sign({ ...payload, exp: Math.floor(Date.now() / 1000) - 30 }, env.JWT_SECRET);
    const socket = handshake({ token });
    const err = await new Promise<Error | undefined>((resolve) => {
      authenticateSocket(socket as any, (error) => resolve(error));
    });
    expect(err?.message).toBe('Unauthorized');
  });
});
