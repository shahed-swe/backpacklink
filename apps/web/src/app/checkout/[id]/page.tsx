'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';

interface Pkg {
  id: string;
  name: string;
  data: { quantity: number; unit: string; unlimited: boolean };
  validity: { quantity: number; unit: string };
  price: { retail: number; currency: string };
}

export default function CheckoutPage() {
  return (
    <AuthGate>
      <Checkout />
    </AuthGate>
  );
}

function Checkout() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, loading } = useApi<{ data: Pkg }>(`/api/catalog/packages/${id}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ orderId: string; mode: string; checkoutUrl?: string }>(
        '/api/checkout',
        { method: 'POST', body: { packageId: id } },
      );
      if (res.mode === 'stripe' && res.checkoutUrl) {
        window.location.href = res.checkoutUrl; // hosted Stripe checkout
        return;
      }
      // Dev mode — simulate the payment then go to the order page.
      await apiFetch(`/api/checkout/${res.orderId}/simulate-pay`, { method: 'POST' });
      router.push(`/account/orders/${res.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setBusy(false);
    }
  }

  if (loading) return <div className="container-bp py-24 text-center text-ink/40">Loading…</div>;
  const pkg = data?.data;
  if (!pkg) return <div className="container-bp py-24 text-center text-ink/50">Plan not found.</div>;

  return (
    <div className="container-bp py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-2xl font-extrabold text-ink">Checkout</h1>

        <div className="mt-6 card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-ink">{pkg.name}</p>
              <p className="text-sm text-ink/50">
                {pkg.data.unlimited ? 'Unlimited' : `${pkg.data.quantity} ${pkg.data.unit}`} ·{' '}
                {pkg.validity.quantity} {pkg.validity.unit.toLowerCase()}s
              </p>
            </div>
            <p className="font-display text-2xl font-extrabold text-ink">
              {pkg.price.currency} {pkg.price.retail.toFixed(2)}
            </p>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
              {error}
            </p>
          )}

          <button onClick={pay} disabled={busy} className="btn-primary mt-6 w-full disabled:opacity-60">
            {busy ? 'Processing…' : `Pay ${pkg.price.currency} ${pkg.price.retail.toFixed(2)}`}
          </button>
          <p className="mt-3 text-center text-xs text-ink/40">
            Secure card payment · instant eSIM delivery
          </p>
        </div>
      </div>
    </div>
  );
}
