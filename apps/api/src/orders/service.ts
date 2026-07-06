import { prisma } from '../lib/db.js';
import { catalog } from '../catalog/service.js';
import { fulfillOrder } from './fulfillment.js';
import { evaluateCoupon, recordRedemption } from '../coupons/service.js';
import { HttpError } from '../lib/errors.js';

export interface OrderAttribution {
  couponCode?: string | null;
  influencerId?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  referrer?: string | null;
}

export async function createOrderForPackage(
  userId: string,
  packageId: string,
  opts: OrderAttribution = {},
) {
  const pkg = await catalog.packageDetail(packageId);
  if (!pkg) throw new Error('Package not found');

  // Discount is computed server-side from the catalog price — never trusted
  // from the client. A code that was provided but is invalid rejects checkout.
  const coupon = await evaluateCoupon(opts.couponCode, pkg.price.retail, pkg.price.wholesale, userId);
  if (opts.couponCode && opts.couponCode.trim() && !coupon.valid) {
    throw new HttpError(400, coupon.reason ?? 'Invalid coupon');
  }

  // A coupon's own influencer takes precedence for attribution; otherwise fall
  // back to a ref-link influencer passed by the client (Phase 3).
  const influencerId = coupon.influencerId ?? opts.influencerId ?? null;

  const order = await prisma.order.create({
    data: {
      userId,
      providerPackageId: pkg.id,
      packageName: pkg.name,
      packageType: pkg.type,
      retailPrice: coupon.valid ? coupon.finalPrice : pkg.price.retail,
      wholesalePrice: pkg.price.wholesale,
      currency: pkg.price.currency,
      status: 'pending',
      paymentProvider: 'stripe',
      couponId: coupon.couponId,
      couponCode: coupon.couponCode,
      discountAmount: coupon.discountAmount,
      influencerId,
      source: opts.source ?? null,
      medium: opts.medium ?? null,
      campaign: opts.campaign ?? null,
      referrer: opts.referrer ?? null,
    },
  });
  return { order, pkg, coupon };
}

/** Mark a pending order paid and immediately provision the eSIM. */
export async function markPaidAndFulfill(orderId: string, paymentRef?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (order.status === 'completed') return order;

  // Atomically move pending -> paid EXACTLY ONCE. If another caller (webhook,
  // a second confirm poll) already advanced it past 'pending', we do NOT reset
  // it — that would re-open the purchase window and could double-charge the
  // reseller balance in live mode. fulfillOrder then claims paid -> fulfilling.
  const transition = await prisma.order.updateMany({
    where: { id: orderId, status: 'pending' },
    data: { status: 'paid', paymentRef: paymentRef ?? undefined },
  });

  // Count the coupon redemption exactly once — only on the call that actually
  // performed the pending -> paid transition.
  if (transition.count === 1 && order.couponId) {
    await recordRedemption(order.couponId);
  }

  return fulfillOrder(orderId);
}
