import type { CountryCoverage } from '@/lib/types';

const GENS = ['2G', '3G', '4G', '5G'];

export function Coverage({ coverage }: { coverage: CountryCoverage[] }) {
  if (!coverage.length) return null;
  return (
    <div className="space-y-4">
      {coverage.map((c) => (
        <div key={`${c.country}-${c.code ?? ''}`} className="card p-5">
          <div className="flex items-center gap-3">
            {c.flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.flag} alt="" width={32} height={22} className="h-5 w-8 rounded object-cover" />
            )}
            <h3 className="font-display font-bold text-ink">{c.country}</h3>
          </div>
          <div className="mt-3 space-y-2">
            {c.networks.map((n, i) => (
              <div key={`${n.code ?? n.name}-${i}`} className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink/70">{n.name}</span>
                <div className="flex gap-1">
                  {GENS.map((g) => (
                    <span
                      key={g}
                      className={`grid h-6 w-8 place-items-center rounded text-[10px] font-bold ${
                        n.generations.includes(g)
                          ? 'bg-brand-600 text-white'
                          : 'bg-sand-100 text-ink/25'
                      }`}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
