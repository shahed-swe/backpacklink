'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/client-api';

interface Tip {
  id: string;
  country: string;
  body: string;
  likes: number;
  createdAt: string;
  user: { name: string | null; country: string | null } | null;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [tips, setTips] = useState<Tip[]>([]);
  const [country, setCountry] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    apiFetch<{ data: Tip[] }>('/api/community/tips').then((r) => setTips(r.data)).catch(() => {});
  }
  useEffect(load, []);

  async function post() {
    if (!country.trim() || !body.trim()) return;
    setBusy(true);
    try {
      await apiFetch('/api/community/tips', { method: 'POST', body: { country: country.trim(), body: body.trim() } });
      setCountry('');
      setBody('');
      load();
    } finally {
      setBusy(false);
    }
  }

  async function like(id: string) {
    setTips((t) => t.map((x) => (x.id === id ? { ...x, likes: x.likes + 1 } : x)));
    apiFetch(`/api/community/tips/${id}/like`, { method: 'POST' }).catch(() => {});
  }

  return (
    <div className="container-bp py-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wider text-coral-500">Community</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-ink sm:text-4xl">Traveler tips</h1>
        <p className="mt-2 text-ink/60">Real experiences from fellow travelers — “worked great in…”.</p>

        {/* composer */}
        {user ? (
          <div className="mt-6 card p-5">
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country (e.g. Japan)"
              className="w-full rounded-xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share how it went — speed, activation, coverage…"
              rows={3}
              className="mt-2 w-full rounded-xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <div className="mt-2 flex justify-end">
              <button onClick={post} disabled={busy} className="btn-primary disabled:opacity-60">
                {busy ? 'Posting…' : 'Share tip'}
              </button>
            </div>
          </div>
        ) : (
          <Link href="/login?next=/community" className="mt-6 block card p-4 text-center text-sm font-semibold text-brand-700">
            Sign in to share your own tip →
          </Link>
        )}

        {/* feed */}
        <div className="mt-8 space-y-3">
          {tips.length === 0 ? (
            <p className="text-ink/50">No tips yet — be the first to share!</p>
          ) : (
            tips.map((t) => (
              <div key={t.id} className="card p-5">
                <div className="flex items-center gap-2">
                  <span className="chip bg-brand-50 text-brand-700">{t.country}</span>
                  <span className="text-xs text-ink/40">{t.user?.name ?? 'A traveler'}</span>
                </div>
                <p className="mt-2 text-ink">{t.body}</p>
                <button onClick={() => like(t.id)} className="mt-3 text-sm font-semibold text-coral-600 hover:text-coral-700">
                  ❤ {t.likes}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
