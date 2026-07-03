import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { verifyToken } from '../auth/jwt.js';
import { env } from '../env.js';
import { setIo, emitToThread, emitToAdmins } from './io.js';
import { getOrCreateThread, postMessage, markThreadRead } from '../support/service.js';
import { logger } from '../lib/logger.js';

/** Attaches a JWT-authenticated socket.io server for live support chat. */
export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(',').map((s) => s.trim()),
    },
  });
  setIo(io);

  // Authenticate every socket from the JWT passed in the handshake.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId as string;
    const role = socket.data.role as string;

    if (role === 'admin') {
      socket.join('admins');
    } else {
      const thread = await getOrCreateThread(userId);
      socket.data.threadId = thread.id;
      socket.join(`thread:${thread.id}`);
    }

    // Customer sends a message on their own thread.
    socket.on('support:send', async (payload: { body?: string }) => {
      const body = payload?.body?.trim();
      if (role === 'admin' || !body) return;
      const threadId = socket.data.threadId as string;
      const msg = await postMessage({ threadId, senderId: userId, senderRole: 'customer', body });
      emitToThread(threadId, 'support:message', msg);
      emitToAdmins('support:thread-updated', { threadId });
    });

    // Admin opens a specific customer's thread.
    socket.on('admin:join', (payload: { threadId?: string }) => {
      if (role !== 'admin' || !payload?.threadId) return;
      socket.join(`thread:${payload.threadId}`);
    });

    // Admin replies to a thread.
    socket.on('admin:send', async (payload: { threadId?: string; body?: string }) => {
      const body = payload?.body?.trim();
      if (role !== 'admin' || !payload?.threadId || !body) return;
      const msg = await postMessage({
        threadId: payload.threadId,
        senderId: userId,
        senderRole: 'admin',
        body,
      });
      emitToThread(payload.threadId, 'support:message', msg);
      emitToAdmins('support:thread-updated', { threadId: payload.threadId });
    });

    socket.on('support:read', async () => {
      const threadId = socket.data.threadId as string | undefined;
      if (threadId) await markThreadRead(threadId, role === 'admin' ? 'admin' : 'customer');
    });
  });

  logger.info('Socket.io realtime ready (support chat)');
  return io;
}
