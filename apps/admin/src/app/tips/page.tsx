'use client';

import { useApi } from '@/lib/use-api';
import { apiFetch } from '@/lib/client-api';

interface Tip {
  id: string;
  country: string;
  body: string;
  status: string;
  likes: number;
  reports: number;
  createdAt: string;
  user: { email: string; name: string | null } | null;
}

export default function TipsModeration() {
  const { data, loading, reload } = useApi<{ data: Tip[] }>('/api/admin/tips');

  async function setStatus(id: string, status: 'approved' | 'hidden') {
    await apiFetch(`/api/admin/tips/${id}/status`, { method: 'POST', body: { status } });
    reload();
  }

  if (loading) return <p className="text-ink/40">Loading…</p>;
  const tips = data?.data ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Community tips</h1>
      <p className="mt-1 text-sm text-ink/50">
        Moderate what appears in the community feed. Reported tips are listed first, and a tip
        reported by 3 travellers is hidden automatically until you review it.
      </p>

      <div className="mt-5 space-y-3">
        {tips.length === 0 ? (
          <p className="text-ink/50">No tips yet.</p>
        ) : (
          tips.map((t) => (
            <div key={t.id} className={`card p-4 ${t.status === 'hidden' ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="chip bg-brand-50 text-brand-700">{t.country}</span>
                    {t.status === 'hidden' && <span className="chip bg-coral-100 text-coral-700">hidden</span>}
                    {t.reports > 0 && (
                      <span className="chip bg-coral-100 font-semibold text-coral-700">
                        ⚑ {t.reports} report{t.reports === 1 ? '' : 's'}
                      </span>
                    )}
                    <span className="text-xs text-ink/40">❤ {t.likes}</span>
                  </div>
                  <p className="mt-2 text-ink">{t.body}</p>
                  <p className="mt-1 text-xs text-ink/40">
                    {t.user?.name ?? t.user?.email} · {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {t.status === 'approved' ? (
                  <button onClick={() => setStatus(t.id, 'hidden')} className="btn-ghost shrink-0 px-4 py-2 text-sm">
                    Hide
                  </button>
                ) : (
                  <button onClick={() => setStatus(t.id, 'approved')} className="btn-primary shrink-0 px-4 py-2 text-sm">
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
