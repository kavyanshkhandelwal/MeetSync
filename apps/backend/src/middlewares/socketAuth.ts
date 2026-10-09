import type { Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/auth.utils';

function readHandshakeToken(socket: Socket): string {
  const fromAuth = (socket.handshake.auth as { token?: unknown } | undefined)?.token;
  if (typeof fromAuth === 'string' && fromAuth.trim()) {
    return fromAuth.trim();
  }

  const header = socket.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }

  return '';
}

export function authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
  const token = readHandshakeToken(socket);
  if (!token) {
    next(new Error('Unauthorized'));
    return;
  }

  try {
    socket.data.user = verifyAccessToken(token);
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
}
