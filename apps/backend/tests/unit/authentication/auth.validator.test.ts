import { describe, expect, it } from 'vitest';
import { registerValidator } from '../../../src/validators/auth.validator';
import { BadRequestError } from '../../../src/utils/errors';
import { mockRequest, mockResponse } from '../../mocks/express';

const validBody = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@company.com',
  password: 'Secret123',
};

async function runRegisterValidator(body: Record<string, unknown>): Promise<void> {
  const req = mockRequest({ body });
  const res = mockResponse();
  for (const middleware of registerValidator) {
    await new Promise<void>((resolve, reject) => {
      try {
        const result = middleware(req, res, (err?: unknown) => {
          if (err) reject(err);
          else resolve();
        });
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          (result as Promise<unknown>).then(() => resolve()).catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}

describe('registerValidator', () => {
  it('accepts a normal registration body without role', async () => {
    await expect(runRegisterValidator(validBody)).resolves.toBeUndefined();
  });

  it('rejects role=ADMIN', async () => {
    await expect(runRegisterValidator({ ...validBody, role: 'ADMIN' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('rejects role=EMPLOYEE so the client cannot set role at all', async () => {
    await expect(runRegisterValidator({ ...validBody, role: 'EMPLOYEE' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('rejects malicious or invalid role values', async () => {
    await expect(runRegisterValidator({ ...validBody, role: 'SUPERADMIN' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
    await expect(runRegisterValidator({ ...validBody, role: '' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });
});
