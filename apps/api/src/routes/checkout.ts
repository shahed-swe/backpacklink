import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/db.js';
import { createOrderForPackage, markPaidAndFulfill } from '../orders/service.js';
import { resolveInfluencerIdByRef } from '../influencers/service.js';
import { createCheckoutSession, stripe } from '../payments/stripe.js';
import { stripeEnabled, env } from '../env.js';

export const checkoutRouter = Router();
checkoutRouter.use(requireAuth);

const schema = z.object({
  packageId: z.string().min(1),
  couponCode: z.string().max(80).optional(),
  // Attribution captured on the storefront (ref link + UTM + referrer).
  ref: z.string().max(80).optional(),
  source: z.string().max(120).optional(),
  medium: z.string().max(120).optional(),
  campaign: z.string().max(120).optional(),
  referrer: z.string().max(300).optional(),
});

// POST /api/checkout — create an order and start payment.
checkoutRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { packageId, couponCode, ref, source, medium, campaign, referrer } = schema.parse(req.body);
    const influencerId = await resolveInfluencerIdByRef(ref);
    const { order, pkg } = await createOrderForPackage(req.userId!, packageId, {
      couponCode,
      influencerId,
      source,
      medium,
      campaign,
      referrer,
    });

    if (stripeEnabled()) {
      let session: Awaited<ReturnType<typeof createCheckoutSession>>;
      try {
        session = await createCheckoutSession({
        orderId: order.id,
        packageName: pkg.name,
        amount: order.retailPrice, // discounted price when a coupon applied
        currency: pkg.price.currency,
        customerEmail: req.userEmail!,
        successUrl: `${env.WEB_URL}/account/orders/${order.id}?paid=1`,
        cancelUrl: `${env.WEB_URL}/plans/${pkg.id}`,
        });
      } catch (err) {
        // Record WHY there is no Stripe payment instead of a silent "pending" order.
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'failed', failureReason: `Stripe checkout could not be created: ${String(err)}` },
        });
        throw err;
      }
      // Remember the session so we can confirm payment without relying on a webhook.
      await prisma.order.update({ where: { id: order.id }, data: { paymentRef: session.id } });
      return res.json({ ok: true, orderId: order.id, mode: 'stripe', checkoutUrl: session.url });
    }

    // Dev fallback — no Stripe keys yet.
    res.json({
      ok: true,
      orderId: order.id,
      mode: 'dev-simulate',
      message: 'Stripe not configured. POST /api/checkout/:id/simulate-pay to complete the order.',
    });
  }),
);

// POST /api/checkout/:id/simulate-pay — dev-only: complete payment + fulfill.
checkoutRouter.post(
  '/:id/simulate-pay',
  asyncHandler(async (req, res) => {
    if (stripeEnabled()) {
      return res.status(400).json({ ok: false, error: 'Stripe is live — use the real checkout flow.' });
    }
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order || order.userId !== req.userId) {
      return res.status(404).json({ ok: false, error: 'Order not found' });
    }
    const result = await markPaidAndFulfill(order.id, 'dev-simulated');
    const esim = result.esimId
      ? await prisma.esim.findUnique({ where: { id: result.esimId } })
      : null;
    res.json({ ok: true, order: result, esim });
  }),
);

// POST /api/checkout/:id/confirm — verify the Stripe payment and fulfill.
// Webhook-free path (works in local dev); idempotent with the webhook.
checkoutRouter.post(
  '/:id/confirm',
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { esim: true },
    });
    if (!order || order.userId !== req.userId) {
      return res.status(404).json({ ok: false, error: 'Order not found' });
    }
    if (order.status === 'completed') return res.json({ ok: true, order });

    // Only Stripe-session orders can be confirmed this way.
    if (!stripe || !order.paymentRef?.startsWith('cs_')) {
      return res.json({ ok: true, order, pending: order.status !== 'completed' });
    }

    const session = await stripe.checkout.sessions.retrieve(order.paymentRef);
    if (session.payment_status !== 'paid') {
      return res.json({ ok: true, order, pending: true });
    }

    await markPaidAndFulfill(order.id, (session.payment_intent as string) ?? order.paymentRef);
    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { esim: true },
    });
    res.json({ ok: true, order: updated });
  }),
);

// GET /api/checkout/:id — poll order status after payment.
checkoutRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { esim: true },
    });
    if (!order || order.userId !== req.userId) {
      return res.status(404).json({ ok: false, error: 'Order not found' });
    }
    res.json({ ok: true, order });
  }),
);
