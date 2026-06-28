import type { Package } from './types';

export function formatData(pkg: Package): string {
  if (pkg.data.unlimited) return 'Unlimited';
  return `${pkg.data.quantity} ${pkg.data.unit}`;
}

export function formatValidity(pkg: Package): string {
  const n = pkg.validity.quantity;
  const unit = pkg.validity.unit.toLowerCase();
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}

export function money(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

const GEN_ORDER = ['2G', '3G', '4G', '5G'];

export function topGeneration(pkg: Package): string | null {
  const all = new Set<string>();
  for (const c of pkg.coverage) for (const n of c.networks) for (const g of n.generations) all.add(g);
  for (let i = GEN_ORDER.length - 1; i >= 0; i--) if (all.has(GEN_ORDER[i])) return GEN_ORDER[i];
  return null;
}

// Pull a flag for a package (first covered country).
export function packageFlag(pkg: Package): string | null {
  return pkg.coverage[0]?.flag ?? null;
}
