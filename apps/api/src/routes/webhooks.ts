import { Router } from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { stripe } from '../payments/stripe.js';
import { env } from '../env.js';
import { prisma } from '../lib/db.js';
import { markPaidAndFulfill } from '../orders/service.js';
import { logger } from '../lib/logger.js';
import { markRefundedByPaymentIntent } from '../orders/reconcile.js';

export const webhookRouter = Router();

// POST /api/webhooks/stripe — mounted with express.raw (needs the raw body).
webhookRouter.post('/stripe', async (req: Request, res: Response) => {
  if (!stripe) return res.status(400).send('Stripe not configured');

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed', { err: String(err) });
    return res.status(400).send(`Webhook Error: ${String(err)}`);
  }

  // Idempotency — ignore replays of an event we've already processed.
  try {
    await prisma.webhookEvent.create({ data: { id: event.id, type: event.type } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      logger.info('Duplicate Stripe webhook ignored', { id: event.id });
      return res.json({ received: true, duplicate: true });
    }
    logger.warn('Could not record webhook event id', { err: String(e) });
    // Fall through — the atomic fulfillment claim still prevents double-provision.
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: { orderId?: string }; payment_intent?: string; id: string };
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await markPaidAndFulfill(orderId, (session.payment_intent as string) ?? session.id);
        logger.info('Stripe payment completed -> fulfilled', { orderId });
      }
    } else if (event.type === 'checkout.session.expired') {
      // Customer opened checkout but never paid — close the order out.
      const session = event.data.object as { metadata?: { orderId?: string } };
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.updateMany({
          where: { id: orderId, status: 'pending' },
          data: { status: 'abandoned', failureReason: 'Checkout expired — the customer never completed payment.' },
        });
      }
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as { payment_intent?: string | null; refunded?: boolean };
      if (charge.payment_intent && charge.refunded) await markRefundedByPaymentIntent(charge.payment_intent);
    }
  } catch (err) {
    // Don't 500 to Stripe (it would retry forever); log for manual reconciliation.
    logger.error('Webhook fulfillment error', { err: String(err) });
  }

  res.json({ received: true });
});
