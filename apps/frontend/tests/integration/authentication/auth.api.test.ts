import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClientMock, resetApiClientMock } from '../../mocks/apiClient';
import { authResponse, loginInput } from '../../fixtures/auth';

vi.mock('../../../src/lib/axios', () => ({
  apiClient: apiClientMock,
}));

import { getMe, login, register, updateProfile } from '../../../src/features/auth/api';

describe('auth API module', () => {
  beforeEach(() => {
    resetApiClientMock();
  });

  it('login posts /auth/login and unwraps data.data', async () => {
    apiClientMock.post.mockResolvedValueOnce({ data: { data: authResponse } });
    const result = await login(loginInput);
    expect(apiClientMock.post).toHaveBeenCalledWith('/auth/login', loginInput);
    expect(result.accessToken).toBe('test-token');
  });

  it('register posts /auth/register', async () => {
    apiClientMock.post.mockResolvedValueOnce({ data: { data: authResponse } });
    await register({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@company.com',
      password: 'Secret123',
    });
    expect(apiClientMock.post).toHaveBeenCalledWith('/auth/register', {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@company.com',
      password: 'Secret123',
    });
  });

  it('getMe hits /auth/me', async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: { data: authResponse.user } });
    const user = await getMe();
    expect(apiClientMock.get).toHaveBeenCalledWith('/auth/me');
    expect(user.email).toBe('ada@company.com');
  });

  it('updateProfile puts /auth/me and unwraps data.data', async () => {
    apiClientMock.put.mockResolvedValueOnce({ data: { data: authResponse.user } });
    const user = await updateProfile({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(apiClientMock.put).toHaveBeenCalledWith('/auth/me', {
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
    expect(user.email).toBe('ada@company.com');
  });
});
