'use client';

import { io, type Socket } from 'socket.io-client';
import { API_BASE, getToken } from './client-api';

let socket: Socket | null = null;

/** Shared authenticated socket.io connection for the admin app. */
export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  if (socket) socket.connect();
  else {
    socket = io(API_BASE, {
      auth: { token: getToken() },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
