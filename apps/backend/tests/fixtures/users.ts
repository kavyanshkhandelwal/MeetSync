import { Role } from '@prisma/client';
import { OTHER_USER_ID, USER_ID } from './ids';

export function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    userId: USER_ID,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@company.com',
    passwordHash: 'hashed-secret',
    role: Role.EMPLOYEE,
    createdAt: new Date('2030-01-01T00:00:00.000Z'),
    updatedAt: new Date('2030-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function makeAdmin(overrides: Record<string, unknown> = {}) {
  return makeUser({
    userId: OTHER_USER_ID,
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'grace@company.com',
    role: Role.ADMIN,
    ...overrides,
  });
}
