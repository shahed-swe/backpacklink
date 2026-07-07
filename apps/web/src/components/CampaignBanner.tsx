import Link from 'next/link';
import type { Promotion } from '@/lib/types';

// Large campaign banner (e.g. a FIFA event promo). Content is admin-managed data.
export function CampaignBanner({ promo }: { promo: Promotion }) {
  const hasImage = Boolean(promo.imageUrl);
  const style: React.CSSProperties = {
    backgroundColor: promo.bgColor ?? undefined,
    color: promo.textColor ?? undefined,
    ...(hasImage
      ? { backgroundImage: `url(${promo.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : {}),
  };

  return (
    <section className="container-bp pt-6">
      <div
        className={`relative overflow-hidden rounded-4xl px-6 py-10 shadow-card sm:px-10 sm:py-14 ${
          !hasImage && !promo.bgColor ? 'bg-lagoon' : ''
        } ${promo.textColor ? '' : 'text-white'}`}
        style={style}
      >
        {/* Dark left-to-right scrim keeps the text readable over the image */}
        {hasImage && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" aria-hidden />
        )}
        <div className="relative max-w-xl">
          {promo.couponCode && (
            <span className="chip bg-white/20 uppercase tracking-wide">Use code {promo.couponCode}</span>
          )}
          <h2 className="mt-2 font-display text-2xl font-extrabold drop-shadow sm:text-3xl">{promo.title}</h2>
          {promo.subtitle && <p className="mt-2 text-base opacity-90 drop-shadow">{promo.subtitle}</p>}
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
