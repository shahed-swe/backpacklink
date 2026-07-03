'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/client-api';

interface Country {
  id: number;
  name: string;
  flag: string | null;
}
interface Net {
  name: string;
  generations: string[];
}

const GENS = ['2G', '3G', '4G', '5G'];

export default function CoveragePage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Country | null>(null);
  const [nets, setNets] = useState<Net[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ data: Country[] }>('/api/catalog/countries').then((r) => setCountries(r.data)).catch(() => {});
  }, []);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return countries.filter((c) => c.name.toLowerCase().includes(t)).slice(0, 6);
  }, [q, countries]);

  async function check(c: Country) {
    setPicked(c);
    setQ('');
    setNets(null);
    setLoading(true);
    try {
      const r = await apiFetch<{ networks: Net[] }>(`/api/catalog/coverage/${c.id}`);
      setNets(r.networks);
    } catch {
      setNets([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-bp py-12">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wider text-coral-500">Coverage</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-ink sm:text-4xl">Will it work here?</h1>
        <p className="mt-2 text-ink/60">Type your destination to see the networks and speeds we cover.</p>

        <div className="relative mt-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a country…"
            className="w-full rounded-2xl border border-brand-200 bg-white px-5 py-3.5 text-ink shadow-card outline-none focus:border-brand-500"
          />
          {matches.length > 0 && (
            <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-card">
              {matches.map((c) => (
                <li key={c.id}>
                  <button onClick={() => check(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sand-50">
                    {c.flag && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.flag} alt="" width={28} height={20} className="h-5 w-7 rounded object-cover" />
                    )}
                    <span className="font-semibold text-ink">{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {picked && (
          <div className="mt-8">
            <div className="flex items-center gap-3">
              {picked.flag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picked.flag} alt="" width={44} height={30} className="h-8 w-11 rounded object-cover" />
              )}
              <h2 className="font-display text-2xl font-extrabold text-ink">{picked.name}</h2>
            </div>

            {loading ? (
              <p className="mt-4 text-ink/40">Checking coverage…</p>
            ) : !nets || nets.length === 0 ? (
              <p className="mt-4 text-ink/60">No coverage data yet for {picked.name}.</p>
            ) : (
              <>
                <p className="mt-3 rounded-2xl bg-brand-50 px-4 py-3 font-semibold text-brand-700">
                  ✅ Yes — your eSIM will work in {picked.name} on {nets.length} network{nets.length > 1 ? 's' : ''}.
                </p>
                <div className="mt-4 space-y-2">
                  {nets.map((n) => (
                    <div key={n.name} className="card flex items-center justify-between p-4">
                      <span className="text-sm font-medium text-ink">{n.name}</span>
                      <div className="flex gap-1">
                        {GENS.map((g) => (
                          <span
                            key={g}
                            className={`grid h-6 w-8 place-items-center rounded text-[10px] font-bold ${
                              n.generations.includes(g) ? 'bg-brand-600 text-white' : 'bg-sand-100 text-ink/25'
                            }`}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <a href={`/esim/${picked.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`} className="btn-primary mt-6 inline-flex">
                  See {picked.name} plans →
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
