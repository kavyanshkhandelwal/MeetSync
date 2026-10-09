import { afterEach, describe, expect, it } from 'vitest';
import { Role } from '@prisma/client';
import { AuthService } from '../../../src/services/auth.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../../src/utils/errors';
import { hashPassword } from '../../../src/utils/auth.utils';
import { makeUser } from '../../fixtures/users';
import { USER_ID } from '../../fixtures/ids';

describe('AuthService (integration, repository stubbed)', () => {
  const originalFindByEmail = UserRepository.prototype.findByEmail;
  const originalFindById = UserRepository.prototype.findById;
  const originalCreate = UserRepository.prototype.create;
  const originalUpdate = UserRepository.prototype.update;

  afterEach(() => {
    UserRepository.prototype.findByEmail = originalFindByEmail;
    UserRepository.prototype.findById = originalFindById;
    UserRepository.prototype.create = originalCreate;
    UserRepository.prototype.update = originalUpdate;
  });

  it('rejects register when the email already exists', async () => {
    UserRepository.prototype.findByEmail = async () => makeUser() as any;
    await expect(
      new AuthService().register({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@company.com',
        password: 'Secret123',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('registers a new user, hashes the password, and omits passwordHash', async () => {
    UserRepository.prototype.findByEmail = async () => null;
    UserRepository.prototype.create = async (data: any) =>
      makeUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      }) as any;

    const result = await new AuthService().register({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@company.com',
      password: 'Secret123',
    });

    expect(result.accessToken).toBeTruthy();
    expect(result.user.email).toBe('ada@company.com');
    expect(result.user.role).toBe(Role.EMPLOYEE);
    expect((result.user as any).passwordHash).toBeUndefined();
  });

  it('ignores a client-supplied ADMIN role and always creates EMPLOYEE', async () => {
    UserRepository.prototype.findByEmail = async () => null;
    UserRepository.prototype.create = async (data: any) =>
      makeUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      }) as any;

    const result = await new AuthService().register({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@company.com',
      password: 'Secret123',
      role: Role.ADMIN,
    } as any);

    expect(result.user.role).toBe(Role.EMPLOYEE);
  });

  it('ignores a client-supplied EMPLOYEE role and still writes EMPLOYEE from the service', async () => {
    let persistedRole: unknown;
    UserRepository.prototype.findByEmail = async () => null;
    UserRepository.prototype.create = async (data: any) => {
      persistedRole = data.role;
      return makeUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      }) as any;
    };

    const result = await new AuthService().register({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@company.com',
      password: 'Secret123',
      role: Role.EMPLOYEE,
    } as any);

    expect(persistedRole).toBe(Role.EMPLOYEE);
    expect(result.user.role).toBe(Role.EMPLOYEE);
  });

  it('ignores malicious or invalid role values', async () => {
    let persistedRole: unknown;
    UserRepository.prototype.findByEmail = async () => null;
    UserRepository.prototype.create = async (data: any) => {
      persistedRole = data.role;
      return makeUser({ role: data.role }) as any;
    };

    const result = await new AuthService().register({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@company.com',
      password: 'Secret123',
      role: 'SUPERADMIN',
    } as any);

    expect(persistedRole).toBe(Role.EMPLOYEE);
    expect(result.user.role).toBe(Role.EMPLOYEE);
  });

  it('updateProfile updates names and strips passwordHash', async () => {
    UserRepository.prototype.findById = async () => makeUser() as any;
    UserRepository.prototype.update = async (_id: string, data: any) =>
      makeUser({ firstName: data.firstName, lastName: data.lastName }) as any;

    const result = await new AuthService().updateProfile(USER_ID, {
      firstName: 'Ada',
      lastName: 'Byron',
    });

    expect(result.firstName).toBe('Ada');
    expect(result.lastName).toBe('Byron');
    expect((result as any).passwordHash).toBeUndefined();
  });

  it('login throws NotFoundError when the account does not exist', async () => {
    UserRepository.prototype.findByEmail = async () => null;
    await expect(
      new AuthService().login({ email: 'missing@company.com', password: 'Secret123' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('login throws UnauthorizedError for a wrong password', async () => {
    const passwordHash = await hashPassword('Secret123');
    UserRepository.prototype.findByEmail = async () => makeUser({ passwordHash }) as any;
    await expect(
      new AuthService().login({ email: 'ada@company.com', password: 'Wrong999' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('login returns a token and strips passwordHash', async () => {
    const passwordHash = await hashPassword('Secret123');
    UserRepository.prototype.findByEmail = async () => makeUser({ passwordHash }) as any;
    const result = await new AuthService().login({
      email: 'ada@company.com',
      password: 'Secret123',
    });
    expect(result.accessToken).toBeTruthy();
    expect((result.user as any).passwordHash).toBeUndefined();
  });

  it('getCurrentUser throws when the user is missing', async () => {
    UserRepository.prototype.findById = async () => null;
    await expect(new AuthService().getCurrentUser(USER_ID)).rejects.toBeInstanceOf(NotFoundError);
  });
});
