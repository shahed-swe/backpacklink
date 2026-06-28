'use client';

import { useApi } from '@/lib/use-api';

interface Overview {
  users: number;
  ordersByStatus: Record<string, number>;
  sales: { count: number; revenue: number; cost: number; profit: number; currency: string };
  reseller: { balance: number | null; threshold: number; lowBalance: boolean };
  markupPercent: number;
  fulfillmentMode: string;
}

export default function Overview() {
  const { data, loading } = useApi<{ data: Overview }>('/api/admin/overview');
  if (loading) return <p className="text-ink/40">Loading…</p>;
  const o = data?.data;
  if (!o) return <p className="text-ink/50">Could not load overview.</p>;
  const cur = o.sales.currency;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-ink">Overview</h1>

      {o.reseller.lowBalance && (
        <div className="rounded-2xl bg-coral-50 p-4 text-sm font-semibold text-coral-700">
          ⚠️ Reseller balance is low ({cur} {o.reseller.balance}). Top up esimcard to keep fulfilling
          orders.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={`${cur} ${o.sales.revenue.toFixed(2)}`} accent />
        <Stat label="Profit" value={`${cur} ${o.sales.profit.toFixed(2)}`} accent />
        <Stat label="Wholesale cost" value={`${cur} ${o.sales.cost.toFixed(2)}`} />
        <Stat label="Completed sales" value={String(o.sales.count)} />
        <Stat label="Customers" value={String(o.users)} />
        <Stat
          label="Reseller balance"
          value={o.reseller.balance == null ? '—' : `${cur} ${o.reseller.balance.toFixed(2)}`}
          warn={o.reseller.lowBalance}
        />
        <Stat label="Markup" value={`${o.markupPercent}%`} />
        <Stat label="Fulfillment" value={o.fulfillmentMode} />
      </div>

      <div className="card p-6">
        <h2 className="font-display font-bold text-ink">Orders by status</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(o.ordersByStatus).length === 0 ? (
            <p className="text-sm text-ink/50">No orders yet.</p>
          ) : (
            Object.entries(o.ordersByStatus).map(([status, count]) => (
              <div key={status} className="rounded-xl bg-sand-50 px-4 py-2">
                <span className="font-display text-xl font-bold text-ink">{count}</span>
                <span className="ml-2 text-sm text-ink/50">{status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={`card p-5 ${accent ? 'bg-lagoon text-white' : ''} ${warn ? 'ring-2 ring-coral-400' : ''}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${accent ? 'text-white/70' : 'text-ink/40'}`}>
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}
