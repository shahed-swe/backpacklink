import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { HttpError } from '../lib/errors.js';
import { findBlockedTerm, TIP_REPORT_HIDE_THRESHOLD } from '../lib/moderation.js';
import { prisma } from '../lib/db.js';

export const communityRouter = Router();

/** Ids of travellers the viewer has blocked (empty when signed out). */
async function blockedAuthorIds(viewerId?: string): Promise<string[]> {
  if (!viewerId) return [];
  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: viewerId },
    select: { blockedId: true },
  });
  return blocks.map((b) => b.blockedId);
}

// GET /api/community/tips?country= — approved tips feed (newest first).
// Signed-in viewers never see tips from travellers they've blocked.
communityRouter.get(
  '/tips',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const country = typeof req.query.country === 'string' ? req.query.country : undefined;
    const blocked = await blockedAuthorIds(req.userId);
    const tips = await prisma.tip.findMany({
      where: {
        status: 'approved',
        ...(country ? { country } : {}),
        ...(blocked.length ? { userId: { notIn: blocked } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { id: true, name: true, country: true } } },
    });
    res.json({ ok: true, data: tips });
  }),
);

const tipSchema = z.object({
  country: z.string().min(1).max(60),
  body: z.string().min(1).max(500),
  photoUrl: z.string().url().max(500).optional(),
});

// POST /api/community/tips — share a tip. Objectionable content is rejected up front.
communityRouter.post(
  '/tips',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = tipSchema.parse(req.body);
    if (findBlockedTerm(input.body) || findBlockedTerm(input.country)) {
      throw new HttpError(400, 'Your tip contains language that isn’t allowed here.');
    }
    const tip = await prisma.tip.create({
      data: { userId: req.userId!, country: input.country, body: input.body, photoUrl: input.photoUrl },
    });
    res.status(201).json({ ok: true, tip });
  }),
);

// POST /api/community/tips/:id/like — bump the like count.
communityRouter.post(
  '/tips/:id/like',
  requireAuth,
  asyncHandler(async (req, res) => {
    const tip = await prisma.tip.update({
      where: { id: req.params.id },
      data: { likes: { increment: 1 } },
    });
    res.json({ ok: true, likes: tip.likes });
  }),
);

const reportSchema = z.object({ reason: z.string().max(300).optional() });

// POST /api/community/tips/:id/report — flag a tip for moderation.
// Once TIP_REPORT_HIDE_THRESHOLD distinct travellers report it, it leaves the
// feed immediately and waits for an admin to review it.
communityRouter.post(
  '/tips/:id/report',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { reason } = reportSchema.parse(req.body ?? {});
    const tip = await prisma.tip.findUnique({ where: { id: req.params.id } });
    if (!tip) throw new HttpError(404, 'Tip not found');

    // Idempotent: reporting twice is a no-op, not an error or a second vote.
    await prisma.tipReport.upsert({
      where: { tipId_reporterId: { tipId: tip.id, reporterId: req.userId! } },
      create: { tipId: tip.id, reporterId: req.userId!, reason: reason ?? null },
      update: { reason: reason ?? null },
    });

    const reports = await prisma.tipReport.count({ where: { tipId: tip.id } });
    if (reports >= TIP_REPORT_HIDE_THRESHOLD && tip.status === 'approved') {
      await prisma.tip.update({ where: { id: tip.id }, data: { status: 'hidden' } });
    }
    res.json({ ok: true, reports });
  }),
);

// POST /api/community/users/:id/block — hide a traveller's tips from your feed.
communityRouter.post(
  '/users/:id/block',
  requireAuth,
  asyncHandler(async (req, res) => {
    const blockedId = req.params.id;
    if (blockedId === req.userId) throw new HttpError(400, 'You can’t block yourself.');

    const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!target) throw new HttpError(404, 'Traveller not found');

    await prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: req.userId!, blockedId } },
      create: { blockerId: req.userId!, blockedId },
      update: {},
    });
    res.json({ ok: true });
  }),
);

// DELETE /api/community/users/:id/block — unblock.
communityRouter.delete(
  '/users/:id/block',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.userBlock.deleteMany({
      where: { blockerId: req.userId!, blockedId: req.params.id },
    });
    res.json({ ok: true });
  }),
);
