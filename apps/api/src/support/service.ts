import { prisma } from '../lib/db.js';

/** One support thread per customer (created lazily). */
export async function getOrCreateThread(userId: string) {
  const existing = await prisma.supportThread.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.supportThread.create({ data: { userId } });
}

export async function listMessages(threadId: string) {
  return prisma.supportMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });
}

export async function postMessage(input: {
  threadId: string;
  senderId: string;
  senderRole: 'customer' | 'admin';
  body: string;
}) {
  const msg = await prisma.supportMessage.create({ data: input });
  await prisma.supportThread.update({
    where: { id: input.threadId },
    data: {
      lastMessageAt: msg.createdAt,
      status: 'open',
      unreadByAdmin: input.senderRole === 'customer' ? { increment: 1 } : undefined,
      unreadByUser: input.senderRole === 'admin' ? { increment: 1 } : undefined,
    },
  });
  return msg;
}

export async function markThreadRead(threadId: string, who: 'admin' | 'customer') {
  await prisma.supportThread.update({
    where: { id: threadId },
    data: who === 'admin' ? { unreadByAdmin: 0 } : { unreadByUser: 0 },
  });
}
