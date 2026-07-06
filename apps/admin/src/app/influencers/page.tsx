'use client';

import { useState } from 'react';
import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://backpacklink.com';

interface Influencer {
  id: string;
  name: string;
  handle: string | null;
  platform: string | null;
  email: string | null;
  refCode: string;
  commissionType: 'percent' | 'fixed' | null;
  commissionValue: number | null;
  active: boolean;
  _count?: { coupons: number; orders: number };
}

interface Report {
  id: string;
  orders: number;
  revenue: number;
  profit: number;
  commission: number;
}

interface Form {
  name: string;
  handle: string;
  platform: string;
  email: string;
  refCode: string;
  commissionType: '' | 'percent' | 'fixed';
  commissionValue: string;
  active: boolean;
}

const emptyForm: Form = {
  name: '', handle: '', platform: '', email: '', refCode: '',
  commissionType: 'percent', commissionValue: '', active: true,
};

export default function Influencers() {
  const { data, loading, reload } = useApi<{ data: Influencer[] }>('/api/admin/influencers');
  const { data: rep, reload: reloadRep } = useApi<{ data: Report[]; currency: string }>('/api/admin/reports/influencers');
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const cur = rep?.currency ?? 'USD';
  const perf = new Map((rep?.data ?? []).map((r) => [r.id, r]));

  function startEdit(inf: Influencer) {
    setEditingId(inf.id);
    setForm({
      name: inf.name, handle: inf.handle ?? '', platform: inf.platform ?? '', email: inf.email ?? '',
      refCode: inf.refCode, commissionType: inf.commissionType ?? '',
      commissionValue: inf.commissionValue == null ? '' : String(inf.commissionValue), active: inf.active,
    });
    setMsg(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.name.trim()) { setMsg('Name is required.'); return; }
    setBusy(true); setMsg(null);
    const body = {
      name: form.name.trim(),
      handle: form.handle || null,
      platform: form.platform || null,
      email: form.email || null,
      refCode: form.refCode.trim() || null,
      commissionType: form.commissionType || null,
      commissionValue: form.commissionValue === '' ? null : Number(form.commissionValue),
      active: form.active,
    };
    try {
      if (editingId) await apiFetch(`/api/admin/influencers/${editingId}`, { method: 'PATCH', body });
      else await apiFetch('/api/admin/influencers', { method: 'POST', body });
      setMsg(editingId ? 'Influencer updated.' : 'Influencer created.');
      resetForm();
      reload(); reloadRep();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally { setBusy(false); }
  }

  async function toggle(inf: Influencer) {
    try {
      await apiFetch(`/api/admin/influencers/${inf.id}`, { method: 'PATCH', body: { active: !inf.active } });
      reload();
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Update failed'); }
  }

  async function remove(inf: Influencer) {
    if (typeof window !== 'undefined' && !window.confirm(`Delete ${inf.name}? Their past sales stay but lose attribution.`)) return;
    try {
      await apiFetch(`/api/admin/influencers/${inf.id}`, { method: 'DELETE' });
      if (editingId === inf.id) resetForm();
      reload(); reloadRep();
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Delete failed'); }
  }

  function copyLink(refCode: string) {
    const link = `${WEB_URL}/?ref=${refCode}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(refCode);
        setTimeout(() => setCopied(null), 1500);
      });
    }
  }

  const influencers = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">Influencers</h1>
        <span className="hidden text-sm text-ink/50 sm:block">Track who drives sales · share ?ref= links</span>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">{editingId ? 'Edit influencer' : 'New influencer'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Text label="Name" value={form.name} onChange={(v) => set('name', v)} />
          <Text label="Handle (@)" value={form.handle} onChange={(v) => set('handle', v)} />
          <Text label="Platform (instagram, youtube…)" value={form.platform} onChange={(v) => set('platform', v)} />
          <Text label="Email" value={form.email} onChange={(v) => set('email', v)} />
          <Text label="Ref code (blank = auto)" value={form.refCode} onChange={(v) => set('refCode', v.toUpperCase())} />
          <div className="grid grid-cols-2 gap-2">
            <Select label="Commission" value={form.commissionType} onChange={(v) => set('commissionType', v as Form['commissionType'])}
              options={[['', 'None'], ['percent', 'Percent'], ['fixed', 'Fixed / sale']]} />
            <Text label="Value" value={form.commissionValue} onChange={(v) => set('commissionValue', v)} type="number" />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-ink/70">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            Active
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? 'Saving…' : editingId ? 'Update influencer' : 'Create influencer'}
          </button>
          {editingId && <button onClick={resetForm} className="btn-ghost">Cancel</button>}
        </div>
        {msg && <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{msg}</p>}
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">Roster &amp; performance</h2>
        {loading ? (
          <p className="mt-3 text-ink/40">Loading…</p>
        ) : influencers.length === 0 ? (
          <p className="mt-3 text-ink/50">No influencers yet — add one above.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink/40">
                  <th className="py-2 pr-3">Influencer</th>
                  <th className="py-2 pr-3">Ref link</th>
                  <th className="py-2 pr-3 text-right">Orders</th>
                  <th className="py-2 pr-3 text-right">Revenue</th>
                  <th className="py-2 pr-3 text-right">Profit</th>
                  <th className="py-2 pr-3 text-right">Commission</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100/70">
                {influencers.map((inf) => {
                  const p = perf.get(inf.id);
                  return (
                    <tr key={inf.id} className={inf.active ? '' : 'opacity-50'}>
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold text-ink">{inf.name}</p>
                        <p className="text-xs text-ink/40">
                          {inf.platform ?? ''} {inf.handle ?? ''}
                          {inf.commissionType ? ` · ${inf.commissionValue}${inf.commissionType === 'percent' ? '%' : '/sale'}` : ''}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3">
                        <button onClick={() => copyLink(inf.refCode)} className="chip bg-sand-100 font-mono text-ink/70 hover:bg-sand-200">
                          {copied === inf.refCode ? 'Copied!' : `?ref=${inf.refCode}`}
                        </button>
                      </td>
                      <td className="py-2.5 pr-3 text-right">{p?.orders ?? 0}</td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-ink">{cur} {(p?.revenue ?? 0).toFixed(2)}</td>
                      <td className="py-2.5 pr-3 text-right text-brand-700">{cur} {(p?.profit ?? 0).toFixed(2)}</td>
                      <td className="py-2.5 pr-3 text-right text-coral-600">{cur} {(p?.commission ?? 0).toFixed(2)}</td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <button onClick={() => toggle(inf)} className="text-xs font-semibold text-ink/60 hover:text-ink">{inf.active ? 'Disable' : 'Enable'}</button>
                        <button onClick={() => startEdit(inf)} className="ml-3 text-xs font-semibold text-brand-700">Edit</button>
                        <button onClick={() => remove(inf)} className="ml-3 text-xs font-semibold text-coral-600">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Text({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <label className="block">
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
