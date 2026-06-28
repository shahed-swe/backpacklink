'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';

interface Settings {
  markupPercent: number;
  lowBalanceThreshold: number;
  currency: string;
  fulfillmentMode: string;
}

export default function Settings() {
  const { data, loading, reload } = useApi<{ data: Settings }>('/api/admin/settings');
  const [markup, setMarkup] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data?.data) setMarkup(String(data.data.markupPercent));
  }, [data]);

  if (loading) return <p className="text-ink/40">Loading…</p>;
  const s = data?.data;
  if (!s) return <p className="text-ink/50">Could not load settings.</p>;

  const pct = Number(markup) || 0;
  const exampleRetail = (10 * (1 + pct / 100)).toFixed(2);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch('/api/admin/settings', { method: 'POST', body: { markupPercent: Number(markup) } });
      setMsg('Saved — catalog prices updated everywhere.');
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function refreshCatalog() {
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch('/api/admin/catalog/refresh', { method: 'POST' });
      setMsg('Catalog cache cleared — fresh prices pulled from the provider.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Refresh failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-ink">Pricing & Settings</h1>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">Pricing</h2>
        <p className="mt-1 text-sm text-ink/60">
          Set your markup over the wholesale price. Applies to every plan across the website and app
          instantly.
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Markup %</span>
            <div className="mt-1 flex items-center">
              <input
                type="number"
                min={0}
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                className="w-32 rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500"
              />
              <span className="ml-2 text-lg font-bold text-ink/40">%</span>
            </div>
          </label>
          <div className="rounded-xl bg-sand-50 px-4 py-3 text-sm">
            <p className="text-ink/50">Example</p>
            <p className="font-semibold text-ink">
              {s.currency} 10.00 wholesale →{' '}
              <span className="text-brand-700">
                {s.currency} {exampleRetail} retail
              </span>
            </p>
          </div>
          <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? 'Saving…' : 'Save pricing'}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">Catalog</h2>
        <p className="mt-1 text-sm text-ink/60">
          Clear the cache to pull the latest packages and provider prices immediately.
        </p>
        <button onClick={refreshCatalog} disabled={busy} className="btn-dark mt-4">
          Refresh catalog now
        </button>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">System</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
          <Row label="Currency" value={s.currency} />
          <Row label="Low-balance alert" value={`${s.currency} ${s.lowBalanceThreshold}`} />
          <Row label="Fulfillment mode" value={s.fulfillmentMode} />
        </dl>
      </div>

      {msg && <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{msg}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sand-50 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/40">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}
