import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Coverage } from '@/components/Coverage';
import { formatData, formatValidity, money, topGeneration } from '@/lib/format';

export const revalidate = 1800;

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const pkg = await api.packageDetail(id);
  if (!pkg) return { title: 'Plan not found' };
  return {
    title: `${pkg.name} — ${money(pkg.price.retail, pkg.price.currency)}`,
    description: `${formatData(pkg)} of data for ${formatValidity(pkg)}. ${pkg.coverage.length} country coverage with up to ${topGeneration(pkg) ?? '4G'} speeds. Instant eSIM delivery.`,
    alternates: { canonical: `/plans/${id}` },
  };
}

export default async function PlanPage({ params }: Params) {
  const { id } = await params;
  const pkg = await api.packageDetail(id);
  if (!pkg) notFound();

  const gen = topGeneration(pkg);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pkg.name,
    brand: { '@type': 'Brand', name: 'BackpackLink' },
    offers: {
      '@type': 'Offer',
      price: pkg.price.retail,
      priceCurrency: pkg.price.currency,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <div className="container-bp py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/destinations" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Back to destinations
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* main */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            {pkg.data.unlimited && <span className="chip bg-coral-100 text-coral-700">Unlimited</span>}
            {gen && <span className="chip bg-brand-50 text-brand-700">Up to {gen}</span>}
            {pkg.scope && <span className="chip bg-sand-100 text-ink/60 capitalize">{pkg.scope}</span>}
            {pkg.features.tether && <span className="chip bg-sand-100 text-ink/60">Hotspot</span>}
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">{pkg.name}</h1>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Data" value={formatData(pkg)} />
            <Stat label="Validity" value={formatValidity(pkg)} />
            <Stat label="Speed" value={gen ?? '—'} />
            <Stat
              label="Type"
              value={pkg.type === 'DATA-VOICE-SMS' ? 'Data + Calls' : 'Data only'}
            />
          </div>

          {pkg.type === 'DATA-VOICE-SMS' && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Voice" value={`${pkg.voice.quantity} ${pkg.voice.unit}`} />
              <Stat label="SMS" value={`${pkg.sms.quantity}`} />
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-display text-xl font-extrabold text-ink">Coverage & networks</h2>
            <p className="mt-1 text-sm text-ink/50">
              Works on {pkg.coverage.length} {pkg.coverage.length === 1 ? 'country' : 'countries'}.
            </p>
            <div className="mt-4">
              <Coverage coverage={pkg.coverage} />
            </div>
          </div>

          <div className="mt-8 card p-6">
            <h3 className="font-display font-bold text-ink">Good to know</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink/70">
              {pkg.features.activationDescription && <li>• {pkg.features.activationDescription}</li>}
              <li>• Delivered instantly as a QR code after payment.</li>
              <li>• Keep your primary SIM active for calls and texts.</li>
              {pkg.features.canRenew && <li>• Top-up supported — add more data later.</li>}
            </ul>
          </div>
        </div>

        {/* buy box */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 card p-6">
            <p className="text-sm text-ink/40">Total</p>
            <p className="font-display text-4xl font-extrabold text-ink">
              {money(pkg.price.retail, pkg.price.currency)}
            </p>
            <p className="mt-1 text-sm text-ink/50">
              {formatData(pkg)} · {formatValidity(pkg)}
            </p>

            <Link href={`/checkout/${pkg.id}`} className="btn-primary mt-6 w-full">
              Buy this eSIM
            </Link>
            <p className="mt-3 text-center text-xs text-ink/40">
              Instant QR delivery · secure card payment
            </p>

            <div className="mt-6 space-y-2 border-t border-brand-100 pt-4 text-sm text-ink/60">
              <Row label="Coverage" value={`${pkg.coverage.length} countries`} />
              <Row label="Network" value={gen ? `Up to ${gen}` : 'Mobile data'} />
              <Row label="Tethering" value={pkg.features.tether ? 'Yes' : 'No'} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
