import { Router } from 'express';
import type { Request } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { generateRefCode, normalizeRef, commissionOwed } from '../influencers/service.js';
import { uploadImage, publicUploadUrl } from '../lib/uploads.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { prisma } from '../lib/db.js';
import { esimcard } from '../esimcard/service.js';
import { env } from '../env.js';
import { invalidate } from '../lib/cache.js';
import { getMarkupPercent, setMarkupPercent } from '../catalog/pricing.js';
import { setSetting } from '../lib/settings.js';
import { listMessages, postMessage, markThreadRead } from '../support/service.js';
import { emitToThread, emitToAdmins } from '../realtime/io.js';
import { syncOrderWithStripe } from '../orders/reconcile.js';

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

// GET /api/admin/orders?status=&q= — newest first, filterable.
// status: completed | pending | abandoned | failed (failed+refunded) | all
adminRouter.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'all';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const where: Record<string, unknown> = {};
    if (status === 'failed') where.status = { in: ['failed', 'refunded'] };
    else if (status === 'active') where.status = { in: ['paid', 'fulfilling'] };
    else if (status && status !== 'all') where.status = status;
    if (q) where.OR = [{ id: q }, { paymentRef: q }, { user: { email: { contains: q.toLowerCase() } } }];

    const [orders, counts] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          user: { select: { email: true, name: true } },
          esim: { select: { iccid: true, status: true } },
          influencer: { select: { name: true, refCode: true } },
        },
      }),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    res.json({
      ok: true,
      data: orders,
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    });
  }),
);

// POST /api/admin/orders/:id/sync — ask Stripe what really happened to this
// order and settle it (fulfil if paid, mark abandoned if the checkout expired).
adminRouter.post(
  '/orders/:id/sync',
  asyncHandler(async (req, res) => {
    const result = await syncOrderWithStripe(req.params.id);
    res.json({ ok: true, ...result });
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

// --- Support inbox ---

// GET /api/admin/support/threads — all conversations, newest activity first.
adminRouter.get(
  '/support/threads',
  asyncHandler(async (_req, res) => {
    const threads = await prisma.supportThread.findMany({
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
      include: {
        user: { select: { email: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    res.json({
      ok: true,
      data: threads.map((t) => ({
        id: t.id,
        user: t.user,
        status: t.status,
        starred: t.starred,
        unreadByAdmin: t.unreadByAdmin,
        lastMessageAt: t.lastMessageAt,
        lastMessage: t.messages[0]?.body ?? null,
      })),
    });
  }),
);

// GET /api/admin/support/threads/:id — one conversation + full history.
adminRouter.get(
  '/support/threads/:id',
  asyncHandler(async (req, res) => {
    const thread = await prisma.supportThread.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!thread) return res.status(404).json({ ok: false, error: 'Thread not found' });
    const messages = await listMessages(thread.id);
    await markThreadRead(thread.id, 'admin');
    res.json({ ok: true, thread, messages });
  }),
);

// POST /api/admin/support/threads/:id/reply — reply as admin.
const replySchema = z.object({ body: z.string().min(1).max(2000) });
adminRouter.post(
  '/support/threads/:id/reply',
  asyncHandler(async (req, res) => {
    const { body } = replySchema.parse(req.body);
    const thread = await prisma.supportThread.findUnique({ where: { id: req.params.id } });
    if (!thread) return res.status(404).json({ ok: false, error: 'Thread not found' });
    const msg = await postMessage({
      threadId: thread.id,
      senderId: req.userId!,
      senderRole: 'admin',
      body,
    });
    emitToThread(thread.id, 'support:message', msg);
    emitToAdmins('support:thread-updated', { threadId: thread.id });
    res.status(201).json({ ok: true, message: msg });
  }),
);

// PATCH /api/admin/support/threads/:id — mark resolved/open or star/unstar.
const threadPatchSchema = z.object({
  status: z.enum(['open', 'resolved']).optional(),
  starred: z.boolean().optional(),
});
adminRouter.patch(
  '/support/threads/:id',
  asyncHandler(async (req, res) => {
    const data = threadPatchSchema.parse(req.body);
    const thread = await prisma.supportThread.update({ where: { id: req.params.id }, data });
    emitToAdmins('support:thread-updated', { threadId: thread.id });
    res.json({ ok: true, data: thread });
  }),
);

// --- Community moderation ---

// GET /api/admin/tips — all tips (including hidden), most-reported first so
// anything the community flagged lands at the top of the moderation queue.
adminRouter.get(
  '/tips',
  asyncHandler(async (_req, res) => {
    const tips = await prisma.tip.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: { select: { email: true, name: true } },
        _count: { select: { reports: true } },
      },
    });
    const withReports = tips.map(({ _count, ...tip }) => ({ ...tip, reports: _count.reports }));
    withReports.sort((a, b) => b.reports - a.reports);
    res.json({ ok: true, data: withReports });
  }),
);

// POST /api/admin/tips/:id/status — approve or hide a tip.
const tipStatusSchema = z.object({ status: z.enum(['approved', 'hidden']) });
adminRouter.post(
  '/tips/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = tipStatusSchema.parse(req.body);
    const tip = await prisma.tip.update({ where: { id: req.params.id }, data: { status } });
    res.json({ ok: true, tip });
  }),
);

// --- Promotions (campaign bar + banners; fully admin-managed, event-driven) ---

const promotionInput = z.object({
  kind: z.enum(['bar', 'banner']),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(400).nullish(),
  imageUrl: z.string().max(1000).nullish(),
  bgColor: z.string().max(30).nullish(),
  textColor: z.string().max(30).nullish(),
  ctaLabel: z.string().max(80).nullish(),
  ctaUrl: z.string().max(1000).nullish(),
  couponCode: z.string().max(80).nullish(),
  placement: z.enum(['web', 'mobile', 'both']).default('both'),
  priority: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
  startsAt: z.string().nullish(),
  endsAt: z.string().nullish(),
});

// Coerce blank strings to null and date strings to Date; leaves `undefined` keys
// out so PATCH is a true partial update (Prisma ignores undefined).
function toPromoData(input: Record<string, unknown>): Record<string, unknown> {
  const d: Record<string, unknown> = { ...input };
  for (const k of ['subtitle', 'imageUrl', 'bgColor', 'textColor', 'ctaLabel', 'ctaUrl', 'couponCode']) {
    if (d[k] === '') d[k] = null;
  }
  for (const k of ['startsAt', 'endsAt'] as const) {
    if (d[k] === '') d[k] = null;
    else if (typeof d[k] === 'string') d[k] = new Date(d[k] as string);
  }
  return d;
}

// GET /api/admin/promotions — all promos (incl. inactive/expired) for management.
adminRouter.get(
  '/promotions',
  asyncHandler(async (_req, res) => {
    const promotions = await prisma.promotion.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ ok: true, data: promotions });
  }),
);

