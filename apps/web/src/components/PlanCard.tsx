import Link from 'next/link';
import type { Package } from '@/lib/types';
import { formatData, formatValidity, money, topGeneration } from '@/lib/format';

export function PlanCard({ pkg }: { pkg: Package }) {
  const gen = topGeneration(pkg);
  const countryCount = pkg.coverage.length;

  return (
    <Link
      href={`/plans/${pkg.id}`}
      className="card group flex flex-col p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {pkg.data.unlimited && (
            <span className="chip bg-coral-100 text-coral-700">Unlimited</span>
          )}
          {gen && <span className="chip bg-brand-50 text-brand-700">{gen}</span>}
          {pkg.features.tether && <span className="chip bg-sand-100 text-ink/60">Hotspot</span>}
        </div>
        {countryCount > 1 && (
          <span className="chip bg-brand-50 text-brand-700">{countryCount} countries</span>
        )}
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className="font-display text-4xl font-extrabold leading-none text-ink">
          {formatData(pkg)}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-ink/50">for {formatValidity(pkg)}</p>

      <div className="mt-5 flex items-center justify-between border-t border-brand-100 pt-4">
        <div>
          <p className="text-xs text-ink/40">From</p>
          <p className="font-display text-xl font-bold text-brand-700">
            {money(pkg.price.retail, pkg.price.currency)}
          </p>
        </div>
        <span className="btn-ghost px-4 py-2 group-hover:border-brand-400 group-hover:bg-brand-50">
          View plan →
        </span>
      </div>
    </Link>
  );
}
