import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How eSIM works — set up in 2 minutes',
  description:
    'Learn how a travel eSIM works: choose a plan, pay, scan the QR code, and connect on arrival. No physical SIM, no roaming charges.',
  alternates: { canonical: '/how-it-works' },
};

const STEPS = [
  { t: 'Pick your destination & plan', b: 'Search any of 200+ countries or a whole region, then choose the data amount and validity that fits your trip.' },
  { t: 'Pay securely by card', b: 'Checkout in seconds. We instantly create your eSIM and email you a QR code — it’s also saved in your account.' },
  { t: 'Scan the QR code', b: 'Open your phone’s eSIM settings (or camera) and scan. Your data plan installs in moments.' },
  { t: 'Connect on arrival', b: 'Turn on the eSIM line when you land. You’re online immediately — keep your normal SIM for calls and texts.' },
];

export default function HowItWorksPage() {
  return (
    <div className="container-bp py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-coral-500">How it works</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold text-ink sm:text-4xl">
        Connected in four simple steps
      </h1>
      <p className="mt-3 max-w-2xl text-ink/60">
        An eSIM is a digital SIM card already built into most modern phones. No plastic, no swapping
        — just scan and go.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {STEPS.map((s, i) => (
          <div key={s.t} className="card p-7">
            <span className="font-display text-5xl font-extrabold text-brand-100">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h2 className="mt-2 font-display text-xl font-bold text-ink">{s.t}</h2>
            <p className="mt-2 text-sm text-ink/60">{s.b}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 card p-7">
        <h2 className="font-display text-lg font-bold text-ink">Is my phone compatible?</h2>
        <p className="mt-2 text-sm text-ink/60">
          Most phones from 2018 onward support eSIM — including iPhone XS and newer, Google Pixel 3
          and newer, and recent Samsung Galaxy S/Note/Z models. Your phone must also be
          carrier-unlocked.
        </p>
      </div>

      <Link href="/destinations" className="btn-primary mt-10">
        Find your eSIM
      </Link>
    </div>
  );
}
