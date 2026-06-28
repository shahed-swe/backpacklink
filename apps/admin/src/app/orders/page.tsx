'use client';

import { useApi } from '@/lib/use-api';
import { StatusBadge } from '@/components/StatusBadge';

interface AdminOrder {
  id: string;
  packageName: string;
  retailPrice: number;
  wholesalePrice: number;
  currency: string;
  status: string;
  createdAt: string;
  user: { email: string; name: string | null } | null;
  esim: { iccid: string; status: string } | null;
}

export default function Orders() {
  const { data, loading } = useApi<{ data: AdminOrder[] }>('/api/admin/orders');
  if (loading) return <p className="text-ink/40">Loading…</p>;
  const orders = data?.data ?? [];

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-brand-100 p-4">
        <h1 className="font-display font-bold text-ink">Orders ({orders.length})</h1>
      </div>
      {orders.length === 0 ? (
        <p className="p-6 text-ink/50">No orders yet.</p>
      ) : (
        <div className="divide-y divide-brand-100">
          {orders.map((o) => (
            <div key={o.id} className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-5 sm:items-center">
              <div className="sm:col-span-2">
                <p className="font-semibold text-ink">{o.packageName}</p>
                <p className="text-xs text-ink/40">{o.user?.email ?? '—'}</p>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-ink">
                  {o.currency} {o.retailPrice.toFixed(2)}
                </p>
                <p className="text-xs text-brand-600">
                  +{(o.retailPrice - o.wholesalePrice).toFixed(2)} profit
                </p>
              </div>
              <div className="font-mono text-xs text-ink/50">{o.esim?.iccid ?? '—'}</div>
              <div className="text-right">
                <StatusBadge status={o.status} />
                <p className="mt-1 text-xs text-ink/40">{new Date(o.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
