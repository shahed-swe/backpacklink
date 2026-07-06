import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { asyncHandler } from '../middleware/error.js';

export const promotionsRouter = Router();

// GET /api/promotions?placement=web|mobile
// Public: the active, in-window promo bar + campaign banners for the storefront.
// Fully admin-managed (see /api/admin/promotions) — content is data, not code.
promotionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = String(req.query.placement ?? '');
    const placement = q === 'mobile' ? 'mobile' : q === 'web' ? 'web' : null;
    const now = new Date();

    const promos = await prisma.promotion.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
        ...(placement ? { placement: { in: [placement, 'both'] } } : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    // Convenience split for clients: a single top bar + a list of banners.
    const bar = promos.find((p) => p.kind === 'bar') ?? null;
    const banners = promos.filter((p) => p.kind === 'banner');

    res.json({ ok: true, data: { bar, banners } });
  }),
);
