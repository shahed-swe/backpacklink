import type { Influencer } from '@prisma/client';
import { prisma } from '../lib/db.js';
import { getSetting, setSetting } from '../lib/settings.js';
import { normalizeRef, generateRefCode } from '../influencers/service.js';
import { logger } from '../lib/logger.js';

const round = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Program settings (admin-editable, stored in the Setting KV table)
// ---------------------------------------------------------------------------

export interface AffiliateProgram {
  open: boolean; // accepting new applications
  autoApprove: boolean; // approve applications instantly
  commissionPercent: number; // default commission for new affiliates (% of sale)
  customerDiscountPercent: number; // discount the affiliate's code gives buyers (0 = none)
  holdDays: number; // days a commission stays "pending" before it can be paid (refund window)
  minPayout: number; // minimum approved balance before a payout
  cookieDays: number; // attribution window for ?ref= links (informational, enforced client-side)
}

const DEFAULTS: AffiliateProgram = {
  open: true,
  autoApprove: false,
  commissionPercent: 10,
  customerDiscountPercent: 10,
  holdDays: 14,
  minPayout: 20,
  cookieDays: 30,
};

const KEYS: Record<keyof AffiliateProgram, string> = {
  open: 'affiliate_open',
  autoApprove: 'affiliate_auto_approve',
  commissionPercent: 'affiliate_commission_percent',
  customerDiscountPercent: 'affiliate_customer_discount_percent',
  holdDays: 'affiliate_hold_days',
  minPayout: 'affiliate_min_payout',
  cookieDays: 'affiliate_cookie_days',
};

export async function getProgram(): Promise<AffiliateProgram> {
  const out = { ...DEFAULTS };
  for (const k of Object.keys(KEYS) as (keyof AffiliateProgram)[]) {
    const raw = await getSetting(KEYS[k]);
    if (raw == null) continue;
    if (typeof DEFAULTS[k] === 'boolean') (out as Record<string, unknown>)[k] = raw === 'true';
    else {
      const n = Number(raw);
      if (Number.isFinite(n)) (out as Record<string, unknown>)[k] = n;
    }
  }
  return out;
}

export async function setProgram(patch: Partial<AffiliateProgram>): Promise<AffiliateProgram> {
  for (const k of Object.keys(patch) as (keyof AffiliateProgram)[]) {
    const v = patch[k];
    if (v === undefined || !(k in KEYS)) continue;
    await setSetting(KEYS[k], String(v));
  }
  return getProgram();
}

// ---------------------------------------------------------------------------
// Commission maths
// ---------------------------------------------------------------------------

export function commissionFor(
  inf: Pick<Influencer, 'commissionType' | 'commissionValue'>,
  orderAmount: number,
): number {
  const v = inf.commissionValue ?? 0;
  if (!inf.commissionType || v <= 0) return 0;
  const raw = inf.commissionType === 'percent' ? orderAmount * (v / 100) : v;
  // Never pay more than the sale itself.
  return round(Math.max(0, Math.min(raw, orderAmount)));
}

/**
 * Record the commission for a completed, attributed order. Idempotent (one
 * commission per order). Called right after fulfillment succeeds.
 */
export async function recordCommissionForOrder(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { influencer: true, commission: true },
    });
    if (!order || order.status !== 'completed' || !order.influencer || order.commission) return;
    const inf = order.influencer;
    if (inf.status !== 'approved' || !inf.active) return;
    // An affiliate can't earn commission on their own purchases.
    if (inf.userId && inf.userId === order.userId) return;

    const amount = commissionFor(inf, order.retailPrice);
    if (amount <= 0) return;
    await prisma.affiliateCommission.create({
      data: {
        orderId: order.id,
        influencerId: inf.id,
        orderAmount: order.retailPrice,
        amount,
        currency: order.currency,
        status: 'pending',
      },
    });
    logger.info('Affiliate commission recorded', { orderId, influencerId: inf.id, amount });
  } catch (err) {
    // A unique-constraint race just means another caller recorded it first.
    logger.warn('Could not record affiliate commission', { orderId, err: String(err) });
  }
}

/** Void an unpaid commission when its order is refunded. */
export async function voidCommissionForOrder(orderId: string, note = 'Order refunded'): Promise<void> {
  await prisma.affiliateCommission.updateMany({
    where: { orderId, status: { in: ['pending', 'approved'] } },
    data: { status: 'void', note },
  });
}

/** Move pending commissions past the hold period to "approved" (payable). */
export async function releaseMaturedCommissions(): Promise<number> {
  const { holdDays } = await getProgram();
  const cutoff = new Date(Date.now() - holdDays * 86_400_000);
  const res = await prisma.affiliateCommission.updateMany({
    where: { status: 'pending', createdAt: { lte: cutoff } },
    data: { status: 'approved' },
  });
  return res.count;
}

