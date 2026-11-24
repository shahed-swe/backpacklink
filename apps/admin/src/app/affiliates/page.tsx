'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';
import { StatusBadge } from '@/components/StatusBadge';

interface Affiliate {
  id: string;
  name: string;
  email: string | null;
  loginEmail: string | null;
  handle: string | null;
  platform: string | null;
  website: string | null;
  audience: string | null;
  country: string | null;
  refCode: string;
  status: string;
  active: boolean;
  commissionType: string | null;
  commissionValue: number | null;
  payoutMethod: string | null;
  payoutDetails: string | null;
  createdAt: string;
  clicks: number;
  sales: number;
  revenue: number;
  pending: number;
  approved: number;
  paid: number;
}

interface Commission {
  id: string;
  amount: number;
  orderAmount: number;
  currency: string;
  status: string;
  note: string | null;
  createdAt: string;
  influencer: { name: string; refCode: string };
  order: { packageName: string; user: { email: string } | null };
}

interface Payout {
  id: string;
  amount: number;
  currency: string;
  method: string | null;
  reference: string | null;
  createdAt: string;
  influencer: { name: string; refCode: string };
  _count: { commissions: number };
}

interface Program {
  open: boolean;
  autoApprove: boolean;
  commissionPercent: number;
  customerDiscountPercent: number;
  holdDays: number;
  minPayout: number;
  cookieDays: number;
}

type Tab = 'applications' | 'affiliates' | 'commissions' | 'payouts' | 'settings';
const TABS: [Tab, string][] = [
  ['applications', 'Applications'],
  ['affiliates', 'Affiliates & balances'],
  ['commissions', 'Commissions'],
  ['payouts', 'Payouts'],
  ['settings', 'Program settings'],
];

export default function AffiliatesPage() {
  const [tab, setTab] = useState<Tab>('applications');
  const { data: pend } = useApi<{ data: Affiliate[] }>('/api/admin/affiliates?status=pending');
  const pendingCount = pend?.data.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-ink">Affiliate Program</h1>
        <a
          href="https://affiliate.backpacklink.com"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-brand-700 underline"
        >
          affiliate.backpacklink.com ↗
        </a>
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
            {label}
            {v === 'applications' && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-coral-500 px-1.5 text-xs text-white">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>
      {tab === 'applications' && <Applications />}
      {tab === 'affiliates' && <Affiliates />}
      {tab === 'commissions' && <Commissions />}
      {tab === 'payouts' && <Payouts />}
      {tab === 'settings' && <Settings />}
    </div>
  );
}

