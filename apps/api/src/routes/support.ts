import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { getOrCreateThread, listMessages, postMessage, markThreadRead } from '../support/service.js';
import { emitToThread, emitToAdmins } from '../realtime/io.js';

export const supportRouter = Router();
supportRouter.use(requireAuth);

// GET /api/support/thread — the customer's thread + history.
supportRouter.get(
  '/thread',
  asyncHandler(async (req, res) => {
    const thread = await getOrCreateThread(req.userId!);
    const messages = await listMessages(thread.id);
    await markThreadRead(thread.id, 'customer');
    res.json({ ok: true, thread, messages });
  }),
);

// POST /api/support/messages — REST fallback for sending (socket is primary).
const sendSchema = z.object({ body: z.string().min(1).max(2000) });
supportRouter.post(
  '/messages',
  asyncHandler(async (req, res) => {
    const { body } = sendSchema.parse(req.body);
    const thread = await getOrCreateThread(req.userId!);
    const msg = await postMessage({
      threadId: thread.id,
      senderId: req.userId!,
      senderRole: 'customer',
      body,
    });
    emitToThread(thread.id, 'support:message', msg);
    emitToAdmins('support:thread-updated', { threadId: thread.id });
    res.status(201).json({ ok: true, message: msg });
  }),
);
