import { createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../src/lib/axios';

vi.mock('../../../src/lib/socket', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

import { useLogout } from '../../../src/features/auth/hooks';
import { disconnectSocket } from '../../../src/lib/socket';

function withQueryClient(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

describe('useLogout', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'stale-jwt');
    localStorage.setItem('user', JSON.stringify({ email: 'ada@company.com', role: 'EMPLOYEE' }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('removes authToken and user and disconnects the socket', async () => {
    let logoutFn: (() => void) | undefined;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    function Probe() {
      const { logout } = useLogout();
      logoutFn = logout;
      return null;
    }

    await act(async () => {
      root.render(withQueryClient(createElement(Probe)));
    });

    await act(async () => {
      logoutFn?.();
    });

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(disconnectSocket).toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('prevents a subsequent apiClient request from sending the old token', async () => {
    let logoutFn: (() => void) | undefined;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    function Probe() {
      const { logout } = useLogout();
      logoutFn = logout;
      return null;
    }

    await act(async () => {
      root.render(withQueryClient(createElement(Probe)));
    });

    await act(async () => {
      logoutFn?.();
    });

    const handlers = (apiClient.interceptors.request as any).handlers;
    const fulfilled = handlers[0].fulfilled;
    const config = fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
