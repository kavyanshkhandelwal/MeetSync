import http from 'http';
import { io, Socket } from 'socket.io-client';
import { Role } from '@prisma/client';
import socketService from '../../src/services/socket.service';
import { generateAccessToken } from '../../src/utils/auth.utils';
import { USER_ID } from '../fixtures/ids';

export const TEST_ORIGIN = 'http://localhost:3000';

export function listen(server: http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to bind test HTTP server'));
        return;
      }
      resolve(address.port);
    });
    server.on('error', reject);
  });
}

export function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

export function createTestToken(overrides: { userId?: string; email?: string; role?: Role } = {}): string {
  return generateAccessToken({
    userId: overrides.userId || USER_ID,
    email: overrides.email || 'socket@company.com',
    role: overrides.role || Role.EMPLOYEE,
  });
}

export function createClient(port: number, token?: string | null): Socket {
  const options: Record<string, unknown> = {
    transports: ['websocket'],
    extraHeaders: { Origin: TEST_ORIGIN },
    reconnection: false,
    timeout: 3000,
    forceNew: true,
  };
  if (token) {
    options.auth = { token };
  }
  return io(`http://127.0.0.1:${port}`, options);
}

export function createAuthenticatedClient(port: number): Socket {
  return createClient(port, createTestToken());
}

export function waitForConnect(socket: Socket, timeoutMs = 4000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      reject(new Error('Socket connect timeout'));
    }, timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export function waitForEvent<T = unknown>(
  socket: Socket,
  event: string,
  timeoutMs = 4000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timed out waiting for ${event}`));
    }, timeoutMs);
    const onEvent = (data: T) => {
      clearTimeout(timer);
      resolve(data);
    };
    socket.once(event, onEvent);
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function initSocketServer(): { server: http.Server } {
  const server = http.createServer();
  socketService.init(server);
  return { server };
}
