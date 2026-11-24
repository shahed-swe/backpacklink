'use client';

import { useState } from 'react';
import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';
import { StatusBadge } from '@/components/StatusBadge';

interface AdminOrder {
  id: string;
  packageName: string;
  retailPrice: number;
  wholesalePrice: number;
  discountAmount: number;
  couponCode: string | null;
  currency: string;
  status: string;
  paymentRef: string | null;
  failureReason: string | null;
  source: string | null;
  createdAt: string;
  user: { email: string; name: string | null } | null;
  esim: { iccid: string; status: string } | null;
  influencer: { name: string; refCode: string } | null;
}

interface SyncResult {
  verdict: string;
  stripe: { sessionStatus: string | null; paymentStatus: string | null; lastError: string | null; livemode: boolean | null } | null;
}

const TABS: [string, string][] = [
  ['all', 'All'],
  ['completed', 'Completed'],
  ['pending', 'Awaiting payment'],
  ['abandoned', 'Abandoned'],
  ['failed', 'Failed / refunded'],
];

// Plain-English explanation per status, so "pending" isn't mistaken for a sale.
const EXPLAIN: Record<string, string> = {
  pending: 'Customer clicked Pay but has not paid on Stripe (yet). Not a sale — Stripe has no payment until a card is submitted.',
  abandoned: 'Checkout expired without payment. Not a sale — nothing was charged.',
  paid: 'Paid — eSIM being provisioned.',
  fulfilling: 'Paid — eSIM being provisioned.',
  failed: 'Not completed.',
  refunded: 'Customer was refunded.',
};

export default function Orders() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const qs = `?status=${tab}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
  const { data, loading, reload } = useApi<{ data: AdminOrder[]; counts: Record<string, number> }>(`/api/admin/orders${qs}`);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, SyncResult | { error: string }>>({});

  const orders = data?.data ?? [];
  const counts = data?.counts ?? {};
  const countFor = (t: string) =>
    t === 'all'
      ? Object.values(counts).reduce((a, b) => a + b, 0)
      : t === 'failed'
        ? (counts.failed ?? 0) + (counts.refunded ?? 0)
        : counts[t] ?? 0;

  async function sync(id: string) {
    setSyncing(id);
    try {
      const r = await apiFetch<SyncResult>(`/api/admin/orders/${id}/sync`, { method: 'POST' });
      setResults((m) => ({ ...m, [id]: r }));
      reload();
    } catch (e) {
      setResults((m) => ({ ...m, [id]: { error: e instanceof Error ? e.message : 'Stripe check failed' } }));
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-ink">Orders</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email, order id or Stripe ref"
            className="w-64 rounded-xl border border-brand-200 px-4 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button className="btn-ghost px-4 py-2">Search</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-1 rounded-full bg-white p-1 shadow-card">
        {TABS.map(([v, label]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              tab === v ? 'bg-lagoon text-white' : 'text-ink/50 hover:text-ink'
            }`}
          >
            {label} <span className="opacity-60">({countFor(v)})</span>
          </button>
        ))}
      </div>

      {(tab === 'pending' || tab === 'abandoned') && (
        <div className="rounded-2xl bg-sand-100 p-4 text-sm text-ink/70">
          These are <b>unpaid checkouts</b>, not sales. An order is saved here the moment a customer clicks
          “Pay”; Stripe only records a payment once they actually submit a card. Use <b>Check Stripe</b> to
          see exactly what happened — paid orders are fulfilled automatically, expired ones are marked abandoned.
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-ink/40">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-ink/50">No orders here.</p>
        ) : (
          <div className="divide-y divide-brand-100">
            {orders.map((o) => {
              const isSale = ['completed', 'paid', 'fulfilling'].includes(o.status);
              const r = results[o.id];
              return (
                <div key={o.id} className={`p-4 ${isSale ? '' : 'bg-sand-50/60'}`}>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:items-center">
                    <div className="sm:col-span-2">
                      <p className="font-semibold text-ink">{o.packageName}</p>
                      <p className="text-xs text-ink/40">{o.user?.email ?? '—'}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-ink/30">{o.id}</p>
                    </div>
                    <div className="text-sm">
                      <p className={`font-semibold ${isSale ? 'text-ink' : 'text-ink/40'}`}>
                        {o.currency} {o.retailPrice.toFixed(2)}
                      </p>
                      {isSale ? (
                        <p className="text-xs text-brand-600">+{(o.retailPrice - o.wholesalePrice).toFixed(2)} profit</p>
                      ) : (
                        <p className="text-xs text-ink/40">not charged</p>
                      )}
                      {o.couponCode && <p className="text-xs text-ink/40">code {o.couponCode}</p>}
                      {o.influencer && <p className="text-xs text-ink/40">via {o.influencer.name}</p>}
                    </div>
                    <div className="font-mono text-xs text-ink/50">{o.esim?.iccid ?? '—'}</div>
                    <div className="text-right">
                      <StatusBadge status={o.status} />
                      <p className="mt-1 text-xs text-ink/40">{new Date(o.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {!isSale && o.status !== 'completed' && (
                    <div className="mt-3 flex flex-wrap items-start justify-between gap-3 rounded-xl bg-white p-3 text-xs text-ink/60">
                      <div className="max-w-2xl space-y-1">
                        <p>{o.failureReason ?? EXPLAIN[o.status] ?? ''}</p>
                        <p className="font-mono text-ink/40">
                          Stripe ref: {o.paymentRef ?? 'none — checkout was never created'}
                        </p>
                        {r && 'verdict' in r && (
                          <p className="font-semibold text-brand-700">
                            Stripe says: {r.verdict}
                            {r.stripe?.livemode === false ? ' (TEST mode key!)' : ''}
                          </p>
                        )}
                        {r && 'error' in r && <p className="font-semibold text-coral-700">{r.error}</p>}
                      </div>
                      {o.paymentRef && (
                        <button
                          onClick={() => sync(o.id)}
                          disabled={syncing === o.id}
                          className="btn-ghost px-4 py-1.5 text-xs disabled:opacity-50"
                        >
                          {syncing === o.id ? 'Checking…' : 'Check Stripe'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
