import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { prisma } from '../lib/db.js';
import { env } from '../env.js';
import {
  getProgram,
  approveAffiliate,
  uniqueRefCode,
  recordClick,
  affiliateStats,
} from '../affiliates/service.js';

// Self-serve affiliate portal API (used by affiliate.backpacklink.com).
export const affiliateRouter = Router();

// GET /api/affiliate/program — public program terms for the landing page.
affiliateRouter.get(
  '/program',
  asyncHandler(async (_req, res) => {
    const p = await getProgram();
    res.json({
      ok: true,
      data: {
        open: p.open,
        commissionPercent: p.commissionPercent,
        customerDiscountPercent: p.customerDiscountPercent,
        holdDays: p.holdDays,
        minPayout: p.minPayout,
        cookieDays: p.cookieDays,
        currency: env.DISPLAY_CURRENCY,
      },
    });
  }),
);

// POST /api/affiliate/click — storefront reports a ?ref= landing (public).
const clickSchema = z.object({
  ref: z.string().min(1).max(80),
  path: z.string().max(300).optional(),
  referrer: z.string().max(300).optional(),
});
affiliateRouter.post(
  '/click',
  rateLimit({ windowMs: 60_000, max: 20 }),
  asyncHandler(async (req, res) => {
    const { ref, path, referrer } = clickSchema.parse(req.body);
    const tracked = await recordClick(ref, path, referrer);
    res.json({ ok: true, tracked });
  }),
);

// Everything below requires a logged-in account.
affiliateRouter.use(requireAuth);

async function myAffiliate(userId: string) {
  return prisma.influencer.findUnique({ where: { userId } });
}

function publicAffiliate(a: NonNullable<Awaited<ReturnType<typeof myAffiliate>>>) {
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    handle: a.handle,
    platform: a.platform,
    website: a.website,
    audience: a.audience,
    country: a.country,
    refCode: a.refCode,
    status: a.status,
    active: a.active,
    commissionType: a.commissionType,
    commissionValue: a.commissionValue,
    payoutMethod: a.payoutMethod,
    payoutDetails: a.payoutDetails,
    approvedAt: a.approvedAt,
    createdAt: a.createdAt,
  };
}

// GET /api/affiliate/me — my affiliate profile (null if I haven't applied).
affiliateRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const a = await myAffiliate(req.userId!);
    if (!a) return res.json({ ok: true, data: null });
    const coupon = await prisma.coupon.findFirst({
      where: { influencerId: a.id, active: true },
      orderBy: { createdAt: 'asc' },
      select: { code: true, discountType: true, discountValue: true },
    });
    res.json({
      ok: true,
      data: {
        ...publicAffiliate(a),
        link: `${env.WEB_URL}/?ref=${a.refCode}`,
        coupon,
      },
    });
  }),
);

// POST /api/affiliate/apply — submit an application.
const applySchema = z.object({
  name: z.string().min(1).max(120),
  platform: z.string().max(40).optional(),
  handle: z.string().max(80).optional(),
  website: z.string().max(300).optional(),
  audience: z.string().max(2000).optional(),
  country: z.string().max(80).optional(),
  payoutMethod: z.enum(['paypal', 'bank', 'wise', 'other']).optional(),
  payoutDetails: z.string().max(500).optional(),
  agree: z.literal(true, { errorMap: () => ({ message: 'You must accept the affiliate terms' }) }),
});
affiliateRouter.post(
  '/apply',
  asyncHandler(async (req, res) => {
    const input = applySchema.parse(req.body);
    const program = await getProgram();
    if (!program.open) {
      return res.status(400).json({ ok: false, error: 'The affiliate program is not accepting applications right now.' });
    }
    const existing = await myAffiliate(req.userId!);
    if (existing) return res.status(409).json({ ok: false, error: 'You have already applied.' });

    const refCode = await uniqueRefCode(input.handle || input.name);
    let affiliate = await prisma.influencer.create({
      data: {
        userId: req.userId!,
        email: req.userEmail!,
        name: input.name,
        platform: input.platform || null,
        handle: input.handle || null,
        website: input.website || null,
        audience: input.audience || null,
        country: input.country || null,
        payoutMethod: input.payoutMethod ?? null,
        payoutDetails: input.payoutDetails || null,
        refCode,
        status: 'pending',
        active: false,
        commissionType: 'percent',
        commissionValue: program.commissionPercent,
      },
    });
    if (program.autoApprove) affiliate = await approveAffiliate(affiliate.id);
    res.status(201).json({ ok: true, data: publicAffiliate(affiliate) });
  }),
);

// PATCH /api/affiliate/me — update my profile / payout details.
const profileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  platform: z.string().max(40).nullish(),
  handle: z.string().max(80).nullish(),
  website: z.string().max(300).nullish(),
  country: z.string().max(80).nullish(),
  payoutMethod: z.enum(['paypal', 'bank', 'wise', 'other']).nullish(),
  payoutDetails: z.string().max(500).nullish(),
});
affiliateRouter.patch(
  '/me',
  asyncHandler(async (req, res) => {
    const data = profileSchema.parse(req.body);
    const a = await myAffiliate(req.userId!);
    if (!a) return res.status(404).json({ ok: false, error: 'Not an affiliate' });
    const updated = await prisma.influencer.update({ where: { id: a.id }, data });
    res.json({ ok: true, data: publicAffiliate(updated) });
  }),
);

// GET /api/affiliate/stats — dashboard numbers (approved affiliates only).
affiliateRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const a = await myAffiliate(req.userId!);
    if (!a) return res.status(404).json({ ok: false, error: 'Not an affiliate' });
    const [stats, program] = await Promise.all([affiliateStats(a.id), getProgram()]);
    res.json({
      ok: true,
      data: { ...stats, minPayout: program.minPayout, holdDays: program.holdDays },
      currency: env.DISPLAY_CURRENCY,
    });
  }),
);

// GET /api/affiliate/payouts — my payout history.
affiliateRouter.get(
  '/payouts',
  asyncHandler(async (req, res) => {
    const a = await myAffiliate(req.userId!);
    if (!a) return res.status(404).json({ ok: false, error: 'Not an affiliate' });
    const payouts = await prisma.affiliatePayout.findMany({
      where: { influencerId: a.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, amount: true, currency: true, method: true, reference: true, createdAt: true },
    });
    res.json({ ok: true, data: payouts });
  }),
);
