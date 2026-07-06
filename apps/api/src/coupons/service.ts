import { prisma } from '../lib/db.js';

const round = (n: number) => Math.round(n * 100) / 100;

// Codes are stored + compared uppercased (SQLite has no case-insensitive mode).
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export interface CouponEvaluation {
  valid: boolean;
  reason?: string;
  discountAmount: number;
  finalPrice: number;
  couponId: string | null;
  couponCode: string | null;
  influencerId: string | null;
}

/**
 * Validate a coupon against a base retail price and compute the discount.
 * All rules enforced server-side: active flag, start/end window, global
 * redemption cap, per-user limit, minimum subtotal, and a floor at wholesale
 * (we never sell below cost). Returns a preview usable by both the validate
 * endpoint and order creation.
 */
export async function evaluateCoupon(
  codeRaw: string | null | undefined,
  basePrice: number,
  wholesale: number,
  userId?: string,
): Promise<CouponEvaluation> {
  const none: CouponEvaluation = {
    valid: false,
    discountAmount: 0,
    finalPrice: round(basePrice),
    couponId: null,
    couponCode: null,
    influencerId: null,
  };
  if (!codeRaw || !codeRaw.trim()) return { ...none, reason: 'No code' };

  const code = normalizeCode(codeRaw);
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return { ...none, reason: 'Invalid coupon code' };
  if (!coupon.active) return { ...none, reason: 'This coupon is no longer active' };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { ...none, reason: 'This coupon is not active yet' };
  if (coupon.endsAt && coupon.endsAt < now) return { ...none, reason: 'This coupon has expired' };
  if (coupon.maxRedemptions != null && coupon.redemptions >= coupon.maxRedemptions) {
    return { ...none, reason: 'This coupon has reached its usage limit' };
  }
  if (coupon.minSubtotal != null && basePrice < coupon.minSubtotal) {
    return { ...none, reason: `Minimum order of ${round(coupon.minSubtotal)} required` };
  }
  if (userId && coupon.perUserLimit != null) {
    const used = await prisma.order.count({
      where: { userId, couponId: coupon.id, status: { in: ['paid', 'fulfilling', 'completed'] } },
    });
    if (used >= coupon.perUserLimit) return { ...none, reason: 'You have already used this coupon' };
  }

  let discount =
    coupon.discountType === 'percent' ? basePrice * (coupon.discountValue / 100) : coupon.discountValue;
  // Never discount below wholesale (no loss-making sales) and never negative.
  discount = Math.min(discount, Math.max(0, basePrice - wholesale));
  discount = Math.max(0, round(discount));

  return {
    valid: true,
    discountAmount: discount,
    finalPrice: round(basePrice - discount),
    couponId: coupon.id,
    couponCode: coupon.code,
    influencerId: coupon.influencerId,
  };
}

/** Count one completed redemption — called exactly once when payment succeeds. */
export async function recordRedemption(couponId: string): Promise<void> {
  await prisma.coupon.update({ where: { id: couponId }, data: { redemptions: { increment: 1 } } });
}
