'use client';

import { useState, type ChangeEvent } from 'react';
import { useApi } from '@/lib/use-api';
import { apiFetch, uploadFile } from '@/lib/client-api';

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  body: string;
  readMins: number;
  published: boolean;
}

interface Form {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  body: string;
  readMins: string;
  published: boolean;
}

const emptyForm: Form = {
  title: '', slug: '', excerpt: '', coverImageUrl: '', body: '', readMins: '3', published: true,
};

export default function Articles() {
  const { data, loading, reload } = useApi<{ data: Article[] }>('/api/admin/articles');
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
      set('coverImageUrl', url);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function startEdit(a: Article) {
    setEditingId(a.id);
    setForm({
      title: a.title, slug: a.slug, excerpt: a.excerpt,
      coverImageUrl: a.coverImageUrl ?? '', body: a.body, readMins: String(a.readMins), published: a.published,
    });
    setMsg(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.title.trim() || !form.excerpt.trim() || !form.body.trim()) {
      setMsg('Title, excerpt and body are required.');
      return;
    }
    setBusy(true);
    setMsg(null);
    const body = {
      title: form.title.trim(),
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      excerpt: form.excerpt.trim(),
      coverImageUrl: form.coverImageUrl.trim() || null,
      body: form.body,
      readMins: Number(form.readMins) || 3,
      published: form.published,
    };
    try {
      if (editingId) await apiFetch(`/api/admin/articles/${editingId}`, { method: 'PATCH', body });
      else await apiFetch('/api/admin/articles', { method: 'POST', body });
      setMsg(editingId ? 'Article updated.' : 'Article published.');
      resetForm();
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(a: Article) {
    try {
      await apiFetch(`/api/admin/articles/${a.id}`, { method: 'PATCH', body: { published: !a.published } });
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Update failed');
    }
  }
  async function remove(a: Article) {
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${a.title}"?`)) return;
    try {
      await apiFetch(`/api/admin/articles/${a.id}`, { method: 'DELETE' });
      if (editingId === a.id) resetForm();
      reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  const articles = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-ink">Blog</h1>
        <span className="hidden text-sm text-ink/50 sm:block">Articles shown at /blog</span>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">{editingId ? 'Edit article' : 'New article'}</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Title</span>
            <input value={form.title} onChange={(e) => set('title', e.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Slug (blank = from title)</span>
            <input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="what-is-an-esim"
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 font-mono text-sm outline-none focus:border-brand-500" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Excerpt (short summary)</span>
            <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2}
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500" />
          </label>
          <div>
            <span className="text-sm font-semibold text-ink/70">Cover image (recommended)</span>
            <div className="mt-1 flex items-center gap-3">
              {form.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.coverImageUrl} alt="cover" className="h-16 w-28 rounded-lg border border-brand-100 object-cover" />
              ) : (
                <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-brand-200 text-xs text-ink/40">No image</div>
              )}
              <label className="btn-ghost cursor-pointer">
                {uploading ? 'Uploading…' : form.coverImageUrl ? 'Replace' : 'Upload image'}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={onPickImage} />
              </label>
              {form.coverImageUrl && (
                <button type="button" onClick={() => set('coverImageUrl', '')} className="text-sm font-semibold text-coral-600">Remove</button>
              )}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Body</span>
            <textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={12}
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 font-mono text-sm outline-none focus:border-brand-500" />
            <p className="mt-1 text-xs text-ink/40">
              Leave a blank line between paragraphs. Start a line with <span className="font-mono">## </span> for a section heading.
            </p>
          </label>
          <div className="flex flex-wrap items-center gap-6">
            <label className="block w-40">
              <span className="text-sm font-semibold text-ink/70">Read time (mins)</span>
              <input type="number" value={form.readMins} onChange={(e) => set('readMins', e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-2.5 outline-none focus:border-brand-500" />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-ink/70">
              <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
              Published
            </label>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? 'Saving…' : editingId ? 'Update article' : 'Publish article'}
          </button>
          {editingId && <button onClick={resetForm} className="btn-ghost">Cancel</button>}
        </div>
        {msg && <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{msg}</p>}
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold text-ink">All articles</h2>
        {loading ? (
          <p className="mt-3 text-ink/40">Loading…</p>
        ) : articles.length === 0 ? (
          <p className="mt-3 text-ink/50">No articles yet — write one above.</p>
        ) : (
          <div className="mt-3 divide-y divide-brand-100/70">
            {articles.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                {a.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverImageUrl} alt="" className="h-8 w-12 shrink-0 rounded border border-brand-100 object-cover" />
                ) : (
                  <span className="h-8 w-12 shrink-0 rounded bg-gradient-to-br from-brand-600 to-ink" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{a.title}</p>
                  <p className="truncate font-mono text-xs text-ink/40">/blog/{a.slug}</p>
                </div>
                <span className={`chip ${a.published ? 'bg-brand-50 text-brand-700' : 'bg-coral-100 text-coral-700'}`}>
                  {a.published ? 'Published' : 'Draft'}
                </span>
                <button onClick={() => toggle(a)} className="text-sm font-semibold text-ink/60 hover:text-ink">
                  {a.published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => startEdit(a)} className="text-sm font-semibold text-brand-700 hover:text-brand-800">Edit</button>
                <button onClick={() => remove(a)} className="text-sm font-semibold text-coral-600 hover:text-coral-700">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
