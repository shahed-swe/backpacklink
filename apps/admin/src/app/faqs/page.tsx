'use client';

import { useState } from 'react';
import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';

interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
}

interface Form {
  question: string;
  answer: string;
  sortOrder: string;
  active: boolean;
}

const emptyForm: Form = { question: '', answer: '', sortOrder: '0', active: true };

export default function Faqs() {
  const { data, loading, reload } = useApi<{ data: Faq[] }>('/api/admin/faqs');
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startEdit(x: Faq) {
    setEditingId(x.id);
    setForm({ question: x.question, answer: x.answer, sortOrder: String(x.sortOrder), active: x.active });
    setMsg(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.question.trim() || !form.answer.trim()) {
      setMsg('Question and answer are required.');
      return;
    }
    setBusy(true);
    setMsg(null);
    const body = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
    };
    try {
      if (editingId) await apiFetch(`/api/admin/faqs/${editingId}`, { method: 'PATCH', body });
      else await apiFetch('/api/admin/faqs', { method: 'POST', body });
      setMsg(editingId ? 'FAQ updated.' : 'FAQ created.');
      resetForm();
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(x: Faq) {
    try {
      await apiFetch(`/api/admin/faqs/${x.id}`, { method: 'PATCH', body: { active: !x.active } });
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Update failed');
    }
  }
  async function remove(x: Faq) {
    if (typeof window !== 'undefined' && !window.confirm('Delete this FAQ?')) return;
    try {
      await apiFetch(`/api/admin/faqs/${x.id}`, { method: 'DELETE' });
      if (editingId === x.id) resetForm();
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  const faqs = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">FAQ</h1>
        <span className="hidden text-sm text-ink/50 sm:block">Shown on the website homepage</span>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">{editingId ? 'Edit FAQ' : 'New FAQ'}</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Question</span>
            <input
              value={form.question}
              onChange={(e) => set('question', e.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Answer</span>
            <textarea
              value={form.answer}
              onChange={(e) => set('answer', e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500"
            />
          </label>
          <div className="flex flex-wrap items-center gap-6">
            <label className="block w-40">
              <span className="text-sm font-semibold text-ink/70">Order (lower first)</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500"
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-ink/70">
              <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
              Active
            </label>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? 'Saving…' : editingId ? 'Update FAQ' : 'Create FAQ'}
          </button>
          {editingId && <button onClick={resetForm} className="btn-ghost">Cancel</button>}
        </div>
        {msg && <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{msg}</p>}
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">All FAQs</h2>
        {loading ? (
          <p className="mt-3 text-ink/40">Loading…</p>
        ) : faqs.length === 0 ? (
          <p className="mt-3 text-ink/50">No FAQs yet — add one above.</p>
        ) : (
          <div className="mt-3 divide-y divide-brand-100/70">
            {faqs.map((x) => (
              <div key={x.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="text-xs text-ink/40">#{x.sortOrder}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{x.question}</p>
                  <p className="truncate text-sm text-ink/50">{x.answer}</p>
                </div>
                <span className={`chip ${x.active ? 'bg-brand-50 text-brand-700' : 'bg-coral-100 text-coral-700'}`}>
                  {x.active ? 'Active' : 'Off'}
                </span>
                <button onClick={() => toggle(x)} className="text-sm font-semibold text-ink/60 hover:text-ink">
                  {x.active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => startEdit(x)} className="text-sm font-semibold text-brand-700 hover:text-brand-800">Edit</button>
                <button onClick={() => remove(x)} className="text-sm font-semibold text-coral-600 hover:text-coral-700">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
