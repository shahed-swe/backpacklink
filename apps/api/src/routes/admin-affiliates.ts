import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { prisma } from '../lib/db.js';
import { env } from '../env.js';
import {
  getProgram,
  setProgram,
  approveAffiliate,
  releaseMaturedCommissions,
} from '../affiliates/service.js';

// Admin management of the self-serve affiliate program.
export const adminAffiliatesRouter = Router();
adminAffiliatesRouter.use(requireAuth, requireAdmin);

const round = (n: number) => Math.round(n * 100) / 100;

// GET /api/admin/affiliates/program
adminAffiliatesRouter.get(
  '/affiliates/program',
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, data: await getProgram() });
  }),
);

// PATCH /api/admin/affiliates/program
const programSchema = z.object({
  open: z.boolean().optional(),
  autoApprove: z.boolean().optional(),
  commissionPercent: z.coerce.number().min(0).max(100).optional(),
  customerDiscountPercent: z.coerce.number().min(0).max(90).optional(),
  holdDays: z.coerce.number().int().min(0).max(365).optional(),
  minPayout: z.coerce.number().min(0).max(100000).optional(),
  cookieDays: z.coerce.number().int().min(1).max(365).optional(),
});
adminAffiliatesRouter.patch(
  '/affiliates/program',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, data: await setProgram(programSchema.parse(req.body)) });
  }),
);

// GET /api/admin/affiliates — every affiliate with balances (pending, approved, paid).
adminAffiliatesRouter.get(
  '/affiliates',
  asyncHandler(async (req, res) => {
    await releaseMaturedCommissions();
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const [affiliates, sums, clicks, sales] = await Promise.all([
      prisma.influencer.findMany({
        where: status ? { status } : {},
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      prisma.affiliateCommission.groupBy({ by: ['influencerId', 'status'], _sum: { amount: true } }),
      prisma.affiliateClick.groupBy({ by: ['influencerId'], _count: { _all: true } }),
      // Commissionable (non-void) sales — excludes self-purchases and refunds.
      prisma.affiliateCommission.groupBy({
        by: ['influencerId'],
        where: { status: { not: 'void' } },
        _count: { _all: true },
        _sum: { orderAmount: true },
      }),
    ]);
    const bal = (id: string, s: string) =>
      round(sums.find((x) => x.influencerId === id && x.status === s)?._sum.amount ?? 0);
    const clickMap = new Map(clicks.map((c) => [c.influencerId, c._count._all]));
    const saleMap = new Map(sales.map((s) => [s.influencerId, s]));
    res.json({
      ok: true,
      currency: env.DISPLAY_CURRENCY,
      data: affiliates.map((a) => {
        const s = saleMap.get(a.id);
        return {
          ...a,
          loginEmail: a.user?.email ?? null,
          user: undefined,
          clicks: clickMap.get(a.id) ?? 0,
          sales: s?._count._all ?? 0,
          revenue: round(s?._sum.orderAmount ?? 0),
          pending: bal(a.id, 'pending'),
          approved: bal(a.id, 'approved'),
          paid: bal(a.id, 'paid'),
        };
      }),
    });
  }),
);

// POST /api/admin/affiliates/:id/approve
adminAffiliatesRouter.post(
  '/affiliates/:id/approve',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, data: await approveAffiliate(req.params.id) });
  }),
);

// POST /api/admin/affiliates/:id/reject
const noteSchema = z.object({ note: z.string().max(1000).optional() });
adminAffiliatesRouter.post(
  '/affiliates/:id/reject',
  asyncHandler(async (req, res) => {
    const { note } = noteSchema.parse(req.body ?? {});
    const a = await prisma.influencer.update({
      where: { id: req.params.id },
      data: { status: 'rejected', active: false, adminNote: note ?? null },
    });
    // Disable their discount code too.
    await prisma.coupon.updateMany({ where: { influencerId: a.id }, data: { active: false } });
    res.json({ ok: true, data: a });
  }),
);

// GET /api/admin/affiliates/commissions?status=&influencerId=
adminAffiliatesRouter.get(
  '/affiliates/commissions',
  asyncHandler(async (req, res) => {
    await releaseMaturedCommissions();
    const where: Record<string, unknown> = {};
    if (typeof req.query.status === 'string' && req.query.status) where.status = req.query.status;
    if (typeof req.query.influencerId === 'string' && req.query.influencerId) where.influencerId = req.query.influencerId;
    const rows = await prisma.affiliateCommission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        influencer: { select: { id: true, name: true, refCode: true } },
        order: { select: { id: true, packageName: true, status: true, user: { select: { email: true } } } },
      },
    });
    res.json({ ok: true, data: rows, currency: env.DISPLAY_CURRENCY });
  }),
);

// PATCH /api/admin/affiliates/commissions/:id — approve early / void manually.
const commissionPatch = z.object({
  status: z.enum(['pending', 'approved', 'void']),
  note: z.string().max(500).optional(),
});
adminAffiliatesRouter.patch(
  '/affiliates/commissions/:id',
  asyncHandler(async (req, res) => {
    const { status, note } = commissionPatch.parse(req.body);
    const c = await prisma.affiliateCommission.findUnique({ where: { id: req.params.id } });
    if (!c) return res.status(404).json({ ok: false, error: 'Commission not found' });
    if (c.status === 'paid') return res.status(400).json({ ok: false, error: 'Already paid — cannot change.' });
    const updated = await prisma.affiliateCommission.update({
      where: { id: c.id },
      data: { status, note: note ?? c.note },
    });
    res.json({ ok: true, data: updated });
  }),
);

// GET /api/admin/affiliates/payouts
adminAffiliatesRouter.get(
  '/affiliates/payouts',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.affiliatePayout.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        influencer: { select: { id: true, name: true, refCode: true } },
        _count: { select: { commissions: true } },
      },
    });
    res.json({ ok: true, data: rows, currency: env.DISPLAY_CURRENCY });
  }),
);

// POST /api/admin/affiliates/:id/payouts — record that you paid this affiliate.
// Marks ALL their approved commissions as paid and bundles them in one payout.
// (The money itself is sent outside the system — PayPal, bank, Wise…)
const payoutSchema = z.object({
  method: z.string().max(40).optional(),
  reference: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
});
adminAffiliatesRouter.post(
  '/affiliates/:id/payouts',
  asyncHandler(async (req, res) => {
    const input = payoutSchema.parse(req.body ?? {});
    await releaseMaturedCommissions();
    const affiliate = await prisma.influencer.findUnique({ where: { id: req.params.id } });
    if (!affiliate) return res.status(404).json({ ok: false, error: 'Affiliate not found' });

    const payout = await prisma.$transaction(async (tx) => {
      const due = await tx.affiliateCommission.findMany({
        where: { influencerId: affiliate.id, status: 'approved' },
      });
      if (due.length === 0) return null;
      const amount = round(due.reduce((s, c) => s + c.amount, 0));
      const p = await tx.affiliatePayout.create({
        data: {
          influencerId: affiliate.id,
          amount,
          currency: due[0].currency,
          method: input.method ?? affiliate.payoutMethod ?? null,
          reference: input.reference ?? null,
          note: input.note ?? null,
        },
      });
      await tx.affiliateCommission.updateMany({
        where: { id: { in: due.map((c) => c.id) }, status: 'approved' },
        data: { status: 'paid', payoutId: p.id },
      });
      return p;
    });
    if (!payout) return res.status(400).json({ ok: false, error: 'Nothing approved to pay out yet.' });
    res.status(201).json({ ok: true, data: payout });
  }),
);
