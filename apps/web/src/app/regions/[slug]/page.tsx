import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api, findContinentBySlug } from '@/lib/api';
import { PlanCard } from '@/components/PlanCard';
import { money } from '@/lib/format';

export const revalidate = 1800;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const region = await findContinentBySlug(slug);
  if (!region) return { title: 'Region not found' };
  return {
    title: `${region.name} eSIM — regional travel data`,
    description: `Multi-country eSIM data plans covering ${region.name}. One eSIM, many borders, no roaming charges.`,
    alternates: { canonical: `/regions/${slug}` },
  };
}

export default async function RegionPage({ params }: Params) {
  const { slug } = await params;
  const region = await findContinentBySlug(slug);
  if (!region) notFound();

  const packages = await api.continentPackages(region.id, 'DATA-ONLY');
  const sorted = [...packages].sort((a, b) => a.price.retail - b.price.retail);
  const cheapest = sorted[0];

  return (
    <div>
      <section className="bg-lagoon">
        <div className="container-bp py-14 text-white">
          <Link href="/regions" className="text-sm font-semibold text-white/70 hover:text-white">
            ← All regions
          </Link>
          <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">{region.name} eSIM</h1>
          <p className="text-white/80">
            {packages.length} regional plans
            {cheapest && <> · from {money(cheapest.price.retail, cheapest.price.currency)}</>}
          </p>
        </div>
      </section>

      <div className="container-bp py-12">
        {sorted.length === 0 ? (
          <div className="card mx-auto max-w-md p-10 text-center">
            <p className="text-4xl">🧭</p>
            <h2 className="mt-3 font-display text-xl font-bold">No regional plans right now</h2>
            <Link href="/destinations" className="btn-primary mt-5">
              Browse by country
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((p) => (
              <PlanCard key={p.id} pkg={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
