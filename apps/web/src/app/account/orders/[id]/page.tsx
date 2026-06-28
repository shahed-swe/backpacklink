'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { StatusBadge } from '@/components/StatusBadge';
import { useApi } from '@/lib/use-api';

interface Order {
  id: string;
  packageName: string;
  retailPrice: number;
  currency: string;
  status: string;
  esimId: string | null;
  failureReason: string | null;
}

export default function OrderPage() {
  return (
    <AuthGate>
      <OrderDetail />
    </AuthGate>
  );
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, reload } = useApi<{ order: Order }>(`/api/checkout/${id}`);
  const order = data?.order;

  // Poll while payment is still settling / the eSIM is being provisioned.
  // (After a Stripe redirect the status can briefly be "pending" until the
  // webhook fires.)
  useEffect(() => {
    if (order && ['pending', 'paid', 'fulfilling'].includes(order.status)) {
      const t = setTimeout(reload, 2500);
      return () => clearTimeout(t);
    }
  }, [order, reload]);

  if (loading) return <div className="container-bp py-24 text-center text-ink/40">Loading…</div>;
  if (!order) return <div className="container-bp py-24 text-center text-ink/50">Order not found.</div>;

  const done = order.status === 'completed';
  const failed = order.status === 'failed';

  return (
    <div className="container-bp py-16">
      <div className="mx-auto max-w-lg card p-8 text-center">
        <p className="text-5xl">{done ? '🎉' : failed ? '⚠️' : '⏳'}</p>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">
          {done ? 'Your eSIM is ready!' : failed ? 'Something went wrong' : 'Preparing your eSIM…'}
        </h1>
        <p className="mt-2 text-sm text-ink/60">{order.packageName}</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="font-display font-bold text-ink">
            {order.currency} {order.retailPrice.toFixed(2)}
          </span>
          <StatusBadge status={order.status} />
        </div>

        {failed && order.failureReason && (
          <p className="mt-4 rounded-xl bg-coral-50 px-4 py-3 text-sm text-coral-700">
            {order.failureReason}
          </p>
        )}

        <div className="mt-7">
          {done && order.esimId ? (
            <Link href={`/account/esims/${order.esimId}`} className="btn-primary w-full">
              View & install eSIM
            </Link>
          ) : (
            <Link href="/account" className="btn-ghost w-full">
              Go to my account
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
