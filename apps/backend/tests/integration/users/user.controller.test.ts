import { afterEach, describe, expect, it } from 'vitest';
import { Role } from '@prisma/client';
import { UserController } from '../../../src/controllers/user.controller';
import { UserRepository } from '../../../src/repositories/user.repository';
import { makeAdmin, makeUser } from '../../fixtures/users';
import { USER_ID } from '../../fixtures/ids';
import { mockNext, mockRequest, mockResponse } from '../../mocks/express';

describe('UserController (integration, repository stubbed)', () => {
  const originalFindAll = UserRepository.prototype.findAll;
  const originalFindById = UserRepository.prototype.findById;
  const originalFindByEmail = UserRepository.prototype.findByEmail;
  const originalCreate = UserRepository.prototype.create;
  const originalDelete = UserRepository.prototype.delete;

  afterEach(() => {
    UserRepository.prototype.findAll = originalFindAll;
    UserRepository.prototype.findById = originalFindById;
    UserRepository.prototype.findByEmail = originalFindByEmail;
    UserRepository.prototype.create = originalCreate;
    UserRepository.prototype.delete = originalDelete;
  });

  it('getAllUsers strips passwordHash and applies search + role filters', async () => {
    UserRepository.prototype.findAll = async () =>
      [makeUser(), makeAdmin(), makeUser({ firstName: 'Alan', email: 'alan@company.com' })] as any;

    const res = mockResponse();
    await new UserController().getAllUsers(
      mockRequest({ query: { search: 'ada', role: Role.EMPLOYEE } } as any),
      res,
      mockNext(),
    );

    const body = res.body as { data: Array<{ email: string; passwordHash?: string }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].email).toBe('ada@company.com');
    expect(body.data[0].passwordHash).toBeUndefined();
  });

  it('getUserById forwards an error when the user is missing', async () => {
    UserRepository.prototype.findById = async () => null;
    const next = mockNext();
    await new UserController().getUserById(
      mockRequest({ params: { id: USER_ID } } as any),
      mockResponse(),
      next,
    );
    expect(next.error).toBeInstanceOf(Error);
    expect((next.error as Error).message).toBe('User not found');
  });

  it('createUser rejects a duplicate email', async () => {
    UserRepository.prototype.findByEmail = async () => makeUser() as any;
    const next = mockNext();
    await new UserController().createUser(
      mockRequest({
        body: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@company.com',
          password: 'Secret123',
        },
      } as any),
      mockResponse(),
      next,
    );
    expect((next.error as Error).message).toBe('User with this email already exists');
  });

  it('deleteUser refuses to delete the currently logged-in user', async () => {
    const next = mockNext();
    await new UserController().deleteUser(
      mockRequest({
        params: { id: USER_ID },
        user: { userId: USER_ID, email: 'ada@company.com', role: Role.ADMIN },
      } as any),
      mockResponse(),
      next,
    );
    expect((next.error as Error).message).toBe('Cannot delete your own account');
  });
});
