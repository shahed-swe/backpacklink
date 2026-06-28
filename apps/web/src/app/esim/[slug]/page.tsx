import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, findCountryBySlug } from '@/lib/api';
import { PlanCard } from '@/components/PlanCard';
import { money } from '@/lib/format';

export const revalidate = 1800;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const country = await findCountryBySlug(slug);
  if (!country) return { title: 'Destination not found' };
  return {
    title: `${country.name} eSIM — travel data plans`,
    description: `Buy an eSIM for ${country.name}. Instant prepaid data plans with 4G/5G coverage, hotspot support, and no roaming charges. Scan and connect on arrival.`,
    alternates: { canonical: `/esim/${slug}` },
    openGraph: {
      title: `${country.name} eSIM — travel data plans · BackpackLink`,
      description: `Instant eSIM data for ${country.name}. No roaming bills.`,
    },
  };
}

export default async function CountryPage({ params }: Params) {
  const { slug } = await params;
  const country = await findCountryBySlug(slug);
  if (!country) notFound();

  const [dataOnly, voice] = await Promise.all([
    api.countryPackages(country.id, 'DATA-ONLY'),
    api.countryPackages(country.id, 'DATA-VOICE-SMS'),
  ]);

  const cheapest = [...dataOnly, ...voice].sort((a, b) => a.price.retail - b.price.retail)[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${country.name} Travel eSIM`,
    description: `Prepaid travel eSIM data plans for ${country.name}.`,
    brand: { '@type': 'Brand', name: 'BackpackLink' },
    ...(cheapest && {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: cheapest.price.currency,
        lowPrice: cheapest.price.retail,
        offerCount: dataOnly.length + voice.length,
      },
    }),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* hero */}
      <section className="bg-lagoon">
        <div className="container-bp py-14 text-white">
          <Link href="/destinations" className="text-sm font-semibold text-white/70 hover:text-white">
            ← All destinations
          </Link>
          <div className="mt-4 flex items-center gap-4">
            {country.flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={country.flag} alt={`${country.name} flag`} width={64} height={44} className="h-11 w-16 rounded-lg object-cover shadow-card" />
            )}
            <div>
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{country.name} eSIM</h1>
              <p className="text-white/80">
                {dataOnly.length + voice.length} plans
                {cheapest && <> · from {money(cheapest.price.retail, cheapest.price.currency)}</>}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-bp py-12">
        {dataOnly.length + voice.length === 0 ? (
          <EmptyState country={country.name} />
        ) : (
          <div className="space-y-12">
            {dataOnly.length > 0 && (
              <PlanSection title="Data plans" subtitle="Mobile data only" packages={dataOnly} />
            )}
            {voice.length > 0 && (
              <PlanSection
                title="Data + calls + texts"
                subtitle="Includes voice & SMS"
                packages={voice}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanSection({
  title,
  subtitle,
  packages,
}: {
  title: string;
  subtitle: string;
  packages: import('@/lib/types').Package[];
}) {
  const sorted = [...packages].sort((a, b) => a.price.retail - b.price.retail);
  return (
    <section>
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-xl font-extrabold text-ink">{title}</h2>
        <span className="text-sm text-ink/40">{subtitle}</span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((p) => (
          <PlanCard key={p.id} pkg={p} />
        ))}
      </div>
    </section>
  );
}

function EmptyState({ country }: { country: string }) {
  return (
    <div className="card mx-auto max-w-md p-10 text-center">
      <p className="text-4xl">🧳</p>
      <h2 className="mt-3 font-display text-xl font-bold text-ink">No plans yet for {country}</h2>
      <p className="mt-2 text-sm text-ink/60">
        We&apos;re expanding coverage all the time. Check a nearby region or browse global plans.
      </p>
      <Link href="/global" className="btn-primary mt-5">
        See global plans
      </Link>
    </div>
  );
}
