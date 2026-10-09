import { describe, expect, it } from 'vitest';
import { DEVELOPMENT_JWT_SECRET, resolveJwtSecret } from '../../../src/config';

describe('resolveJwtSecret', () => {
  it('uses the provided secret when set', () => {
    expect(resolveJwtSecret('production', 'from-env')).toBe('from-env');
    expect(resolveJwtSecret('development', 'from-env')).toBe('from-env');
  });

  it('uses the documented development placeholder only in development', () => {
    expect(resolveJwtSecret('development', undefined)).toBe(DEVELOPMENT_JWT_SECRET);
  });

  it('fails fast in production when JWT_SECRET is missing', () => {
    expect(() => resolveJwtSecret('production', undefined)).toThrow(
      'JWT_SECRET is required when NODE_ENV is not development',
    );
  });

  it('fails fast in test when JWT_SECRET is missing', () => {
    expect(() => resolveJwtSecret('test', undefined)).toThrow(
      'JWT_SECRET is required when NODE_ENV is not development',
    );
  });

  it('does not include a secret value in the error message', () => {
    try {
      resolveJwtSecret('production', undefined);
      throw new Error('expected throw');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toMatch(/development-only-jwt-secret/i);
      expect(message).not.toMatch(/super-secret/i);
    }
  });
});
