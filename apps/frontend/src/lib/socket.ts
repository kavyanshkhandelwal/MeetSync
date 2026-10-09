'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function readAuthToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return localStorage.getItem('authToken') || '';
}

export const initSocket = (): Socket => {
  if (socket) {
    return socket;
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  const hasToken = Boolean(readAuthToken());

  socket = io(backendUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: hasToken,
    auth: (cb) => {
      cb({ token: readAuthToken() });
    },
  });

  socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error.message);
  });

  return socket;
};

export const connectSocket = (): Socket => {
  const instance = initSocket();
  if (!instance.connected) {
    instance.connect();
  }
  return instance;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    // Keep the singleton so Providers listeners stay attached across logout/login.
  }
};
