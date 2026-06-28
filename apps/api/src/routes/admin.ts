import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { prisma } from '../lib/db.js';
import { esimcard } from '../esimcard/service.js';
import { env } from '../env.js';
import { invalidate } from '../lib/cache.js';
import { getMarkupPercent, setMarkupPercent } from '../catalog/pricing.js';
import { setSetting } from '../lib/settings.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

const round = (n: number) => Math.round(n * 100) / 100;

// GET /api/admin/overview — headline stats + reseller balance.
adminRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const [users, ordersByStatus, sales, balance] = await Promise.all([
      prisma.user.count(),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      // Aggregate in SQL instead of loading every order into memory.
      prisma.order.aggregate({
        where: { status: 'completed' },
        _sum: { retailPrice: true, wholesalePrice: true },
        _count: { _all: true },
      }),
      esimcard.getBalance().catch(() => ({ balance: null as number | null })),
    ]);

    const revenue = sales._sum.retailPrice ?? 0;
    const cost = sales._sum.wholesalePrice ?? 0;
    const completedCount = sales._count._all;
    const bal = balance.balance;

    res.json({
      ok: true,
      data: {
        users,
        ordersByStatus: Object.fromEntries(ordersByStatus.map((o) => [o.status, o._count._all])),
        sales: {
          count: completedCount,
          revenue: round(revenue),
          cost: round(cost),
          profit: round(revenue - cost),
          currency: env.DISPLAY_CURRENCY,
        },
        reseller: {
          balance: bal,
          threshold: env.LOW_BALANCE_THRESHOLD,
          lowBalance: bal != null && bal < env.LOW_BALANCE_THRESHOLD,
        },
        markupPercent: getMarkupPercent(),
        fulfillmentMode: env.FULFILLMENT_MODE,
      },
    });
  }),
);

// GET /api/admin/orders
adminRouter.get(
  '/orders',
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { email: true, name: true } },
        esim: { select: { iccid: true, status: true } },
      },
    });
    res.json({ ok: true, data: orders });
  }),
);

// GET /api/admin/customers
adminRouter.get(
  '/customers',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true, esims: true } },
      },
    });
    res.json({ ok: true, data: users });
  }),
);

// GET /api/admin/settings
adminRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json({
      ok: true,
      data: {
        markupPercent: getMarkupPercent(),
        lowBalanceThreshold: env.LOW_BALANCE_THRESHOLD,
        currency: env.DISPLAY_CURRENCY,
        fulfillmentMode: env.FULFILLMENT_MODE,
      },
    });
  }),
);

// POST /api/admin/settings — update markup (recomputes catalog prices).
const settingsSchema = z.object({ markupPercent: z.number().min(0).max(1000) });
adminRouter.post(
  '/settings',
  asyncHandler(async (req, res) => {
    const { markupPercent } = settingsSchema.parse(req.body);
    setMarkupPercent(markupPercent);
    await setSetting('markup_percent', String(markupPercent));
    invalidate(); // clear cached catalog so new prices take effect
    res.json({ ok: true, data: { markupPercent } });
  }),
);

// POST /api/admin/catalog/refresh — clear the catalog cache.
adminRouter.post(
  '/catalog/refresh',
  asyncHandler(async (_req, res) => {
    invalidate();
    res.json({ ok: true, message: 'Catalog cache cleared.' });
  }),
);
