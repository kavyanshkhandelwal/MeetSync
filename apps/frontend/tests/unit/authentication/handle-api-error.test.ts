import { describe, expect, it, vi } from 'vitest';
import { handleApiError } from '../../../src/lib/handle-api-error';

describe('handleApiError', () => {
  it('maps backend field errors onto setError', () => {
    const setError = vi.fn();
    const setGeneralError = vi.fn();
    handleApiError(
      {
        response: {
          data: {
            message: 'Validation failed',
            errors: [{ path: 'email', msg: 'Please provide a valid email address' }],
          },
        },
      },
      setError,
      setGeneralError,
    );
    expect(setError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'Please provide a valid email address',
    });
    expect(setGeneralError).toHaveBeenCalledWith('Validation failed');
  });

  it('falls back to a root error when there is no field list', () => {
    const setError = vi.fn();
    const setGeneralError = vi.fn();
    handleApiError({ response: { data: { message: 'Unauthorized' } } }, setError, setGeneralError);
    expect(setGeneralError).toHaveBeenCalledWith('Unauthorized');
    expect(setError).toHaveBeenCalledWith('root', { type: 'server', message: 'Unauthorized' });
  });
});
