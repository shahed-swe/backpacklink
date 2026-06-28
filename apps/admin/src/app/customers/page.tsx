'use client';

import { useApi } from '@/lib/use-api';

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  country: string | null;
  role: string;
  createdAt: string;
  _count: { orders: number; esims: number };
}

export default function Customers() {
  const { data, loading } = useApi<{ data: Customer[] }>('/api/admin/customers');
  if (loading) return <p className="text-ink/40">Loading…</p>;
  const customers = data?.data ?? [];

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-brand-100 p-4">
        <h1 className="font-display font-bold text-ink">Customers ({customers.length})</h1>
      </div>
      <div className="divide-y divide-brand-100">
        {customers.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-ink">
                {c.name ?? 'Unnamed'}{' '}
                {c.role === 'admin' && <span className="chip bg-ink text-white">admin</span>}
              </p>
              <p className="text-xs text-ink/40">
                {c.email}
                {c.phone ? ` · ${c.phone}` : ''}
                {c.country ? ` · ${c.country}` : ''}
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-ink/60">
                <b className="text-ink">{c._count.esims}</b> eSIMs
              </span>
              <span className="text-ink/60">
                <b className="text-ink">{c._count.orders}</b> orders
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
