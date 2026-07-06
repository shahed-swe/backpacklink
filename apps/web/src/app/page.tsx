import Link from 'next/link';
import { api, slugify } from '@/lib/api';
import { CountryCard } from '@/components/CountryCard';
import { HeroSearch } from '@/components/HeroSearch';
import { CampaignBanner } from '@/components/CampaignBanner';

// Render at request time so live catalog data always shows (avoids an empty
// build-time prerender when the API isn't reachable during `next build`).
export const dynamic = 'force-dynamic';

const POPULAR = [
  'United States', 'United Kingdom', 'Japan', 'Thailand', 'France', 'Turkey',
  'United Arab Emirates', 'Spain', 'Italy', 'Singapore', 'Australia', 'India',
  'Indonesia', 'Germany', 'Canada', 'Mexico',
];

export default async function HomePage() {
  const [countries, continents, promos] = await Promise.all([
    api.countries(),
    api.continents(),
    api.promotions('web'),
  ]);

  const popular = POPULAR.map((name) => countries.find((c) => c.name === name)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );
  const destinations = (popular.length ? popular : countries.slice(0, 16)).slice(0, 16);

  return (
    <>
      {/* Admin-managed campaign banners (event-driven, above the hero) */}
      {promos.banners.map((b) => (
        <CampaignBanner key={b.id} promo={b} />
      ))}
      {/* Hero */}
      <section className="relative overflow-hidden bg-lagoon">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_0%,white,transparent_35%)]" />
        <div className="container-bp relative grid gap-10 py-20 md:grid-cols-2 md:py-28">
          <div className="text-white">
            <span className="chip bg-white/15 text-white backdrop-blur">
              🌍 200+ countries · instant delivery
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Land. Scan. <br /> You&apos;re online.
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/85">
              Travel eSIM data plans that work the moment you arrive. No roaming bills, no SIM
              swapping, no airport kiosks. Just data — anywhere you go.
            </p>
            <div className="mt-8">
              <HeroSearch countries={countries} continents={continents} />
            </div>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/80">
              <span>✓ Keep your number</span>
              <span>✓ Hotspot/tethering</span>
              <span>✓ Up to 5G speeds</span>
            </div>
          </div>

          {/* floating stat cards */}
          <div className="relative hidden md:block">
            <div className="absolute right-0 top-4 w-64 rotate-3 rounded-3xl bg-white p-5 shadow-card">
              <p className="text-xs font-semibold text-ink/40">JAPAN · 5 GB</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-ink">30 days</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="chip bg-brand-50 text-brand-700">4G/5G</span>
                <span className="font-display font-bold text-brand-700">$12.90</span>
              </div>
            </div>
            <div className="absolute right-32 top-44 w-60 -rotate-3 rounded-3xl bg-ink p-5 text-white shadow-card">
              <p className="text-xs font-semibold text-white/50">EUROPE · 10 GB</p>
              <p className="mt-1 font-display text-2xl font-extrabold">30 days</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="chip bg-white/10 text-white">36 countries</span>
                <span className="font-display font-bold text-coral-400">$18.40</span>
              </div>
            </div>
          </div>
        </div>
        <div className="h-8 rounded-t-[2.5rem] bg-sand-50" />
      </section>

      {/* Popular destinations */}
      <section className="container-bp py-16">
        <SectionHead
          eyebrow="Popular destinations"
          title="Where are you headed?"
          action={{ href: '/destinations', label: 'All destinations →' }}
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {destinations.map((c) => (
            <CountryCard key={c.id} country={c} />
          ))}
        </div>
      </section>

      {/* Regional plans */}
      <section className="container-bp py-10">
        <SectionHead eyebrow="Travel wider" title="Regional & global plans" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {continents.slice(0, 7).map((c) => (
            <Link
              key={c.id}
              href={`/regions/${slugify(c.name)}`}
              className="card group flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-glow"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-lagoon text-lg text-white">
                🧭
              </span>
              <span className="flex-1 text-sm font-bold text-ink group-hover:text-brand-700">
                {c.name}
              </span>
            </Link>
          ))}
          <Link
            href="/global"
            className="card group flex items-center gap-3 bg-sunset p-4 text-white transition-all hover:-translate-y-0.5"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 text-lg">🌐</span>
            <span className="flex-1 text-sm font-bold">Global plans</span>
          </Link>
        </div>
      </section>

      {/* Why */}
      <section className="container-bp py-16">
        <SectionHead eyebrow="Why BackpackLink" title="Built for the way you travel" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl">
                {f.icon}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-ink/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="container-bp">
          <SectionHead eyebrow="Three steps" title="Connected in under 2 minutes" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <span className="font-display text-6xl font-extrabold text-brand-100">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-2 font-display text-xl font-bold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-bp py-16">
        <div className="relative overflow-hidden rounded-4xl bg-ink p-10 text-center text-white md:p-16">
          <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_70%_20%,#039389,transparent_45%),radial-gradient(circle_at_20%_80%,#ff5a36,transparent_40%)]" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
              Your next trip is data-ready.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-white/70">
              Pick a destination, pay securely, and get your eSIM QR code instantly by email and in
              your account.
            </p>
            <Link href="/destinations" className="btn-primary mt-7">
              Browse eSIM plans
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-coral-500">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">{title}</h2>
      </div>
      {action && (
        <Link href={action.href} className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">
          {action.label}
        </Link>
      )}
    </div>
  );
}

const FEATURES = [
  { icon: '⚡', title: 'Instant delivery', body: 'Your eSIM arrives in seconds. Scan the QR and you’re connected before you leave the gate.' },
  { icon: '🌍', title: '200+ countries', body: 'One store for every destination — local, regional, and worldwide data plans.' },
  { icon: '💸', title: 'No roaming shock', body: 'Transparent prepaid pricing. Pay once, know exactly what you’re getting.' },
  { icon: '📱', title: 'Keep your SIM', body: 'Your eSIM runs alongside your normal number, so you never miss a call or text.' },
  { icon: '📶', title: 'Hotspot ready', body: 'Tether your laptop and travel buddies on most plans, up to 5G speeds.' },
  { icon: '🔁', title: 'Top up anytime', body: 'Running low? Add more data to the same eSIM in a couple of taps.' },
];

const STEPS = [
  { title: 'Choose your plan', body: 'Search your destination and pick the data, validity, and speed that fits your trip.' },
  { title: 'Pay securely', body: 'Checkout with your card. We email your QR code and save it to your account instantly.' },
  { title: 'Scan & go', body: 'Open your camera or eSIM settings, scan the code, and you’re online the moment you land.' },
];
