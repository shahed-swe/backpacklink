import type { Order } from '@prisma/client';
import { prisma } from '../lib/db.js';
import { env, stripeEnabled } from '../env.js';
import { esimcard } from '../esimcard/service.js';
import { normalizeEsim } from '../esimcard/normalize.js';
import { refundByPaymentIntent } from '../payments/stripe.js';
import { logger } from '../lib/logger.js';

interface EsimRecord {
  providerEsimId: string;
  iccid: string;
  status: string;
  lastBundle: string | null;
  qrCodeText: string | null;
  smdpAddress: string | null;
  matchingId: string | null;
  universalLinkIos: string | null;
  universalLinkAndroid: string | null;
  pukCode: string | null;
  apn: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Provisions the eSIM for a PAID order and maps it to the customer in our DB.
 * Safe to call once per paid order; idempotent on already-completed orders.
 */
export async function fulfillOrder(orderId: string): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error(`Order ${orderId} not found`);
  if (order.status === 'completed') return order;

  // Atomically claim the order: only one caller can move paid -> fulfilling.
  // This prevents a webhook + client (or two webhooks) double-provisioning,
  // which would double-charge the reseller balance.
  const claim = await prisma.order.updateMany({
    where: { id: orderId, status: 'paid' },
    data: { status: 'fulfilling' },
  });
  if (claim.count === 0) {
    const current = await prisma.order.findUnique({ where: { id: orderId } });
    if (!current) throw new Error(`Order ${orderId} not found`);
    // Already done, or another worker is mid-purchase — return and let the
    // caller poll. Crucially we do NOT start a second provider purchase.
    if (current.status === 'completed' || current.status === 'fulfilling') return current;
    throw new Error(`Order ${orderId} is not payable (status: ${current.status})`);
  }

  try {
    const record =
      env.FULFILLMENT_MODE === 'live' ? await purchaseLive(order) : mockPurchase(order);

    // Create the eSIM mapping + complete the order in one transaction so we
    // never end up with an orphan eSIM or a "completed" order without an eSIM.
    const updated = await prisma.$transaction(async (tx) => {
      const esim = await tx.esim.create({ data: { userId: order.userId, ...record } });
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'completed', esimId: esim.id, providerOrderRef: record.providerEsimId },
      });
    });
    logger.info('Order fulfilled', { orderId, esimId: updated.esimId, mode: env.FULFILLMENT_MODE });
    return updated;
  } catch (err) {
    logger.error('Fulfillment failed', { orderId, err: String(err) });

    // Auto-refund the customer if this was a real Stripe payment — never strand
    // a paying customer without an eSIM.
    let status = 'failed';
    let note = String(err);
    const refundable =
      stripeEnabled() && order.paymentProvider === 'stripe' && order.paymentRef?.startsWith('pi_');
    if (refundable) {
      try {
        await refundByPaymentIntent(order.paymentRef!);
        status = 'refunded';
        note = `Auto-refunded after fulfillment failure: ${String(err)}`;
        logger.info('Auto-refund issued', { orderId, paymentRef: order.paymentRef });
      } catch (refundErr) {
        note = `Fulfillment failed AND refund failed — manual action needed: ${String(err)} | refund error: ${String(refundErr)}`;
        logger.error('Auto-refund failed', { orderId, err: String(refundErr) });
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status, failureReason: note },
    });
    throw err;
  }
}

// --- LIVE: real purchase against the reseller balance ---
async function purchaseLive(order: Order): Promise<EsimRecord> {
  // Balance guard — never attempt a purchase we can't cover.
  const balance = await esimcard.getBalance();
  if (balance.balance < order.wholesalePrice) {
    throw new Error(
      `Insufficient reseller balance ($${balance.balance} < $${order.wholesalePrice}). Top up esimcard.`,
    );
  }

  // Snapshot existing eSIM ids so we can detect the newly-created one (delayed case).
  const before = new Set((await esimcard.getMyEsims()).data?.map((e) => String(e.id)) ?? []);

  const res =
    order.packageType === 'DATA-VOICE-SMS'
      ? await esimcard.purchaseDataVoiceSms(order.providerPackageId)
      : await esimcard.purchaseDataOnly(order.providerPackageId);

  const data = (res.data ?? {}) as Record<string, unknown>;
  const sim = data['sim'] as Record<string, unknown> | undefined;

  let simId: string | null = sim?.['id'] ? String(sim['id']) : null;

  // Delayed purchase: poll My eSIMs (~2 min) for the new sim id.
  if (!simId || data['sim_applied'] === false) {
    simId = await pollForNewSim(before);
  }
  if (!simId) throw new Error('Purchase succeeded but no eSIM id was returned');

  // The /my-esims list carries the full install payload (qr, smdp, links).
  const all = await esimcard.getMyEsims();
  const raw = all.data?.find((e) => String(e.id) === simId);
  if (!raw) throw new Error('Provisioned eSIM not found in My eSIMs');

  return toRecord(raw);
}

async function pollForNewSim(before: Set<string>, attempts = 12, intervalMs = 12_000): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    await sleep(intervalMs);
    const list = await esimcard.getMyEsims();
    const fresh = list.data?.find((e) => !before.has(String(e.id)));
    if (fresh) return String(fresh.id);
  }
  return null;
}

function toRecord(raw: Record<string, unknown>): EsimRecord {
  const e = normalizeEsim(raw);
  return {
    providerEsimId: e.id,
    iccid: e.iccid,
    status: e.status,
    lastBundle: e.lastBundle,
    qrCodeText: e.install.qrCodeText,
    smdpAddress: e.install.smdpAddress,
    matchingId: e.install.matchingId,
    universalLinkIos: e.install.universalLinkIos,
    universalLinkAndroid: e.install.universalLinkAndroid,
    pukCode: e.install.pukCode,
    apn: e.apn,
  };
}

// --- MOCK: fabricate an eSIM so the flow is testable without spending balance ---
function mockPurchase(order: Order): EsimRecord {
  const digits = Array.from(order.id).reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 1e12, 7);
  const iccid = '8985234' + String(digits).padStart(13, '0').slice(0, 13);
  const matchingId = order.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
  const lpa = `LPA:1$consumer.rsp.world$${matchingId}`;
  return {
    providerEsimId: `mock-${order.id}`,
    iccid,
    status: 'Released',
    lastBundle: order.packageName,
    qrCodeText: lpa,
    smdpAddress: 'consumer.rsp.world',
    matchingId,
    universalLinkIos: `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpa)}`,
    universalLinkAndroid: `https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpa)}`,
    pukCode: null,
    apn: 'globaldata',
  };
}

export const isMockEsim = (providerEsimId: string) => providerEsimId.startsWith('mock-');
