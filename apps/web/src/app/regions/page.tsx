import type { Metadata } from 'next';
import Link from 'next/link';
import { api, slugify } from '@/lib/api';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Regional eSIM plans — multi-country data',
  description:
    'One eSIM for a whole region. Browse multi-country travel data plans for Europe, Asia, Africa and more.',
  alternates: { canonical: '/regions' },
};

export default async function RegionsPage() {
  const continents = await api.continents();
  return (
    <div className="container-bp py-12">
      <p className="text-sm font-bold uppercase tracking-wider text-coral-500">Regional plans</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold text-ink sm:text-4xl">
        One eSIM, a whole region
      </h1>
      <p className="mt-2 max-w-2xl text-ink/60">
        Crossing borders? Regional plans keep you connected across many countries on a single eSIM.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {continents.map((c) => (
          <Link
            key={c.id}
            href={`/regions/${slugify(c.name)}`}
            className="card group flex items-center gap-4 p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-lagoon text-2xl text-white">
              🧭
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink group-hover:text-brand-700">
                {c.name}
              </h2>
              <p className="text-sm text-ink/50">View regional plans →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
