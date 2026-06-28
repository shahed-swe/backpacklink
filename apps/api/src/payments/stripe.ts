import Stripe from 'stripe';
import { env, stripeEnabled } from '../env.js';

// Null when no real Stripe key is configured (dev). Checkout falls back to a
// simulate-payment path so the full purchase->fulfillment flow is testable.
export const stripe = stripeEnabled() ? new Stripe(env.STRIPE_SECRET_KEY) : null;

interface CheckoutArgs {
  orderId: string;
  packageName: string;
  amount: number; // retail, major units
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/** Refund a payment after a fulfillment failure. Returns true if a refund was issued. */
export async function refundByPaymentIntent(paymentIntentId: string): Promise<boolean> {
  if (!stripe) return false;
  await stripe.refunds.create({ payment_intent: paymentIntentId });
  return true;
}

export async function createCheckoutSession(args: CheckoutArgs): Promise<{ url: string | null; id: string }> {
  if (!stripe) throw new Error('Stripe is not configured');
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: args.customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: args.currency.toLowerCase(),
          unit_amount: Math.round(args.amount * 100),
          product_data: { name: args.packageName },
        },
      },
    ],
    metadata: { orderId: args.orderId },
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
  });
  return { url: session.url, id: session.id };
}
