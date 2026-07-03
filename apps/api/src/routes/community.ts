import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/db.js';

export const communityRouter = Router();

// GET /api/community/tips?country= — approved tips feed (newest first).
communityRouter.get(
  '/tips',
  asyncHandler(async (req, res) => {
    const country = typeof req.query.country === 'string' ? req.query.country : undefined;
    const tips = await prisma.tip.findMany({
      where: { status: 'approved', ...(country ? { country } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, country: true } } },
    });
    res.json({ ok: true, data: tips });
  }),
);

const tipSchema = z.object({
  country: z.string().min(1).max(60),
  body: z.string().min(1).max(500),
  photoUrl: z.string().url().max(500).optional(),
});

// POST /api/community/tips — share a tip (auto-approved; admin can hide).
communityRouter.post(
  '/tips',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = tipSchema.parse(req.body);
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
