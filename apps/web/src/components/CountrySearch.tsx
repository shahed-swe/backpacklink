'use client';

import { useMemo, useState } from 'react';
import type { Country } from '@/lib/types';
import { CountryCard } from './CountryCard';

export function CountrySearch({ countries }: { countries: Country[] }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(term));
  }, [q, countries]);

  return (
    <div>
      <div className="sticky top-16 z-10 -mx-5 bg-sand-50/90 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="relative mx-auto max-w-xl">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ink/30">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search 200+ countries…"
            className="w-full rounded-full border border-brand-200 bg-white py-3.5 pl-12 pr-5 text-sm font-medium text-ink shadow-card outline-none transition focus:border-brand-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-ink/50">No destinations match “{q}”.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c) => (
            <CountryCard key={c.id} country={c} />
          ))}
        </div>
      )}
    </div>
  );
}