function Applications() {
  const { data, loading, reload } = useApi<{ data: Affiliate[] }>('/api/admin/affiliates?status=pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function act(a: Affiliate, action: 'approve' | 'reject') {
    setBusy(a.id);
    setMsg(null);
    try {
      await apiFetch(`/api/admin/affiliates/${a.id}/${action}`, { method: 'POST', body: {} });
      setMsg(action === 'approve' ? `${a.name} approved — their link and discount code are live.` : `${a.name} rejected.`);
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  const rows = data?.data ?? [];
  return (
    <div className="card p-6">
      <h2 className="font-display text-lg font-bold text-ink">Pending applications</h2>
      {msg && <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{msg}</p>}
      {loading ? (
        <p className="mt-3 text-ink/40">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-ink/50">No applications waiting. New sign-ups from affiliate.backpacklink.com appear here.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {rows.map((a) => (
            <div key={a.id} className="rounded-2xl border border-brand-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {a.name} <span className="text-sm font-normal text-ink/50">{a.loginEmail ?? a.email}</span>
                  </p>
                  <p className="text-sm text-ink/60">
                    {[a.platform, a.handle, a.country].filter(Boolean).join(' · ') || '—'}
                  </p>
                  {a.website && (
                    <a href={a.website.startsWith('http') ? a.website : `https://${a.website}`} target="_blank" rel="noreferrer" className="text-sm text-brand-700 underline">
                      {a.website}
                    </a>
                  )}
                  {a.audience && <p className="mt-2 max-w-2xl whitespace-pre-line text-sm text-ink/70">{a.audience}</p>}
                  <p className="mt-2 text-xs text-ink/40">Applied {new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => act(a, 'approve')} disabled={busy === a.id} className="btn-primary px-4 py-2 disabled:opacity-50">
                    Approve
                  </button>
                  <button onClick={() => act(a, 'reject')} disabled={busy === a.id} className="btn-ghost px-4 py-2 disabled:opacity-50">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Affiliates() {
  const { data, loading, reload } = useApi<{ data: Affiliate[]; currency: string }>('/api/admin/affiliates');
  const [paying, setPaying] = useState<Affiliate | null>(null);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const cur = data?.currency ?? 'USD';
  const rows = (data?.data ?? []).filter((a) => a.status !== 'pending');

  async function pay() {
    if (!paying) return;
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch(`/api/admin/affiliates/${paying.id}/payouts`, {
        method: 'POST',
        body: { reference: reference || undefined, method: paying.payoutMethod ?? undefined },
      });
      setMsg(`Recorded payout of ${cur} ${paying.approved.toFixed(2)} to ${paying.name}.`);
      setPaying(null);
      setReference('');
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Payout failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(a: Affiliate) {
    try {
      if (a.status !== 'approved') await apiFetch(`/api/admin/affiliates/${a.id}/approve`, { method: 'POST', body: {} });
      else await apiFetch(`/api/admin/influencers/${a.id}`, { method: 'PATCH', body: { active: !a.active } });
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Update failed');
    }
  }

  return (
    <div className="space-y-4">
      {paying && (
        <div className="card border-2 border-brand-300 p-6">
          <h2 className="font-display text-lg font-bold text-ink">Pay {paying.name}</h2>
          <p className="mt-1 text-sm text-ink/60">
            Send <b>{cur} {paying.approved.toFixed(2)}</b> via <b>{paying.payoutMethod ?? 'their method'}</b>
            {paying.payoutDetails ? <> to <span className="font-mono">{paying.payoutDetails}</span></> : ' (no payout details on file — ask them)'}.
            Then record it here — this marks all their approved commissions as paid.
          </p>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Transaction reference (optional)"
            className="mt-3 w-full max-w-md rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500"
          />
          <div className="mt-4 flex gap-2">
            <button onClick={pay} disabled={busy} className="btn-primary disabled:opacity-50">
              {busy ? 'Saving…' : 'Mark as paid'}
            </button>
            <button onClick={() => setPaying(null)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}
      {msg && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{msg}</p>}
      <div className="card p-6">
        <p className="text-sm text-ink/50">
          <b>Pending</b> = inside the refund hold period · <b>Payable</b> = ready to pay · <b>Paid</b> = already paid out.
          Commission rates can be changed per affiliate on the Influencers page.
        </p>
        {loading ? (
          <p className="mt-3 text-ink/40">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="mt-3 text-ink/50">No affiliates yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink/40">
                  <th className="py-2 pr-3">Affiliate</th>
                  <th className="py-2 pr-3 text-right">Clicks</th>
                  <th className="py-2 pr-3 text-right">Sales</th>
                  <th className="py-2 pr-3 text-right">Revenue</th>
                  <th className="py-2 pr-3 text-right">Pending</th>
                  <th className="py-2 pr-3 text-right">Payable</th>
                  <th className="py-2 pr-3 text-right">Paid</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100/70">
                {rows.map((a) => (
                  <tr key={a.id} className={a.active && a.status === 'approved' ? '' : 'opacity-50'}>
                    <td className="py-2.5 pr-3">
                      <p className="font-semibold text-ink">
                        {a.name} {a.status !== 'approved' && <StatusBadge status={a.status} />}
                      </p>
                      <p className="text-xs text-ink/40">
                        {a.refCode}
                        {a.commissionType ? ` · ${a.commissionValue}${a.commissionType === 'percent' ? '%' : '/sale'}` : ' · no commission'}
                        {a.loginEmail ? ' · self-serve' : ' · admin-created'}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3 text-right">{a.clicks}</td>
                    <td className="py-2.5 pr-3 text-right">{a.sales}</td>
                    <td className="py-2.5 pr-3 text-right">{cur} {a.revenue.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-right text-ink/50">{a.pending.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold text-coral-600">{a.approved.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-right text-brand-700">{a.paid.toFixed(2)}</td>
                    <td className="whitespace-nowrap py-2.5 text-right">
                      {a.approved > 0 && (
                        <button onClick={() => setPaying(a)} className="text-xs font-semibold text-brand-700">Pay out</button>
                      )}
                      <button onClick={() => toggle(a)} className="ml-3 text-xs font-semibold text-ink/60 hover:text-ink">
                        {a.status !== 'approved' ? 'Approve' : a.active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
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

function Commissions() {
  const [status, setStatus] = useState('');
  const { data, loading, reload } = useApi<{ data: Commission[]; currency: string }>(
    `/api/admin/affiliates/commissions${status ? `?status=${status}` : ''}`,
  );
  const rows = data?.data ?? [];

  async function setTo(c: Commission, s: 'approved' | 'void') {
    if (s === 'void' && typeof window !== 'undefined' && !window.confirm('Void this commission? The affiliate will not be paid for it.')) return;
    await apiFetch(`/api/admin/affiliates/commissions/${c.id}`, { method: 'PATCH', body: { status: s } }).catch(() => {});
    reload();
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap gap-2">
        {[['', 'All'], ['pending', 'Pending'], ['approved', 'Payable'], ['paid', 'Paid'], ['void', 'Void']].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)} className={`chip ${status === v ? 'bg-ink text-white' : 'bg-sand-100 text-ink/60'}`}>
            {l}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="mt-3 text-ink/40">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-ink/50">No commissions yet. They are created automatically when an attributed order completes.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Affiliate</th>
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3 text-right">Sale</th>
                <th className="py-2 pr-3 text-right">Commission</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100/70">
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 pr-3 text-ink/50">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="py-2.5 pr-3 font-semibold">{c.influencer.name}</td>
                  <td className="py-2.5 pr-3">
                    {c.order.packageName}
                    <p className="text-xs text-ink/40">{c.order.user?.email}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-right">{c.currency} {c.orderAmount.toFixed(2)}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold">{c.currency} {c.amount.toFixed(2)}</td>
                  <td className="py-2.5 pr-3"><StatusBadge status={c.status === 'approved' ? 'payable' : c.status} /></td>
                  <td className="whitespace-nowrap py-2.5 text-right">
                    {c.status === 'pending' && (
                      <button onClick={() => setTo(c, 'approved')} className="text-xs font-semibold text-brand-700">Approve now</button>
                    )}
                    {(c.status === 'pending' || c.status === 'approved') && (
                      <button onClick={() => setTo(c, 'void')} className="ml-3 text-xs font-semibold text-coral-600">Void</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Payouts() {
  const { data, loading } = useApi<{ data: Payout[] }>('/api/admin/affiliates/payouts');
  const rows = data?.data ?? [];
  return (
    <div className="card p-6">
      {loading ? (
        <p className="text-ink/40">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-ink/50">No payouts recorded yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink/40">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Affiliate</th>
              <th className="py-2 pr-3 text-right">Amount</th>
              <th className="py-2 pr-3">Method</th>
              <th className="py-2 pr-3">Reference</th>
              <th className="py-2 text-right">Commissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100/70">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="py-2.5 pr-3 text-ink/50">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="py-2.5 pr-3 font-semibold">{p.influencer.name}</td>
                <td className="py-2.5 pr-3 text-right font-semibold">{p.currency} {p.amount.toFixed(2)}</td>
                <td className="py-2.5 pr-3">{p.method ?? '—'}</td>
                <td className="py-2.5 pr-3 font-mono text-xs">{p.reference ?? '—'}</td>
                <td className="py-2.5 text-right">{p._count.commissions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Settings() {
  const { data, reload } = useApi<{ data: Program }>('/api/admin/affiliates/program');
  const [form, setForm] = useState<Program | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (data?.data) setForm(data.data);
  }, [data]);
  if (!form) return <p className="text-ink/40">Loading…</p>;

  const num = (k: keyof Program, label: string, hint: string) => (
    <label className="block">
      <span className="text-sm font-semibold text-ink/70">{label}</span>
      <input
        type="number"
        value={String(form[k])}
        onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })}
        className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500"
      />
      <span className="text-xs text-ink/40">{hint}</span>
    </label>
  );
  const bool = (k: 'open' | 'autoApprove', label: string) => (
    <label className="flex items-center gap-2 text-sm font-semibold text-ink/70">
      <input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} />
      {label}
    </label>
  );

  async function save() {
    setMsg(null);
    try {
      await apiFetch('/api/admin/affiliates/program', { method: 'PATCH', body: form });
      setMsg('Saved.');
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    }
  }

  return (
    <div className="card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {num('commissionPercent', 'Default commission (%)', 'Applied to new affiliates. Override per affiliate on the Influencers page.')}
        {num('customerDiscountPercent', 'Buyer discount on affiliate codes (%)', 'Each approved affiliate gets a personal code with this discount. 0 = no code.')}
        {num('holdDays', 'Hold period (days)', 'Commissions become payable after this many days (refund window).')}
        {num('minPayout', 'Minimum payout', 'Shown to affiliates; pay out once their payable balance reaches this.')}
        {num('cookieDays', 'Referral window (days)', 'How long a ?ref= link keeps credit (shown on the portal).')}
      </div>
      <div className="mt-5 space-y-2">
        {bool('open', 'Accepting new applications')}
        {bool('autoApprove', 'Auto-approve applications (skip manual review)')}
      </div>
      <button onClick={save} className="btn-primary mt-5">Save settings</button>
      {msg && <p className="mt-3 text-sm font-medium text-brand-700">{msg}</p>}
    </div>
  );
}
