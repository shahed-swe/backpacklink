'use client';

import Link from 'next/link';
import { AuthGate } from '@/components/AuthGate';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/lib/auth';
import { useApi } from '@/lib/use-api';

interface EsimRow {
  id: string;
  iccid: string;
  status: string;
  lastBundle: string | null;
  createdAt: string;
}
interface OrderRow {
  id: string;
  packageName: string;
  retailPrice: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function AccountPage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const esims = useApi<{ data: EsimRow[] }>('/api/me/esims');
  const orders = useApi<{ data: OrderRow[] }>('/api/me/orders');

  return (
    <div className="container-bp py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-coral-500">Your account</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-ink">
            Hi {user?.name?.split(' ')[0] ?? 'traveler'} 👋
          </h1>
        </div>
        <button onClick={logout} className="btn-ghost">
          Sign out
        </button>
      </div>

      {/* profile */}
      <div className="mt-8 card p-6">
        <h2 className="font-display font-bold text-ink">Profile</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Info label="Email" value={user?.email ?? '—'} />
          <Info label="Phone" value={user?.phone ?? '—'} />
          <Info label="Country" value={user?.country ?? '—'} />
        </div>
      </div>

      {/* eSIMs */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-2xl font-extrabold text-ink">My eSIMs</h2>
        <Link href="/destinations" className="text-sm font-semibold text-brand-700 hover:underline">
          + Buy another
        </Link>
      </div>

      {esims.loading ? (
        <p className="mt-4 text-ink/40">Loading…</p>
      ) : !esims.data?.data.length ? (
        <div className="mt-4 card p-10 text-center">
          <p className="text-4xl">🎒</p>
          <p className="mt-3 font-semibold text-ink">No eSIMs yet</p>
          <p className="text-sm text-ink/60">Your eSIMs will show up here right after purchase.</p>
          <Link href="/destinations" className="btn-primary mt-5">
            Browse plans
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {esims.data.data.map((e) => (
            <Link key={e.id} href={`/account/esims/${e.id}`} className="card group p-5 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="flex items-center justify-between">
                <span className="chip bg-brand-50 text-brand-700">{e.status}</span>
                <span className="text-xs text-ink/40">{new Date(e.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-3 font-display font-bold text-ink">{e.lastBundle ?? 'eSIM'}</p>
              <p className="mt-1 font-mono text-xs text-ink/50">ICCID {e.iccid}</p>
              <p className="mt-4 text-sm font-semibold text-brand-700 group-hover:underline">
                View & install →
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* orders */}
      <h2 className="mt-12 font-display text-2xl font-extrabold text-ink">Order history</h2>
      <div className="mt-4 card divide-y divide-brand-100">
        {orders.loading ? (
          <p className="p-6 text-ink/40">Loading…</p>
        ) : !orders.data?.data.length ? (
          <p className="p-6 text-ink/50">No orders yet.</p>
        ) : (
          orders.data.data.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold text-ink">{o.packageName}</p>
                <p className="text-xs text-ink/40">{new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-ink">
                  {o.currency} {o.retailPrice.toFixed(2)}
                </p>
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sand-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-0.5 truncate font-medium text-ink">{value}</p>
    </div>
  );
}
