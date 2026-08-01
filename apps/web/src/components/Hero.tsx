'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Promotion } from '@/lib/types';

// Banner-aware hero. With no campaign it shows the default headline + floating
// price cards. With one campaign, its image + copy become the hero's background
// and top area. With several, the top area auto-rotates as a carousel. The
// search bar / chips / feature ticks (passed as children) stay fixed either way.
export function Hero({ banners, children }: { banners: Promotion[]; children: React.ReactNode }) {
  const [i, setI] = useState(0);
  const n = banners.length;

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);

  const active = n > 0 ? banners[i % n] : null;
  const hasImage = Boolean(active?.imageUrl);
  const bgStyle: React.CSSProperties = active
    ? {
        backgroundColor: active.bgColor ?? undefined,
        ...(hasImage
          ? { backgroundImage: `url(${active.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {}),
      }
    : {};

  return (
    <section className="relative overflow-hidden">
      {/* Background: campaign image/color, else the default teal gradient */}
      <div
        className={`absolute inset-0 ${!active || (!hasImage && !active.bgColor) ? 'bg-lagoon' : ''}`}
        style={bgStyle}
        aria-hidden
      />
      {hasImage ? (
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" aria-hidden />
      ) : (
        <div
          className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_0%,white,transparent_35%)]"
          aria-hidden
        />
      )}

      <div className="container-bp relative py-16 md:py-24">
        {active ? (
          <div className="max-w-2xl text-white">
            {/* Campaign top area (carousel when several) */}
            {active.couponCode && (
              <span className="chip bg-white/20 uppercase tracking-wide backdrop-blur">
                Use code {active.couponCode}
              </span>
            )}
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight drop-shadow-lg sm:text-6xl">
              {active.title}
            </h1>
            {active.subtitle && (
              <p className="mt-5 max-w-xl text-lg text-white/90 drop-shadow">{active.subtitle}</p>
            )}
            {active.ctaLabel && active.ctaUrl && (
              <Link href={active.ctaUrl} className="btn-dark mt-6">
                {active.ctaLabel}
              </Link>
            )}
            {n > 1 && (
              <div className="mt-6 flex gap-2">
                {banners.map((b, idx) => (
                  <button
                    key={b.id}
                    onClick={() => setI(idx)}
                    aria-label={`Show campaign ${idx + 1}`}
                    className={`h-2 rounded-full transition-all ${idx === i % n ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                  />
                ))}
              </div>
            )}
            {/* Search + chips + features — unchanged, always present */}
            <div className="mt-8">{children}</div>
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2">
            <div className="text-white">
              <span className="chip bg-white/15 text-white backdrop-blur">🌍 200+ countries · instant delivery</span>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Land. Scan. <br /> You&apos;re online.
              </h1>
              <p className="mt-5 max-w-md text-lg text-white/85">
                Travel eSIM data plans that work the moment you arrive. No roaming bills, no SIM
                swapping, no airport kiosks. Just data — anywhere you go.
              </p>
              {/* Search + chips + features — unchanged, always present */}
              <div className="mt-8">{children}</div>
            </div>

            {/* Animated connectivity graphic + floating price cards (default hero only) */}
            <div className="relative hidden min-h-[22rem] md:block">
              {/* Signal rings + globe + orbiting satellite (behind the cards) */}
              <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
                <div className="relative h-56 w-56">
                  <span className="bpl-ping absolute inset-0 rounded-full border border-white/25" />
                  <span className="bpl-ping absolute inset-0 rounded-full border border-white/25" style={{ animationDelay: '1s' }} />
                  <span className="bpl-ping absolute inset-0 rounded-full border border-white/25" style={{ animationDelay: '2s' }} />
                  <span className="absolute inset-10 grid place-items-center rounded-full bg-white/10 text-5xl backdrop-blur-sm">
                    🌐
                  </span>
                  <span className="bpl-orbit absolute inset-0 block">
                    <span className="absolute left-1/2 top-0 block h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-coral-400 shadow-glow" />
                  </span>
                </div>
              </div>

              <div className="bpl-float absolute right-0 top-4 w-64">
                <div className="rotate-3 rounded-3xl bg-white p-5 shadow-card">
                  <p className="text-xs font-semibold text-ink/40">JAPAN · 5 GB</p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-ink">30 days</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="chip bg-brand-50 text-brand-700">4G/5G</span>
                    <span className="font-display font-bold text-brand-700">$12.90</span>
                  </div>
                </div>
              </div>
              <div className="bpl-float absolute right-32 top-44 w-60" style={{ animationDelay: '-3s' }}>
                <div className="-rotate-3 rounded-3xl bg-ink p-5 text-white shadow-card">
                  <p className="text-xs font-semibold text-white/50">EUROPE · 10 GB</p>
                  <p className="mt-1 font-display text-2xl font-extrabold">30 days</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="chip bg-white/10 text-white">36 countries</span>
                    <span className="font-display font-bold text-coral-400">$18.40</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="relative h-8 rounded-t-[2.5rem] bg-sand-50" />
    </section>
  );
}
