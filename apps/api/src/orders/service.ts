import { prisma } from '../lib/db.js';
import { catalog } from '../catalog/service.js';
import { fulfillOrder } from './fulfillment.js';

export async function createOrderForPackage(userId: string, packageId: string) {
  const pkg = await catalog.packageDetail(packageId);
  if (!pkg) throw new Error('Package not found');

  const order = await prisma.order.create({
    data: {
      userId,
      providerPackageId: pkg.id,
      packageName: pkg.name,
      packageType: pkg.type,
      retailPrice: pkg.price.retail,
      wholesalePrice: pkg.price.wholesale,
      currency: pkg.price.currency,
      status: 'pending',
      paymentProvider: 'stripe',
    },
  });
  return { order, pkg };
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
  await prisma.order.updateMany({
    where: { id: orderId, status: 'pending' },
    data: { status: 'paid', paymentRef: paymentRef ?? undefined },
  });
  return fulfillOrder(orderId);
}
