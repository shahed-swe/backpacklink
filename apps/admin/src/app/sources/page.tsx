'use client';

import { useApi } from '@/lib/use-api';

interface SourceRow {
  source: string;
  orders: number;
  revenue: number;
  profit: number;
}

export default function Sources() {
  const { data, loading } = useApi<{ data: SourceRow[]; currency: string }>('/api/admin/reports/sources');
  const cur = data?.currency ?? 'USD';
  const rows = data?.data ?? [];
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">Traffic Sources</h1>
        <span className="hidden text-sm text-ink/50 sm:block">Which sites &amp; campaigns drive sales</span>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">Revenue by source</h2>
        {loading ? (
          <p className="mt-3 text-ink/40">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-ink/50">No attributed sales yet. Tag links with ?utm_source= or ?ref= to track them.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((r) => (
              <div key={r.source}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{r.source}</span>
                  <span className="text-ink/60">
                    {cur} {r.revenue.toFixed(2)} · {r.orders} orders
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-sand-100">
                  <div
                    className="h-full rounded-full bg-lagoon"
                    style={{ width: `${Math.max(3, (r.revenue / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-ink">Breakdown</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink/40">
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3 text-right">Orders</th>
                  <th className="py-2 pr-3 text-right">Revenue</th>
                  <th className="py-2 pr-3 text-right">Profit</th>
                  <th className="py-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100/70">
                {rows.map((r) => (
                  <tr key={r.source}>
                    <td className="py-2.5 pr-3 font-semibold text-ink">{r.source}</td>
                    <td className="py-2.5 pr-3 text-right">{r.orders}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold text-ink">{cur} {r.revenue.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-right text-brand-700">{cur} {r.profit.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-ink/50">
                      {totalRev ? ((r.revenue / totalRev) * 100).toFixed(0) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