// POST /api/admin/promotions — create a bar or banner.
adminRouter.post(
  '/promotions',
  asyncHandler(async (req, res) => {
    const input = promotionInput.parse(req.body);
    const promotion = await prisma.promotion.create({ data: toPromoData(input) as never });
    res.status(201).json({ ok: true, data: promotion });
  }),
);

// PATCH /api/admin/promotions/:id — partial update.
adminRouter.patch(
  '/promotions/:id',
  asyncHandler(async (req, res) => {
    const input = promotionInput.partial().parse(req.body);
    const promotion = await prisma.promotion.update({
      where: { id: req.params.id },
      data: toPromoData(input) as never,
    });
    res.json({ ok: true, data: promotion });
  }),
);

// DELETE /api/admin/promotions/:id
adminRouter.delete(
  '/promotions/:id',
  asyncHandler(async (req, res) => {
    await prisma.promotion.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

// POST /api/admin/uploads — upload a banner image; returns its public URL.
adminRouter.post('/uploads', (req, res) => {
  uploadImage.single('file')(req, res, (err: unknown) => {
    if (err) {
      return res.status(400).json({ ok: false, error: err instanceof Error ? err.message : 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });
    res.json({ ok: true, url: publicUploadUrl(req, req.file.filename) });
  });
});

// --- Coupons (discount codes, optionally tied to an influencer) ---

const numLike = z.union([z.string(), z.number()]);
const couponInput = z.object({
  code: z.string().min(1).max(80),
  description: z.string().max(300).nullish(),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: numLike,
  minSubtotal: numLike.nullish(),
  maxRedemptions: numLike.nullish(),
  perUserLimit: numLike.nullish(),
  active: z.boolean().default(true),
  startsAt: z.string().nullish(),
  endsAt: z.string().nullish(),
  influencerId: z.string().nullish(),
});

function numOrNull(v: unknown): number | null {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Only transforms keys that are present, so PATCH stays a true partial update.
function toCouponData(input: Record<string, unknown>): Record<string, unknown> {
  const d: Record<string, unknown> = { ...input };
  if ('code' in d && typeof d.code === 'string') d.code = d.code.trim().toUpperCase();
  for (const k of ['description', 'influencerId']) if (k in d && d[k] === '') d[k] = null;
  if ('discountValue' in d) d.discountValue = numOrNull(d.discountValue) ?? 0;
  for (const k of ['minSubtotal', 'maxRedemptions', 'perUserLimit']) if (k in d) d[k] = numOrNull(d[k]);
  for (const k of ['startsAt', 'endsAt']) {
    if (k in d) d[k] = d[k] === '' || d[k] == null ? null : new Date(d[k] as string);
  }
  return d;
}

// GET /api/admin/coupons — all coupons with their linked influencer + usage.
adminRouter.get(
  '/coupons',
  asyncHandler(async (_req, res) => {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { influencer: { select: { id: true, name: true, refCode: true } } },
    });
    res.json({ ok: true, data: coupons });
  }),
);

// POST /api/admin/coupons — create.
adminRouter.post(
  '/coupons',
  asyncHandler(async (req, res) => {
    const input = couponInput.parse(req.body);
    const coupon = await prisma.coupon.create({ data: toCouponData(input) as never });
    res.status(201).json({ ok: true, data: coupon });
  }),
);

// PATCH /api/admin/coupons/:id — partial update.
adminRouter.patch(
  '/coupons/:id',
  asyncHandler(async (req, res) => {
    const input = couponInput.partial().parse(req.body);
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: toCouponData(input) as never,
    });
    res.json({ ok: true, data: coupon });
  }),
);

// DELETE /api/admin/coupons/:id
adminRouter.delete(
  '/coupons/:id',
  asyncHandler(async (req, res) => {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }),
);

// --- Influencers / affiliates ---

const influencerInput = z.object({
  name: z.string().min(1).max(120),
  handle: z.string().max(80).nullish(),
  platform: z.string().max(40).nullish(),
  email: z.string().max(200).nullish(),
  refCode: z.string().max(80).nullish(),
  commissionType: z.enum(['percent', 'fixed']).nullish(),
  commissionValue: numLike.nullish(),
  active: z.boolean().default(true),
});

function toInfluencerData(input: Record<string, unknown>): Record<string, unknown> {
  const d: Record<string, unknown> = { ...input };
  for (const k of ['handle', 'platform', 'email']) if (k in d && d[k] === '') d[k] = null;
  if ('refCode' in d) {
    if (typeof d.refCode === 'string' && d.refCode.trim()) d.refCode = normalizeRef(d.refCode);
    else delete d.refCode; // let the caller generate one
  }
  if ('commissionType' in d && (d.commissionType === '' || d.commissionType == null)) d.commissionType = null;
  if ('commissionValue' in d) d.commissionValue = numOrNull(d.commissionValue);
  return d;
}

// GET /api/admin/influencers — roster with coupon counts.
adminRouter.get(
  '/influencers',
  asyncHandler(async (_req, res) => {
    const influencers = await prisma.influencer.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { coupons: true, orders: true } } },
    });
    res.json({ ok: true, data: influencers });
  }),
);

