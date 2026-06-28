'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Country, Continent } from '@/lib/types';
import { slugify } from '@/lib/api';

const POPULAR = ['Japan', 'Thailand', 'United States', 'Turkey', 'United Arab Emirates', 'Spain'];

export function HeroSearch({
  countries,
  continents,
}: {
  countries: Country[];
  continents: Continent[];
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return countries.filter((c) => c.name.toLowerCase().includes(term)).slice(0, 7);
  }, [q, countries]);

  const popularChips = useMemo(
    () => POPULAR.map((n) => countries.find((c) => c.name === n)).filter(Boolean) as Country[],
    [countries],
  );

  function go(country: Country) {
    router.push(`/esim/${slugify(country.name)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!matches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(matches[active] ?? matches[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div ref={boxRef} className="relative">
        <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-card">
          <span className="pl-3 text-xl" aria-hidden>
            🔎
          </span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKeyDown}
            placeholder="Where are you travelling? e.g. Japan"
            className="w-full bg-transparent py-2 text-ink outline-none placeholder:text-ink/40"
            aria-label="Search destinations"
            autoComplete="off"
          />
          <button
            onClick={() => matches[0] && go(matches[0])}
            className="btn-primary shrink-0 px-5 py-2.5"
          >
            Search
          </button>
        </div>

        {open && matches.length > 0 && (
          <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-card">
            {matches.map((c, i) => (
              <li key={c.id}>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(c)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    i === active ? 'bg-brand-50' : 'hover:bg-sand-50'
                  }`}
                >
                  {c.flag && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.flag} alt="" width={28} height={20} className="h-5 w-7 rounded object-cover" />
                  )}
                  <span className="font-semibold text-ink">{c.name}</span>
                  <span className="ml-auto text-sm text-brand-600">View plans →</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Popular + region quick filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-white/80">Popular:</span>
        {popularChips.map((c) => (
          <button
            key={c.id}
            onClick={() => go(c)}
            className="chip bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
          >
            {c.flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.flag} alt="" width={18} height={12} className="h-3 w-4 rounded-sm object-cover" />
            )}
            {c.name}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {continents.slice(0, 5).map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/regions/${slugify(c.name)}`)}
            className="chip bg-ink/20 text-white transition hover:bg-ink/30"
          >
            🧭 {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
