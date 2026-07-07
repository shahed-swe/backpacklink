'use client';

import { useState, type ChangeEvent } from 'react';
import { useApi } from '@/lib/use-api';
import { apiFetch, uploadFile } from '@/lib/client-api';

interface Promotion {
  id: string;
  kind: 'bar' | 'banner';
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  bgColor: string | null;
  textColor: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  couponCode: string | null;
  placement: 'web' | 'mobile' | 'both';
  priority: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

interface Form {
  kind: 'bar' | 'banner';
  title: string;
  subtitle: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
  ctaLabel: string;
  ctaUrl: string;
  couponCode: string;
  placement: 'web' | 'mobile' | 'both';
  priority: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
}

const emptyForm: Form = {
  kind: 'banner', title: '', subtitle: '', imageUrl: '', bgColor: '', textColor: '',
  ctaLabel: '', ctaUrl: '', couponCode: '', placement: 'both', priority: '0',
  active: true, startsAt: '', endsAt: '',
};

// ISO string -> value for <input type="datetime-local"> (local, minute precision).
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function Campaigns() {
  const { data, loading, reload } = useApi<{ data: Promotion[] }>('/api/admin/promotions');
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function onPickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const { url } = await uploadFile('/api/admin/uploads', file);
      set('imageUrl', url);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function startEdit(p: Promotion) {
    setEditingId(p.id);
    setForm({
      kind: p.kind, title: p.title, subtitle: p.subtitle ?? '', imageUrl: p.imageUrl ?? '',
      bgColor: p.bgColor ?? '', textColor: p.textColor ?? '', ctaLabel: p.ctaLabel ?? '',
      ctaUrl: p.ctaUrl ?? '', couponCode: p.couponCode ?? '', placement: p.placement,
      priority: String(p.priority), active: p.active,
      startsAt: toLocalInput(p.startsAt), endsAt: toLocalInput(p.endsAt),
    });
    setMsg(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.title.trim()) { setMsg('Title is required.'); return; }
    setBusy(true); setMsg(null);
    const body = {
      kind: form.kind,
      title: form.title.trim(),
      subtitle: form.subtitle || null,
      imageUrl: form.imageUrl || null,
      bgColor: form.bgColor || null,
      textColor: form.textColor || null,
      ctaLabel: form.ctaLabel || null,
      ctaUrl: form.ctaUrl || null,
      couponCode: form.couponCode || null,
      placement: form.placement,
      priority: Number(form.priority) || 0,
      active: form.active,
      // Convert the local datetime-local value to an absolute UTC instant so the
      // schedule is correct regardless of the server's timezone.
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };
    try {
      if (editingId) await apiFetch(`/api/admin/promotions/${editingId}`, { method: 'PATCH', body });
      else await apiFetch('/api/admin/promotions', { method: 'POST', body });
      setMsg(editingId ? 'Campaign updated.' : 'Campaign created.');
      resetForm();
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally { setBusy(false); }
  }

  async function toggle(p: Promotion) {
    try {
      await apiFetch(`/api/admin/promotions/${p.id}`, { method: 'PATCH', body: { active: !p.active } });
      reload();
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Update failed'); }
  }

  async function remove(p: Promotion) {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${p.title}"?`)) return;
    try {
      await apiFetch(`/api/admin/promotions/${p.id}`, { method: 'DELETE' });
      if (editingId === p.id) resetForm();
      reload();
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Delete failed'); }
  }

  const promos = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">Campaigns</h1>
        <span className="hidden text-sm text-ink/50 sm:block">Promo bar + banners — web &amp; app</span>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">{editingId ? 'Edit campaign' : 'New campaign'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Select label="Type" value={form.kind} onChange={(v) => set('kind', v as Form['kind'])}
            options={[['banner', 'Banner (large)'], ['bar', 'Bar (thin strip)']]} />
          <Select label="Show on" value={form.placement} onChange={(v) => set('placement', v as Form['placement'])}
            options={[['both', 'Web + App'], ['web', 'Web only'], ['mobile', 'App only']]} />
          <Text label="Title" value={form.title} onChange={(v) => set('title', v)} full />
          <Text label="Subtitle" value={form.subtitle} onChange={(v) => set('subtitle', v)} full />
          <div className="sm:col-span-2">
            <span className="text-sm font-semibold text-ink/70">Banner image</span>
            <div className="mt-1 flex items-center gap-3">
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="banner" className="h-16 w-28 rounded-lg border border-brand-100 object-cover" />
              ) : (
                <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-brand-200 text-xs text-ink/40">
                  No image
                </div>
              )}
              <label className="btn-ghost cursor-pointer">
                {uploading ? 'Uploading…' : form.imageUrl ? 'Replace' : 'Upload image'}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={onPickImage} />
              </label>
              {form.imageUrl && (
                <button type="button" onClick={() => set('imageUrl', '')} className="text-sm font-semibold text-coral-600">
                  Remove
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-ink/40">PNG / JPG / WebP, up to ~5 MB.</p>
          </div>
          <Text label="CTA label" value={form.ctaLabel} onChange={(v) => set('ctaLabel', v)} />
          <Text label="CTA link (e.g. /plans or https://…)" value={form.ctaUrl} onChange={(v) => set('ctaUrl', v)} />
          <Text label="Coupon code (optional)" value={form.couponCode} onChange={(v) => set('couponCode', v)} />
          <Text label="Priority (higher shows first)" value={form.priority} onChange={(v) => set('priority', v)} type="number" />
          <Text label="Background color (hex, optional)" value={form.bgColor} onChange={(v) => set('bgColor', v)} />
          <Text label="Text color (hex, optional)" value={form.textColor} onChange={(v) => set('textColor', v)} />
          <Text label="Starts at (optional)" value={form.startsAt} onChange={(v) => set('startsAt', v)} type="datetime-local" />
          <Text label="Ends at (optional)" value={form.endsAt} onChange={(v) => set('endsAt', v)} type="datetime-local" />
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-ink/70">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            Active
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? 'Saving…' : editingId ? 'Update campaign' : 'Create campaign'}
          </button>
          {editingId && <button onClick={resetForm} className="btn-ghost">Cancel</button>}
        </div>
        {msg && <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{msg}</p>}
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">All campaigns</h2>
        {loading ? (
          <p className="mt-3 text-ink/40">Loading…</p>
        ) : promos.length === 0 ? (
          <p className="mt-3 text-ink/50">No campaigns yet — create one above.</p>
        ) : (
          <div className="mt-3 divide-y divide-brand-100/70">
            {promos.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className={`chip ${p.kind === 'bar' ? 'bg-sand-100 text-ink/60' : 'bg-brand-50 text-brand-700'}`}>{p.kind}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{p.title}</p>
                  {p.subtitle && <p className="truncate text-sm text-ink/50">{p.subtitle}</p>}
                </div>
                <span className="text-xs text-ink/40">{p.placement}</span>
                <span className={`chip ${p.active ? 'bg-brand-50 text-brand-700' : 'bg-coral-100 text-coral-700'}`}>{p.active ? 'Active' : 'Off'}</span>
                <button onClick={() => toggle(p)} className="text-sm font-semibold text-ink/60 hover:text-ink">{p.active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => startEdit(p)} className="text-sm font-semibold text-brand-700 hover:text-brand-800">Edit</button>
                <button onClick={() => remove(p)} className="text-sm font-semibold text-coral-600 hover:text-coral-700">Delete</button>
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
