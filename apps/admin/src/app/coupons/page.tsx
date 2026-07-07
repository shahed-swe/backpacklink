'use client';

import { useState } from 'react';
import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minSubtotal: number | null;
  maxRedemptions: number | null;
  perUserLimit: number | null;
  redemptions: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  influencer?: { id: string; name: string; refCode: string } | null;
}

interface Form {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  minSubtotal: string;
  maxRedemptions: string;
  perUserLimit: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
  influencerId: string;
}

const emptyForm: Form = {
  code: '', description: '', discountType: 'percent', discountValue: '', minSubtotal: '',
  maxRedemptions: '', perUserLimit: '1', active: true, startsAt: '', endsAt: '', influencerId: '',
};

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function Coupons() {
  const { data, loading, reload } = useApi<{ data: Coupon[] }>('/api/admin/coupons');
  const { data: infData } = useApi<{ data: { id: string; name: string; refCode: string }[] }>('/api/admin/influencers');
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startEdit(c: Coupon) {
    setEditingId(c.id);
    setForm({
      code: c.code, description: c.description ?? '', discountType: c.discountType,
      discountValue: String(c.discountValue),
      minSubtotal: c.minSubtotal == null ? '' : String(c.minSubtotal),
      maxRedemptions: c.maxRedemptions == null ? '' : String(c.maxRedemptions),
      perUserLimit: c.perUserLimit == null ? '' : String(c.perUserLimit),
      active: c.active, startsAt: toLocalInput(c.startsAt), endsAt: toLocalInput(c.endsAt),
      influencerId: c.influencer?.id ?? '',
    });
    setMsg(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.code.trim()) { setMsg('Code is required.'); return; }
    setBusy(true); setMsg(null);
    const body = {
      code: form.code.trim().toUpperCase(),
      description: form.description || null,
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      minSubtotal: form.minSubtotal === '' ? null : Number(form.minSubtotal),
      maxRedemptions: form.maxRedemptions === '' ? null : Number(form.maxRedemptions),
      perUserLimit: form.perUserLimit === '' ? null : Number(form.perUserLimit),
      active: form.active,
      // Local datetime-local value -> absolute UTC instant (timezone-correct).
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      influencerId: form.influencerId || null,
    };
    try {
      if (editingId) await apiFetch(`/api/admin/coupons/${editingId}`, { method: 'PATCH', body });
      else await apiFetch('/api/admin/coupons', { method: 'POST', body });
      setMsg(editingId ? 'Coupon updated.' : 'Coupon created.');
      resetForm();
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally { setBusy(false); }
  }

  async function toggle(c: Coupon) {
    try {
      await apiFetch(`/api/admin/coupons/${c.id}`, { method: 'PATCH', body: { active: !c.active } });
      reload();
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Update failed'); }
  }

  async function remove(c: Coupon) {
    if (typeof window !== 'undefined' && !window.confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await apiFetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' });
      if (editingId === c.id) resetForm();
      reload();
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Delete failed'); }
  }

  const coupons = data?.data ?? [];
  const discountLabel = (c: Coupon) => (c.discountType === 'percent' ? `${c.discountValue}%` : `${c.discountValue} off`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">Coupons</h1>
        <span className="hidden text-sm text-ink/50 sm:block">Discount codes for campaigns &amp; influencers</span>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">{editingId ? 'Edit coupon' : 'New coupon'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Text label="Code" value={form.code} onChange={(v) => set('code', v.toUpperCase())} />
          <Select label="Discount type" value={form.discountType}
            onChange={(v) => set('discountType', v as Form['discountType'])}
            options={[['percent', 'Percentage (%)'], ['fixed', 'Fixed amount']]} />
          <Text label={form.discountType === 'percent' ? 'Percent off' : 'Amount off'} value={form.discountValue} onChange={(v) => set('discountValue', v)} type="number" />
          <Text label="Min order (blank = none)" value={form.minSubtotal} onChange={(v) => set('minSubtotal', v)} type="number" />
          <Text label="Max total uses (blank = ∞)" value={form.maxRedemptions} onChange={(v) => set('maxRedemptions', v)} type="number" />
          <Text label="Uses per customer (blank = ∞)" value={form.perUserLimit} onChange={(v) => set('perUserLimit', v)} type="number" />
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Link to influencer (optional)</span>
            <select
              value={form.influencerId}
              onChange={(e) => set('influencerId', e.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 outline-none focus:border-brand-500"
            >
              <option value="">None</option>
              {(infData?.data ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.refCode})
                </option>
              ))}
            </select>
          </label>
          <Text label="Description (internal)" value={form.description} onChange={(v) => set('description', v)} full />
          <Text label="Starts at (optional)" value={form.startsAt} onChange={(v) => set('startsAt', v)} type="datetime-local" />
          <Text label="Ends at (optional)" value={form.endsAt} onChange={(v) => set('endsAt', v)} type="datetime-local" />
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-ink/70">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            Active
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? 'Saving…' : editingId ? 'Update coupon' : 'Create coupon'}
          </button>
          {editingId && <button onClick={resetForm} className="btn-ghost">Cancel</button>}
        </div>
        {msg && <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{msg}</p>}
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">All coupons</h2>
        {loading ? (
          <p className="mt-3 text-ink/40">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="mt-3 text-ink/50">No coupons yet — create one above.</p>
        ) : (
          <div className="mt-3 divide-y divide-brand-100/70">
            {coupons.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="chip bg-ink text-white font-mono">{c.code}</span>
                <span className="font-semibold text-ink">{discountLabel(c)}</span>
                {c.influencer && <span className="text-xs text-ink/40">→ {c.influencer.name}</span>}
                <div className="min-w-0 flex-1">
                  {c.description && <p className="truncate text-sm text-ink/50">{c.description}</p>}
                </div>
                <span className="text-xs text-ink/50">
                  {c.redemptions}
                  {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ' used'}
                </span>
                <span className={`chip ${c.active ? 'bg-brand-50 text-brand-700' : 'bg-coral-100 text-coral-700'}`}>{c.active ? 'Active' : 'Off'}</span>
                <button onClick={() => toggle(c)} className="text-sm font-semibold text-ink/60 hover:text-ink">{c.active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => startEdit(c)} className="text-sm font-semibold text-brand-700 hover:text-brand-800">Edit</button>
                <button onClick={() => remove(c)} className="text-sm font-semibold text-coral-600 hover:text-coral-700">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Text({ label, value, onChange, type = 'text', full }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; full?: boolean;
}) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm font-semibold text-ink/70">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink/70">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 outline-none focus:border-brand-500"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
