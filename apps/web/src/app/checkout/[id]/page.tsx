'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';
import { getAttribution } from '@/lib/attribution';

interface Pkg {
  id: string;
  name: string;
  data: { quantity: number; unit: string; unlimited: boolean };
  validity: { quantity: number; unit: string };
  price: { retail: number; currency: string };
}

interface CouponResult {
  valid: boolean;
  reason?: string;
  discountAmount: number;
  finalPrice: number;
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
  const [couponInput, setCouponInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [coupon, setCoupon] = useState<CouponResult | null>(null);

  const pkg = data?.data;
  const base = pkg?.price.retail ?? 0;
  const total = coupon?.valid ? coupon.finalPrice : base;

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code || !pkg) return;
    setApplying(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: CouponResult }>('/api/coupons/validate', {
        method: 'POST',
        body: { code, packageId: pkg.id },
      });
      setCoupon(res.data);
    } catch (err) {
      setCoupon({
        valid: false,
        reason: err instanceof Error ? err.message : 'Could not apply coupon',
        discountAmount: 0,
        finalPrice: base,
      });
    } finally {
      setApplying(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput('');
  }

  async function pay() {
    if (!pkg) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ orderId: string; mode: string; checkoutUrl?: string }>(
        '/api/checkout',
        {
          method: 'POST',
          body: {
            packageId: id,
            couponCode: coupon?.valid ? couponInput.trim() : undefined,
            ...getAttribution(),
          },
        },
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
  if (!pkg) return <div className="container-bp py-24 text-center text-ink/50">Plan not found.</div>;
  const cur = pkg.price.currency;
  const discounted = coupon?.valid ?? false;

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
            <p
              className={
                discounted
                  ? 'font-display text-lg font-bold text-ink/40 line-through'
                  : 'font-display text-2xl font-extrabold text-ink'
              }
            >
              {cur} {base.toFixed(2)}
            </p>
          </div>

          {/* Coupon */}
          <div className="mt-5">
            {discounted ? (
              <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm">
                <span className="font-semibold text-brand-700">
                  Coupon applied — you save {cur} {coupon!.discountAmount.toFixed(2)}
                </span>
                <button onClick={removeCoupon} className="font-semibold text-brand-700 underline">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 rounded-xl border border-brand-200 px-4 py-2.5 uppercase outline-none focus:border-brand-500"
                />
                <button
                  onClick={applyCoupon}
                  disabled={applying || !couponInput.trim()}
                  className="btn-ghost disabled:opacity-50"
                >
                  {applying ? 'Checking…' : 'Apply'}
                </button>
              </div>
            )}
            {coupon && !coupon.valid && coupon.reason && (
              <p className="mt-2 text-sm text-coral-600">{coupon.reason}</p>
            )}
          </div>

          {discounted && (
            <div className="mt-4 flex items-center justify-between border-t border-brand-100 pt-4">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-display text-2xl font-extrabold text-ink">
                {cur} {total.toFixed(2)}
              </span>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
              {error}
            </p>
          )}

          <button onClick={pay} disabled={busy} className="btn-primary mt-6 w-full disabled:opacity-60">
            {busy ? 'Processing…' : `Pay ${cur} ${total.toFixed(2)}`}
          </button>
          <p className="mt-3 text-center text-xs text-ink/40">
            Secure card payment · instant eSIM delivery
          </p>
        </div>
      </div>
    </div>
  );
}