// POST /api/admin/influencers — create (auto-generates a refCode if omitted).
adminRouter.post(
  '/influencers',
  asyncHandler(async (req, res) => {
    const input = influencerInput.parse(req.body);
    const data = toInfluencerData(input);
    if (!data.refCode) data.refCode = generateRefCode(input.name);
    const influencer = await prisma.influencer.create({ data: data as never });
    res.status(201).json({ ok: true, data: influencer });
  }),
);

// PATCH /api/admin/influencers/:id
adminRouter.patch(
  '/influencers/:id',
  asyncHandler(async (req, res) => {
    const input = influencerInput.partial().parse(req.body);
    const influencer = await prisma.influencer.update({
      where: { id: req.params.id },
      data: toInfluencerData(input) as never,
    });
    res.json({ ok: true, data: influencer });
  }),
);

// DELETE /api/admin/influencers/:id — detach references first so it always succeeds.
adminRouter.delete(
  '/influencers/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    await prisma.$transaction([
      prisma.order.updateMany({ where: { influencerId: id }, data: { influencerId: null } }),
      prisma.coupon.updateMany({ where: { influencerId: id }, data: { influencerId: null } }),
      prisma.influencer.delete({ where: { id } }),
    ]);
    res.json({ ok: true });
  }),
);

// --- Sales attribution reports ---

function dateRange(req: Request) {
  const parse = (v: unknown) => (typeof v === 'string' ? new Date(v) : null);
  const from = parse(req.query.from);
  const to = parse(req.query.to);
  const createdAt: { gte?: Date; lte?: Date } = {};
  if (from && !Number.isNaN(from.getTime())) createdAt.gte = from;
  if (to && !Number.isNaN(to.getTime())) createdAt.lte = to;
  return Object.keys(createdAt).length ? { createdAt } : {};
}

