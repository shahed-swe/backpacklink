'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';
import { Field, PayoutSelect } from '@/components/Field';
import type { Affiliate } from '@/lib/types';

interface Stats {
  clicks: number;
  clicks30: number;
  sales: number;
  revenue: number;
  conversionRate: number;
  earnings: { pending: number; approved: number; paid: number; total: number; paidOut: number };
  clicksByDay: { date: string; count: number }[];
  commissions: {
    id: string;
    packageName: string;
    orderAmount: number;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }[];
  minPayout: number;
  holdDays: number;
}

interface Payout {
  id: string;
  amount: number;
  currency: string;
  method: string | null;
  reference: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) return <p className="py-24 text-center text-ink/40">Loading…</p>;
  return <Inner />;
}

function Inner() {
  const { data, loading, reload } = useApi<{ data: Affiliate | null }>('/api/affiliate/me');
  const a = data?.data;

  if (loading) return <p className="py-24 text-center text-ink/40">Loading…</p>;
  if (!a) {
    return (
      <div className="container-bp py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold text-ink">You're not an affiliate yet</h1>
        <Link href="/join" className="btn-primary mt-6">Apply now</Link>
      </div>
    );
  }
  if (a.status === 'pending') {
    return (
      <div className="container-bp py-24 text-center">
        <p className="text-5xl">⏳</p>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">Application received</h1>
        <p className="mx-auto mt-2 max-w-md text-ink/60">
          Thanks, {a.name}! We're reviewing your application and will activate your link and discount code shortly.
          Check back here soon.
        </p>
      </div>
    );
  }
  if (a.status === 'rejected' || !a.active) {
    return (
      <div className="container-bp py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold text-ink">Your affiliate account isn't active</h1>
        <p className="mx-auto mt-2 max-w-md text-ink/60">Contact support@backpacklink.com if you think this is a mistake.</p>
      </div>
    );
  }
  return <Approved a={a} onProfileSaved={reload} />;
}

function Approved({ a, onProfileSaved }: { a: Affiliate; onProfileSaved: () => void }) {
  const { data: sRes } = useApi<{ data: Stats; currency: string }>('/api/affiliate/stats');
  const { data: pRes } = useApi<{ data: Payout[] }>('/api/affiliate/payouts');
  const s = sRes?.data;
  const cur = sRes?.currency ?? 'USD';
  const money = (v: number) => `${cur} ${v.toFixed(2)}`;
  const rate =
    a.commissionType === 'percent' ? `${a.commissionValue}% per sale` : a.commissionType === 'fixed' ? `${money(a.commissionValue ?? 0)} per sale` : '—';

  return (
    <div className="container-bp space-y-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Hi {a.name} 👋</h1>
          <p className="text-sm text-ink/50">Your commission: {rate}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CopyCard title="Your referral link" value={a.link} hint="Share it anywhere — sales within the referral window are credited to you." />
        {a.coupon ? (
          <CopyCard
            title="Your discount code"
            value={a.coupon.code}
            hint={`Your audience gets ${a.coupon.discountType === 'percent' ? `${a.coupon.discountValue}%` : money(a.coupon.discountValue)} off — works on the website and in the iOS/Android app, and the sale is credited to you.`}
          />
        ) : (
          <div className="card p-5 text-sm text-ink/50">No discount code is attached to your account. Ask us if you'd like one.</div>
        )}
      </div>

      <div className="card p-5">
        <p className="text-sm font-semibold text-ink/70">Link to a specific destination</p>
        <p className="mt-1 text-sm text-ink/50">
          Add <span className="font-mono">?ref={a.refCode}</span> to any BackpackLink page, e.g.{' '}
          <span className="break-all font-mono text-ink/70">{a.link.replace('/?ref=', '/esim/japan?ref=')}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clicks (all time)" value={s ? String(s.clicks) : '—'} sub={s ? `${s.clicks30} in last 30 days` : ''} />
        <Stat label="Sales" value={s ? String(s.sales) : '—'} sub={s ? `${s.conversionRate}% conversion` : ''} />
        <Stat label="Payable now" value={s ? money(s.earnings.approved) : '—'} sub={s ? `Paid at ${money(s.minPayout)}+` : ''} accent />
        <Stat label="Pending" value={s ? money(s.earnings.pending) : '—'} sub={s ? `${s.holdDays}-day refund hold` : ''} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Total earned" value={s ? money(s.earnings.total) : '—'} sub="pending + payable + paid" />
        <Stat label="Paid out to you" value={s ? money(s.earnings.paidOut) : '—'} sub={`${pRes?.data.length ?? 0} payouts`} />
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">Your sales</h2>
        {!s ? (
          <p className="mt-3 text-ink/40">Loading…</p>
        ) : s.commissions.length === 0 ? (
          <p className="mt-3 text-ink/50">No sales yet — share your link to get started!</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink/40">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3 text-right">Sale</th>
                  <th className="py-2 pr-3 text-right">You earn</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100/70">
                {s.commissions.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-3 text-ink/50">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 pr-3">{c.packageName}</td>
                    <td className="py-2.5 pr-3 text-right">{c.currency} {c.orderAmount.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold">{c.currency} {c.amount.toFixed(2)}</td>
                    <td className="py-2.5"><CommissionStatus status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pRes && pRes.data.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-ink">Payouts</h2>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-brand-100/70">
              {pRes.data.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 pr-3 text-ink/50">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="py-2.5 pr-3 font-semibold">{p.currency} {p.amount.toFixed(2)}</td>
                  <td className="py-2.5 pr-3">{p.method ?? '—'}</td>
                  <td className="py-2.5 font-mono text-xs text-ink/50">{p.reference ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PayoutSettings a={a} onSaved={onProfileSaved} />
    </div>
  );
}

function CommissionStatus({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ['Pending', 'bg-sand-100 text-ink/60'],
    approved: ['Payable', 'bg-coral-100 text-coral-700'],
    paid: ['Paid', 'bg-brand-50 text-brand-700'],
    void: ['Refunded', 'bg-sand-100 text-ink/40'],
  };
  const [label, cls] = map[status] ?? [status, 'bg-sand-100 text-ink/60'];
  return <span className={`chip ${cls}`}>{label}</span>;
}

function PayoutSettings({ a, onSaved }: { a: Affiliate; onSaved: () => void }) {
  const [method, setMethod] = useState(a.payoutMethod ?? 'paypal');
  const [details, setDetails] = useState(a.payoutDetails ?? '');
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    try {
      await apiFetch('/api/affiliate/me', { method: 'PATCH', body: { payoutMethod: method, payoutDetails: details } });
      setMsg('Saved.');
      onSaved();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-display text-lg font-bold text-ink">Payout details</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <PayoutSelect value={method} onChange={setMethod} />
        <Field label="PayPal / Wise email or IBAN" value={details} onChange={setDetails} />
      </div>
      <button onClick={save} className="btn-primary mt-4">Save</button>
      {msg && <p className="mt-3 text-sm font-medium text-brand-700">{msg}</p>}
    </div>
  );
}

function CopyCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-ink/70">{title}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 truncate rounded-xl bg-sand-100 px-3 py-2.5 text-sm text-ink">{value}</code>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(value).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="btn-primary px-4 py-2.5"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink/50">{hint}</p>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`card p-5 ${accent ? 'border-2 border-brand-300' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold text-ink">{value}</p>
      {sub && <p className="text-xs text-ink/40">{sub}</p>}
    </div>
  );
}
