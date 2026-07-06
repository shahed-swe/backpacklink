import Link from 'next/link';
import type { Promotion } from '@/lib/types';

// Large campaign banner (e.g. a FIFA event promo). Content is admin-managed data.
export function CampaignBanner({ promo }: { promo: Promotion }) {
  const style: React.CSSProperties = {
    backgroundColor: promo.bgColor ?? undefined,
    color: promo.textColor ?? undefined,
  };

  return (
    <section className="container-bp pt-6">
      <div
        className={`relative overflow-hidden rounded-4xl px-6 py-8 shadow-card sm:px-10 sm:py-12 ${
          promo.bgColor ? '' : 'bg-lagoon'
        } ${promo.textColor ? '' : 'text-white'}`}
        style={style}
      >
        {promo.imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${promo.imageUrl})` }}
            aria-hidden
          />
        )}
        <div className="relative max-w-2xl">
          {promo.couponCode && (
            <span className="chip bg-white/20 uppercase tracking-wide">Use code {promo.couponCode}</span>
          )}
          <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">{promo.title}</h2>
          {promo.subtitle && <p className="mt-2 text-base opacity-90">{promo.subtitle}</p>}
          {promo.ctaLabel && promo.ctaUrl && (
            <Link href={promo.ctaUrl} className="btn-dark mt-5">
              {promo.ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
