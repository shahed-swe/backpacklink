import { prisma } from '../lib/db.js';
import { stripe } from '../payments/stripe.js';
import { markPaidAndFulfill } from './service.js';
import { voidCommissionForOrder } from '../affiliates/service.js';
import { logger } from '../lib/logger.js';

// Why this exists: every "Pay" click creates a `pending` order in OUR database
// *before* the customer reaches Stripe. Stripe only creates a payment once the
// customer actually submits a card on the hosted page — so a customer who opens
// checkout and walks away leaves a pending order here that never shows up in
// Stripe's Payments list. These helpers ask Stripe what really happened and
// settle the order: fulfil it if it was paid, mark it `abandoned` if not.

export interface StripeSnapshot {
  sessionId: string | null;
  sessionStatus: string | null; // open | complete | expired
  paymentStatus: string | null; // paid | unpaid | no_payment_required
  paymentIntentId: string | null;
  paymentIntentStatus: string | null;
  lastError: string | null; // e.g. card declined message
  livemode: boolean | null;
}

export async function stripeSnapshot(paymentRef: string | null): Promise<StripeSnapshot> {
  const empty: StripeSnapshot = {
    sessionId: null,
    sessionStatus: null,
    paymentStatus: null,
    paymentIntentId: null,
    paymentIntentStatus: null,
    lastError: null,
    livemode: null,
  };
  if (!stripe || !paymentRef) return empty;

  if (paymentRef.startsWith('pi_')) {
    const pi = await stripe.paymentIntents.retrieve(paymentRef);
    return {
      ...empty,
      paymentIntentId: pi.id,
      paymentIntentStatus: pi.status,
      paymentStatus: pi.status === 'succeeded' ? 'paid' : 'unpaid',
      lastError: pi.last_payment_error?.message ?? null,
      livemode: pi.livemode,
    };
  }
  if (!paymentRef.startsWith('cs_')) return empty;

  const session = await stripe.checkout.sessions.retrieve(paymentRef, { expand: ['payment_intent'] });
  const pi = session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null;
  return {
    sessionId: session.id,
    sessionStatus: session.status ?? null,
    paymentStatus: session.payment_status,
    paymentIntentId: pi?.id ?? (typeof session.payment_intent === 'string' ? session.payment_intent : null),
    paymentIntentStatus: pi?.status ?? null,
    lastError: pi?.last_payment_error?.message ?? null,
    livemode: session.livemode,
  };
}

/** Ask Stripe about one order and settle it. Returns the Stripe view + new status. */
export async function syncOrderWithStripe(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');

  if (!order.paymentRef) {
    return {
      order,
      stripe: null,
      verdict: 'No Stripe checkout was ever created for this order (the customer never reached the payment page).',
    };
  }

  const snap = await stripeSnapshot(order.paymentRef);
  let verdict = '';

  if (snap.paymentStatus === 'paid' && ['pending', 'abandoned'].includes(order.status)) {
    // Paid on Stripe but we never heard about it (missed webhook) — rescue it.
    if (order.status === 'abandoned') {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'pending' } });
    }
    try {
      await markPaidAndFulfill(order.id, snap.paymentIntentId ?? order.paymentRef);
      verdict = 'Customer had paid — order has now been fulfilled.';
    } catch (err) {
      verdict = `Customer had paid, but fulfillment failed: ${String(err)}`;
    }
  } else if (snap.paymentStatus === 'paid') {
    verdict = 'Paid on Stripe.';
  } else if (snap.sessionStatus === 'expired') {
    if (order.status === 'pending') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'abandoned',
          failureReason: snap.lastError
            ? `Checkout expired — last card error: ${snap.lastError}`
            : 'Checkout expired — the customer never completed payment.',
        },
      });
    }
    verdict = snap.lastError
      ? `Not paid. The customer tried but the card failed: "${snap.lastError}".`
      : 'Not paid. The customer opened Stripe checkout but never submitted a card, so Stripe has no payment for it.';
  } else if (snap.sessionStatus === 'open') {
    verdict = snap.lastError
      ? `Checkout still open. Last attempt failed: "${snap.lastError}".`
      : 'Checkout still open — customer has not paid (yet). Stripe will expire it after 24h.';
  } else {
    verdict = `Stripe status: ${snap.sessionStatus ?? snap.paymentIntentStatus ?? 'unknown'}.`;
  }

  const updated = await prisma.order.findUnique({ where: { id: order.id } });
  return { order: updated, stripe: snap, verdict };
}

/**
 * Periodic clean-up: settle pending orders whose Stripe session must be over
 * (sessions expire after 24h). Also catches paid orders whose webhook was lost.
 */
export async function sweepStaleOrders(): Promise<void> {
  if (!stripe) return;
  const cutoff = new Date(Date.now() - 25 * 3_600_000);
  const stale = await prisma.order.findMany({
    where: { status: 'pending', createdAt: { lte: cutoff } },
    select: { id: true, paymentRef: true },
    take: 100,
  });
  for (const o of stale) {
    try {
      if (!o.paymentRef) {
        await prisma.order.update({
          where: { id: o.id },
          data: { status: 'abandoned', failureReason: 'No Stripe checkout was created for this order.' },
        });
        continue;
      }
      await syncOrderWithStripe(o.id);
    } catch (err) {
      logger.warn('Stale order sweep failed for order', { orderId: o.id, err: String(err) });
    }
  }
  if (stale.length) logger.info('Stale order sweep done', { checked: stale.length });
}

/** Stripe told us a charge was refunded (e.g. from the Stripe dashboard). */
export async function markRefundedByPaymentIntent(paymentIntentId: string): Promise<void> {
  const order = await prisma.order.findFirst({ where: { paymentRef: paymentIntentId } });
  if (!order) return;
  if (order.status !== 'refunded') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'refunded', failureReason: order.failureReason ?? 'Refunded in Stripe' },
    });
  }
  await voidCommissionForOrder(order.id);
}