// ---------------------------------------------------------------------------
// Applications / approval
// ---------------------------------------------------------------------------

export async function uniqueRefCode(seed: string): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateRefCode(seed);
    const [inf, cpn] = await Promise.all([
      prisma.influencer.findUnique({ where: { refCode: code } }),
      prisma.coupon.findUnique({ where: { code } }),
    ]);
    if (!inf && !cpn) return code;
  }
  throw new Error('Could not generate a unique referral code');
}

/**
 * Approve an affiliate: activate them, apply the default commission when none
 * is set, and make sure their personal discount code exists (so buyers in the
 * mobile app — which can't carry a ?ref= link — are still attributed).
 */
export async function approveAffiliate(id: string) {
  const program = await getProgram();
  const inf = await prisma.influencer.findUnique({ where: { id } });
  if (!inf) throw new Error('Affiliate not found');

  const updated = await prisma.influencer.update({
    where: { id },
    data: {
      status: 'approved',
      active: true,
      approvedAt: inf.approvedAt ?? new Date(),
      commissionType: inf.commissionType ?? 'percent',
      commissionValue: inf.commissionValue ?? program.commissionPercent,
    },
  });
  await ensureAffiliateCoupon(updated.id, updated.refCode, program.customerDiscountPercent);
  return updated;
}

export async function ensureAffiliateCoupon(influencerId: string, refCode: string, percent: number) {
  if (percent <= 0) return null;
  const code = normalizeRef(refCode);
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    // Only adopt it if it's unowned or already theirs — never hijack another code.
    if (!existing.influencerId) {
      return prisma.coupon.update({ where: { id: existing.id }, data: { influencerId } });
    }
    return existing;
  }
  return prisma.coupon.create({
    data: {
      code,
      description: 'Affiliate code (auto-created)',
      discountType: 'percent',
      discountValue: percent,
      perUserLimit: 1,
      active: true,
      influencerId,
    },
  });
}

// ---------------------------------------------------------------------------
// Click tracking + stats
// ---------------------------------------------------------------------------

export async function recordClick(ref: string, landingPath?: string, referrer?: string): Promise<boolean> {
  const inf = await prisma.influencer.findUnique({ where: { refCode: normalizeRef(ref) } });
  if (!inf || !inf.active || inf.status !== 'approved') return false;
  await prisma.affiliateClick.create({
    data: {
      influencerId: inf.id,
      landingPath: landingPath?.slice(0, 300) ?? null,
      referrer: referrer?.slice(0, 300) ?? null,
    },
  });
  return true;
}

export async function affiliateStats(influencerId: string) {
  await releaseMaturedCommissions();
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const me = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { userId: true } });
  // The affiliate's own purchases never count as referred sales.
  const notSelf = me?.userId ? { userId: { not: me.userId } } : {};
  const [clicks, clicks30, orders, byStatus, paidOut, recentCommissions, daily] = await Promise.all([
    prisma.affiliateClick.count({ where: { influencerId } }),
    prisma.affiliateClick.count({ where: { influencerId, createdAt: { gte: since30 } } }),
    prisma.order.aggregate({
      where: { influencerId, status: 'completed', ...notSelf },
      _count: { _all: true },
      _sum: { retailPrice: true },
    }),
    prisma.affiliateCommission.groupBy({
      by: ['status'],
      where: { influencerId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.affiliatePayout.aggregate({ where: { influencerId }, _sum: { amount: true } }),
    prisma.affiliateCommission.findMany({
      where: { influencerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { order: { select: { packageName: true, createdAt: true } } },
    }),
    prisma.affiliateClick.findMany({
      where: { influencerId, createdAt: { gte: since30 } },
      select: { createdAt: true },
    }),
  ]);

  const sum = (s: string) => round(byStatus.find((b) => b.status === s)?._sum.amount ?? 0);
  const sales = orders._count._all;

  const clicksByDay = new Map<string, number>();
  for (const c of daily) {
    const d = c.createdAt.toISOString().slice(0, 10);
    clicksByDay.set(d, (clicksByDay.get(d) ?? 0) + 1);
  }

  return {
    clicks,
    clicks30,
    sales,
    revenue: round(orders._sum.retailPrice ?? 0),
    conversionRate: clicks ? round((sales / clicks) * 100) : 0,
    earnings: {
      pending: sum('pending'),
      approved: sum('approved'),
      paid: sum('paid'),
      total: round(sum('pending') + sum('approved') + sum('paid')),
      paidOut: round(paidOut._sum.amount ?? 0),
    },
    clicksByDay: [...clicksByDay.entries()].sort().map(([date, count]) => ({ date, count })),
    commissions: recentCommissions.map((c) => ({
      id: c.id,
      packageName: c.order.packageName,
      orderAmount: c.orderAmount,
      amount: c.amount,
      currency: c.currency,
      status: c.status,
      createdAt: c.createdAt,
    })),
  };
}

