'use client';

import { useMemo, useState } from 'react';
import { useApi } from '@/lib/use-api';
import { SalesChart } from '@/components/SalesChart';

type Range = '7' | '30' | '90' | 'all';
const RANGES: [Range, string][] = [['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['all', 'All time']];

interface Totals { revenue: number; profit: number; discount: number; orders: number; avgOrder: number }
interface Point { date: string; revenue: number; profit: number; orders: number }
interface Sales { series: Point[]; totals: Totals }
interface InflRow { id: string; name: string; revenue: number; orders: number; commission: number }
interface SourceRow { source: string; revenue: number; orders: number }
interface CouponRow { id: string; code: string; uses: number; revenue: number; discountGiven: number }
interface Overview { reseller: { balance: number | null; threshold: number; lowBalance: boolean } }

export default function Dashboard() {
  const [range, setRange] = useState<Range>('30');
  const qs = useMemo(() => {
    if (range === 'all') return '';
    const from = new Date(Date.now() - Number(range) * 86400000).toISOString();
    return `?from=${from}`;
  }, [range]);

  const { data: salesRes, loading } = useApi<{ data: Sales; currency: string }>(`/api/admin/reports/sales${qs}`);
  const { data: inflRes } = useApi<{ data: InflRow[] }>(`/api/admin/reports/influencers${qs}`);
  const { data: srcRes } = useApi<{ data: SourceRow[] }>(`/api/admin/reports/sources${qs}`);
  const { data: cpnRes } = useApi<{ data: CouponRow[] }>(`/api/admin/reports/coupons${qs}`);
  const { data: ovRes } = useApi<{ data: Overview }>('/api/admin/overview');

  const cur = salesRes?.currency ?? 'USD';
  const t = salesRes?.data.totals;
  const money = (v: number) => `${cur} ${v.toFixed(2)}`;

  const influencers = (inflRes?.data ?? []).filter((r) => r.orders > 0).slice(0, 6);
  const sources = (srcRes?.data ?? []).slice(0, 6);
  const coupons = (cpnRes?.data ?? []).filter((c) => c.uses > 0).slice(0, 6);
  const ov = ovRes?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-ink">Sales Dashboard</h1>
        <div className="flex gap-1 rounded-full bg-white p-1 shadow-card">
          {RANGES.map(([v, label]) => (
            <button
              key={v}
              onClick={() => setRange(v)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                range === v ? 'bg-lagoon text-white' : 'text-ink/50 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {ov?.reseller.lowBalance && (
        <div className="rounded-2xl bg-coral-50 p-4 text-sm font-semibold text-coral-700">
          ⚠️ Reseller balance is low ({money(ov.reseller.balance ?? 0)}) — top up to keep fulfilling orders.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Revenue" value={t ? money(t.revenue) : '—'} accent />
        <Stat label="Profit" value={t ? money(t.profit) : '—'} accent />
        <Stat label="Orders" value={t ? String(t.orders) : '—'} />
        <Stat label="Avg order" value={t ? money(t.avgOrder) : '—'} />
        <Stat label="Discounts given" value={t ? money(t.discount) : '—'} />
      </div>

      <div className="card p-6">
        <h2 className="font-display font-bold text-ink">Revenue &amp; profit over time</h2>
        <div className="mt-4">
          {loading ? (
            <p className="py-8 text-center text-ink/40">Loading…</p>
          ) : (
            <SalesChart series={salesRes?.data.series ?? []} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarCard title="Top influencers" empty="No influencer sales yet." cur={cur}
          rows={influencers.map((r) => ({ label: r.name, value: r.revenue, sub: `${r.orders} orders` }))} />
        <BarCard title="Top traffic sources" empty="No attributed sales yet." cur={cur}
          rows={sources.map((r) => ({ label: r.source, value: r.revenue, sub: `${r.orders} orders` }))} />
      </div>

      <div className="card p-6">
        <h2 className="font-display font-bold text-ink">Coupon performance</h2>
        {coupons.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">No coupons redeemed in this period.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink/40">
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3 text-right">Uses</th>
                  <th className="py-2 pr-3 text-right">Revenue</th>
                  <th className="py-2 text-right">Discount given</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100/70">
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-3"><span className="chip bg-ink font-mono text-white">{c.code}</span></td>
                    <td className="py-2.5 pr-3 text-right">{c.uses}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold text-ink">{money(c.revenue)}</td>
                    <td className="py-2.5 text-right text-coral-600">{money(c.discountGiven)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`card p-5 ${accent ? 'bg-lagoon text-white' : ''}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${accent ? 'text-white/70' : 'text-ink/40'}`}>{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function BarCard({ title, rows, cur, empty }: {
  title: string; empty: string; cur: string; rows: { label: string; value: number; sub: string }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="card p-6">
      <h2 className="font-display font-bold text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink/50">{empty}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink">{r.label}</span>
                <span className="text-ink/60">{cur} {r.value.toFixed(2)} · {r.sub}</span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-sand-100">
                <div className="h-full rounded-full bg-lagoon" style={{ width: `${Math.max(3, (r.value / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
