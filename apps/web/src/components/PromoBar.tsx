import Link from 'next/link';
import type { Promotion } from '@/lib/types';

// Thin site-wide offer strip (e.g. "Bundle offer — save 20%"). Fully admin-managed.
export function PromoBar({ promo }: { promo: Promotion }) {
  const style: React.CSSProperties = {
    backgroundColor: promo.bgColor ?? undefined,
    color: promo.textColor ?? undefined,
  };
  const base = `block w-full ${promo.bgColor ? '' : 'bg-coral-600 text-white'}`;

  const inner = (
    <div className="container-bp flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-sm font-semibold">
      <span>{promo.title}</span>
      {promo.subtitle && <span className="font-medium opacity-90">{promo.subtitle}</span>}
      {promo.couponCode && (
        <span className="chip bg-white/20 uppercase tracking-wide">Code {promo.couponCode}</span>
      )}
      {promo.ctaLabel && promo.ctaUrl && (
        <span className="underline underline-offset-2">{promo.ctaLabel} →</span>
      )}
    </div>
  );

  return promo.ctaUrl ? (
    <Link href={promo.ctaUrl} className={base} style={style}>
      {inner}
    </Link>
  ) : (
    <div className={base} style={style}>
      {inner}
    </div>
  );
}
