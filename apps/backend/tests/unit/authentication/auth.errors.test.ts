import { describe, expect, it } from 'vitest';
import {
  ApiError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../src/utils/errors';

describe('API error classes', () => {
  it('maps each subclass to its status code', () => {
    expect(new BadRequestError().statusCode).toBe(400);
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new ConflictError().statusCode).toBe(409);
    expect(new ApiError('x', 418).statusCode).toBe(418);
  });
});
