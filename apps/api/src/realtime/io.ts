import type { Server } from 'socket.io';

// Holds the socket.io instance so REST handlers can also push realtime events.
let io: Server | null = null;

export function setIo(instance: Server) {
  io = instance;
}

export function emitToThread(threadId: string, event: string, payload: unknown) {
  io?.to(`thread:${threadId}`).emit(event, payload);
}

export function emitToAdmins(event: string, payload: unknown) {
  io?.to('admins').emit(event, payload);
}
