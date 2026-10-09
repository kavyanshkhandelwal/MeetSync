import { describe, expect, it } from 'vitest';
import { apiClient } from '../../../src/lib/axios';

describe('apiClient interceptors', () => {
  it('attaches Bearer token from localStorage', () => {
    localStorage.setItem('authToken', 'abc.def');
    const handlers = (apiClient.interceptors.request as any).handlers;
    const fulfilled = handlers[0].fulfilled;
    const config = fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer abc.def');
  });

  it('leaves Authorization unset when no token is stored', () => {
    const handlers = (apiClient.interceptors.request as any).handlers;
    const fulfilled = handlers[0].fulfilled;
    const config = fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('clears auth storage on 401', async () => {
    localStorage.setItem('authToken', 'expired');
    localStorage.setItem('user', '{"email":"ada@company.com"}');
    const handlers = (apiClient.interceptors.response as any).handlers;
    const rejected = handlers[0].rejected;
    await expect(rejected({ response: { status: 401 } })).rejects.toBeTruthy();
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
