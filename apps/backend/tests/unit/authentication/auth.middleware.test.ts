import { describe, expect, it } from 'vitest';
import { Role } from '@prisma/client';
import { authenticate, authorizeRoles } from '../../../src/middlewares/auth.middleware';
import { generateAccessToken } from '../../../src/utils/auth.utils';
import { ForbiddenError, UnauthorizedError } from '../../../src/utils/errors';
import { mockNext, mockRequest, mockResponse } from '../../mocks/express';

describe('authenticate / authorizeRoles', () => {
  it('rejects a missing Authorization header', () => {
    const req = mockRequest({ headers: {} });
    const next = mockNext();
    authenticate(req, mockResponse(), next);
    expect(next.error).toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a non-Bearer scheme', () => {
    const req = mockRequest({ headers: { authorization: 'Basic abc' } as any });
    const next = mockNext();
    authenticate(req, mockResponse(), next);
    expect(next.error).toBeInstanceOf(UnauthorizedError);
  });

  it('attaches the JWT payload on a valid Bearer token', () => {
    const token = generateAccessToken({
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'ada@company.com',
      role: Role.EMPLOYEE,
    });
    const req = mockRequest({ headers: { authorization: `Bearer ${token}` } as any });
    const next = mockNext();
    authenticate(req, mockResponse(), next);
    expect(next.error).toBeUndefined();
    expect(req.user?.email).toBe('ada@company.com');
    expect(req.user?.role).toBe(Role.EMPLOYEE);
  });

  it('rejects an invalid token', () => {
    const req = mockRequest({ headers: { authorization: 'Bearer not-a-jwt' } as any });
    const next = mockNext();
    authenticate(req, mockResponse(), next);
    expect(next.error).toBeInstanceOf(UnauthorizedError);
  });

  it('authorizeRoles rejects when req.user is missing', () => {
    const next = mockNext();
    authorizeRoles(Role.ADMIN)(mockRequest(), mockResponse(), next);
    expect(next.error).toBeInstanceOf(UnauthorizedError);
  });

  it('authorizeRoles forbids a role that is not allowed', () => {
    const req = mockRequest({ user: { userId: '1', email: 'a@b.c', role: Role.EMPLOYEE } } as any);
    const next = mockNext();
    authorizeRoles(Role.ADMIN)(req, mockResponse(), next);
    expect(next.error).toBeInstanceOf(ForbiddenError);
  });

  it('authorizeRoles allows a listed role', () => {
    const req = mockRequest({ user: { userId: '1', email: 'a@b.c', role: Role.ADMIN } } as any);
    const next = mockNext();
    authorizeRoles(Role.ADMIN)(req, mockResponse(), next);
    expect(next.error).toBeUndefined();
  });
});
