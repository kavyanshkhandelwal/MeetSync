import { afterEach, describe, expect, it, vi } from 'vitest';

const onMock = vi.fn();
const connectMock = vi.fn();
const disconnectMock = vi.fn();
const ioMock = vi.fn(() => ({
  on: onMock,
  connect: connectMock,
  disconnect: disconnectMock,
  connected: false,
}));

vi.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => ioMock(...args),
}));

describe('frontend socket client', () => {
  afterEach(() => {
    vi.resetModules();
    ioMock.mockClear();
    onMock.mockClear();
    connectMock.mockClear();
    disconnectMock.mockClear();
    localStorage.clear();
  });

  it('sends the existing authToken through handshake auth', async () => {
    localStorage.setItem('authToken', 'test-jwt');
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://example.test:3999';
    const { initSocket } = await import('../../../src/lib/socket');
    initSocket();
    expect(ioMock).toHaveBeenCalledWith(
      'http://example.test:3999',
      expect.objectContaining({
        transports: ['websocket', 'polling'],
        autoConnect: true,
      }),
    );
    const options = ioMock.mock.calls[0][1] as { auth: (cb: (data: { token: string }) => void) => void };
    let sent = { token: '' };
    options.auth((data) => {
      sent = data;
    });
    expect(sent.token).toBe('test-jwt');
  });

  it('does not auto-connect when no authToken is stored', async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://example.test:3999';
    const { initSocket } = await import('../../../src/lib/socket');
    initSocket();
    const options = ioMock.mock.calls[0][1] as { autoConnect: boolean };
    expect(options.autoConnect).toBe(false);
  });

  it('connectSocket reuses the singleton so logout/login does not drop listeners', async () => {
    localStorage.setItem('authToken', 'test-jwt');
    const { connectSocket, disconnectSocket, getSocket } = await import('../../../src/lib/socket');
    const first = connectSocket();
    const second = connectSocket();
    expect(first).toBe(second);
    expect(connectMock).toHaveBeenCalled();
    disconnectSocket();
    expect(disconnectMock).toHaveBeenCalled();
    expect(getSocket()).toBe(first);
    const afterLogin = connectSocket();
    expect(afterLogin).toBe(first);
  });
});
