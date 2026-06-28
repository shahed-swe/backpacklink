import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'eSIM FAQ — common questions answered',
  description:
    'Answers to common questions about travel eSIMs: compatibility, installation, data usage, top-ups, and refunds.',
  alternates: { canonical: '/faq' },
};

const FAQS = [
  { q: 'What is an eSIM?', a: 'An eSIM is a digital SIM built into your phone. Instead of inserting a plastic card, you scan a QR code to install a data plan.' },
  { q: 'Will it work on my phone?', a: 'Most phones from 2018 onward support eSIM (iPhone XS+, Pixel 3+, recent Samsung Galaxy). Your phone must be carrier-unlocked.' },
  { q: 'Do I keep my own phone number?', a: 'Yes. The eSIM runs as a separate data line, so your primary SIM and number stay active for calls and texts.' },
  { q: 'When should I install the eSIM?', a: 'You can install it any time before your trip while you have Wi-Fi. Most plans start counting only when you connect at your destination.' },
  { q: 'Can I top up if I run out of data?', a: 'On supported plans, yes — you can add more data to the same eSIM from your account in a couple of taps.' },
  { q: 'How fast will my data be?', a: 'Plans run on local partner networks at up to 4G/5G speeds where available, shown on each plan’s coverage list.' },
];

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="container-bp py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-sm font-bold uppercase tracking-wider text-coral-500">FAQ</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold text-ink sm:text-4xl">
        Questions, answered
      </h1>

      <div className="mt-8 max-w-3xl space-y-3">
        {FAQS.map((f) => (
          <details key={f.q} className="card group p-5 [&_summary]:cursor-pointer">
            <summary className="flex items-center justify-between font-display font-bold text-ink marker:content-['']">
              {f.q}
              <span className="text-brand-600 transition-transform group-open:rotate-45">＋</span>
            </summary>
            <p className="mt-3 text-sm text-ink/60">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
