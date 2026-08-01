'use client';

import { useState, type ChangeEvent } from 'react';
import { useApi } from '@/lib/use-api';
import { apiFetch, uploadFile } from '@/lib/client-api';

interface Testimonial {
  id: string;
  name: string;
  location: string | null;
  quote: string;
  rating: number;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
}

interface Form {
  name: string;
  location: string;
  quote: string;
  rating: string;
  imageUrl: string;
  sortOrder: string;
  active: boolean;
}

const emptyForm: Form = { name: '', location: '', quote: '', rating: '5', imageUrl: '', sortOrder: '0', active: true };

export default function Testimonials() {
  const { data, loading, reload } = useApi<{ data: Testimonial[] }>('/api/admin/testimonials');
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

  function startEdit(t: Testimonial) {
    setEditingId(t.id);
    setForm({
      name: t.name, location: t.location ?? '', quote: t.quote, rating: String(t.rating),
      imageUrl: t.imageUrl ?? '', sortOrder: String(t.sortOrder), active: t.active,
    });
    setMsg(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.name.trim() || !form.quote.trim()) {
      setMsg('Name and quote are required.');
      return;
    }
    setBusy(true);
    setMsg(null);
    const body = {
      name: form.name.trim(),
      location: form.location.trim() || null,
      quote: form.quote.trim(),
      rating: Number(form.rating) || 5,
      imageUrl: form.imageUrl.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
    };
    try {
      if (editingId) await apiFetch(`/api/admin/testimonials/${editingId}`, { method: 'PATCH', body });
      else await apiFetch('/api/admin/testimonials', { method: 'POST', body });
      setMsg(editingId ? 'Testimonial updated.' : 'Testimonial added.');
      resetForm();
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(t: Testimonial) {
    try {
      await apiFetch(`/api/admin/testimonials/${t.id}`, { method: 'PATCH', body: { active: !t.active } });
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Update failed');
    }
  }
  async function remove(t: Testimonial) {
    if (typeof window !== 'undefined' && !window.confirm(`Delete testimonial from ${t.name}?`)) return;
    try {
      await apiFetch(`/api/admin/testimonials/${t.id}`, { method: 'DELETE' });
      if (editingId === t.id) resetForm();
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">Testimonials</h1>
        <span className="hidden text-sm text-ink/50 sm:block">Real reviews shown on the homepage</span>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">{editingId ? 'Edit testimonial' : 'New testimonial'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Name</span>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Location / trip (optional)</span>
            <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Japan trip"
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-ink/70">Quote</span>
            <textarea value={form.quote} onChange={(e) => set('quote', e.target.value)} rows={3}
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Rating</span>
            <select value={form.rating} onChange={(e) => set('rating', e.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 outline-none focus:border-brand-500">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Order (lower first)</span>
            <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500" />
          </label>
          <div className="sm:col-span-2">
            <span className="text-sm font-semibold text-ink/70">Review screenshot (optional)</span>
            <div className="mt-1 flex items-center gap-3">
              {form.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="screenshot" className="h-16 w-28 rounded-lg border border-brand-100 object-cover" />
              ) : (
                <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-brand-200 text-xs text-ink/40">No image</div>
              )}
              <label className="btn-ghost cursor-pointer">
                {uploading ? 'Uploading…' : form.imageUrl ? 'Replace' : 'Upload screenshot'}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={onPickImage} />
              </label>
              {form.imageUrl && (
                <button type="button" onClick={() => set('imageUrl', '')} className="text-sm font-semibold text-coral-600">Remove</button>
              )}
            </div>
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-ink/70">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            Active
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? 'Saving…' : editingId ? 'Update' : 'Add testimonial'}
          </button>
          {editingId && <button onClick={resetForm} className="btn-ghost">Cancel</button>}
        </div>
        {msg && <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{msg}</p>}
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">All testimonials</h2>
        {loading ? (
          <p className="mt-3 text-ink/40">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-ink/50">No testimonials yet — add a real review above.</p>
        ) : (
          <div className="mt-3 divide-y divide-brand-100/70">
            {items.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="text-xs text-ink/40">#{t.sortOrder}</span>
                <span className="text-sm text-yellow-500">{'★'.repeat(t.rating)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{t.name}{t.location ? ` · ${t.location}` : ''}</p>
                  <p className="truncate text-sm text-ink/50">{t.quote}</p>
                </div>
                {t.imageUrl && <span className="text-xs text-ink/40">📷</span>}
                <span className={`chip ${t.active ? 'bg-brand-50 text-brand-700' : 'bg-coral-100 text-coral-700'}`}>
                  {t.active ? 'Active' : 'Off'}
                </span>
                <button onClick={() => toggle(t)} className="text-sm font-semibold text-ink/60 hover:text-ink">
                  {t.active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => startEdit(t)} className="text-sm font-semibold text-brand-700 hover:text-brand-800">Edit</button>
                <button onClick={() => remove(t)} className="text-sm font-semibold text-coral-600 hover:text-coral-700">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