// GET /api/admin/reports/influencers — completed sales attributed per influencer.
adminRouter.get(
  '/reports/influencers',
  asyncHandler(async (req, res) => {
    const range = dateRange(req);
    const [influencers, grouped] = await Promise.all([
      prisma.influencer.findMany(),
      prisma.order.groupBy({
        by: ['influencerId'],
        where: { status: 'completed', influencerId: { not: null }, ...range },
        _count: { _all: true },
        _sum: { retailPrice: true, wholesalePrice: true, discountAmount: true },
      }),
    ]);
    const byId = new Map(grouped.map((g) => [g.influencerId, g]));
    const rows = influencers
      .map((inf) => {
        const g = byId.get(inf.id);
        const orders = g?._count._all ?? 0;
        const revenue = round(g?._sum.retailPrice ?? 0);
        const cost = round(g?._sum.wholesalePrice ?? 0);
        return {
          id: inf.id,
          name: inf.name,
          handle: inf.handle,
          platform: inf.platform,
          refCode: inf.refCode,
          active: inf.active,
          orders,
          revenue,
          profit: round(revenue - cost),
          discount: round(g?._sum.discountAmount ?? 0),
          commission: commissionOwed(inf, revenue, orders),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
    res.json({ ok: true, data: rows, currency: env.DISPLAY_CURRENCY });
  }),
);

// GET /api/admin/reports/sources — completed sales per traffic source.
adminRouter.get(
  '/reports/sources',
  asyncHandler(async (req, res) => {
    const range = dateRange(req);
    const grouped = await prisma.order.groupBy({
      by: ['source'],
      where: { status: 'completed', ...range },
      _count: { _all: true },
      _sum: { retailPrice: true, wholesalePrice: true },
    });
    const rows = grouped
      .map((g) => {
        const revenue = round(g._sum.retailPrice ?? 0);
        const cost = round(g._sum.wholesalePrice ?? 0);
        return {
          source: g.source ?? 'direct',
          orders: g._count._all,
          revenue,
          profit: round(revenue - cost),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
    res.json({ ok: true, data: rows, currency: env.DISPLAY_CURRENCY });
  }),
);

// GET /api/admin/reports/sales — daily revenue/profit series + totals (default 30d).
adminRouter.get(
  '/reports/sales',
  asyncHandler(async (req, res) => {
    const range = dateRange(req);
    const where = range.createdAt
      ? { status: 'completed', ...range }
      : { status: 'completed', createdAt: { gte: new Date(Date.now() - 30 * 86400000) } };
    const orders = await prisma.order.findMany({
      where,
      select: { createdAt: true, retailPrice: true, wholesalePrice: true, discountAmount: true },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<string, { revenue: number; profit: number; orders: number }>();
    let revenue = 0;
    let cost = 0;
    let discount = 0;
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      const b = buckets.get(day) ?? { revenue: 0, profit: 0, orders: 0 };
      b.revenue += o.retailPrice;
      b.profit += o.retailPrice - o.wholesalePrice;
      b.orders += 1;
      buckets.set(day, b);
      revenue += o.retailPrice;
      cost += o.wholesalePrice;
      discount += o.discountAmount;
    }
    const series = [...buckets.entries()].map(([date, b]) => ({
      date,
      revenue: round(b.revenue),
      profit: round(b.profit),
      orders: b.orders,
    }));

    res.json({
      ok: true,
      data: {
        series,
        totals: {
          revenue: round(revenue),
          profit: round(revenue - cost),
          discount: round(discount),
          orders: orders.length,
          avgOrder: orders.length ? round(revenue / orders.length) : 0,
        },
      },
      currency: env.DISPLAY_CURRENCY,
    });
  }),
);

// GET /api/admin/reports/coupons — performance per coupon.
adminRouter.get(
  '/reports/coupons',
  asyncHandler(async (req, res) => {
    const range = dateRange(req);
    const [coupons, grouped] = await Promise.all([
      prisma.coupon.findMany(),
      prisma.order.groupBy({
        by: ['couponId'],
        where: { status: 'completed', couponId: { not: null }, ...range },
        _count: { _all: true },
        _sum: { retailPrice: true, discountAmount: true },
      }),
    ]);
    const byId = new Map(grouped.map((g) => [g.couponId, g]));
    const rows = coupons
      .map((c) => {
        const g = byId.get(c.id);
        return {
          id: c.id,
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          uses: g?._count._all ?? 0,
          revenue: round(g?._sum.retailPrice ?? 0),
          discountGiven: round(g?._sum.discountAmount ?? 0),
          active: c.active,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
    res.json({ ok: true, data: rows, currency: env.DISPLAY_CURRENCY });
  }),
);
