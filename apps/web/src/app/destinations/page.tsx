import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { CountrySearch } from '@/components/CountrySearch';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'All eSIM destinations — 200+ countries',
  description:
    'Browse travel eSIM data plans for 200+ countries. Find instant prepaid data for your next trip with BackpackLink.',
  alternates: { canonical: '/destinations' },
};

export default async function DestinationsPage() {
  const countries = await api.countries();

  return (
    <div className="container-bp py-12">
      <p className="text-sm font-bold uppercase tracking-wider text-coral-500">Destinations</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold text-ink sm:text-4xl">
        Find an eSIM for any country
      </h1>
      <p className="mt-2 max-w-2xl text-ink/60">
        {countries.length} destinations available. Pick where you&apos;re going to see data plans,
        coverage, and prices.
      </p>

      <div className="mt-8">
        <CountrySearch countries={countries} />
      </div>
    </div>
  );
}
