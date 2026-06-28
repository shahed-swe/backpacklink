import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { PlanCard } from '@/components/PlanCard';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Global eSIM plans — worldwide travel data',
  description:
    'One eSIM for the whole world. Global travel data plans that work across dozens of countries on every continent.',
  alternates: { canonical: '/global' },
};

export default async function GlobalPage() {
  const packages = await api.globalPackages('DATA-ONLY');
  const sorted = [...packages].sort((a, b) => a.price.retail - b.price.retail);

  return (
    <div>
      <section className="bg-sunset">
        <div className="container-bp py-14 text-white">
          <span className="chip bg-white/15 text-white">🌐 Worldwide coverage</span>
          <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">Global eSIM plans</h1>
          <p className="mt-1 max-w-xl text-white/85">
            The ultimate plan for multi-country trips and digital nomads — one eSIM that follows you
            across continents.
          </p>
        </div>
      </section>

      <div className="container-bp py-12">
        {sorted.length === 0 ? (
          <p className="py-16 text-center text-ink/50">Global plans are being updated — check back soon.</p>
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
