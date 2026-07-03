import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Troubleshooting & help',
  description: 'Fix common eSIM issues: no data, installation problems, activation. Or chat with a real human.',
  alternates: { canonical: '/help' },
};

const ISSUES = [
  {
    q: 'No internet after installing?',
    steps: [
      'Make sure the BackpackLink eSIM line is turned ON for data (Settings → Cellular/Mobile data).',
      'Enable Data Roaming for the eSIM line (it stays on the local network — no roaming charges).',
      'Toggle Airplane mode on and off, or restart your phone.',
    ],
  },
  {
    q: 'The QR code won’t scan / install?',
    steps: [
      'Install over Wi-Fi before you travel.',
      'Use the one-tap “iOS install / Android install” button on your eSIM instead of the QR.',
      'Or add it manually with the SM-DP+ address and activation code shown on your eSIM.',
    ],
  },
  {
    q: 'Slow or no signal in some spots?',
    steps: [
      'Manually select a supported network in Settings → Cellular → Network Selection.',
      'Check the plan’s coverage list — some areas only have 3G/4G.',
    ],
  },
  {
    q: 'Data ran out?',
    steps: ['Buy a top-up or a new plan from the app — it installs onto the same eSIM in seconds.'],
  },
];

export default function HelpPage() {
  return (
    <div className="container-bp py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-coral-500">Help</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold text-ink sm:text-4xl">Troubleshooting</h1>
      <p className="mt-2 max-w-2xl text-ink/60">Most issues are fixed in under a minute. Still stuck? Chat with a real human.</p>

      {/* big troubleshooting CTA */}
      <Link href="/support" className="mt-6 flex items-center justify-between rounded-3xl bg-sunset p-6 text-white shadow-glow transition hover:-translate-y-0.5">
        <div>
          <p className="font-display text-xl font-extrabold">Chat with support</p>
          <p className="text-white/85">Real humans, fast replies — not bots.</p>
        </div>
        <span className="text-3xl">💬</span>
      </Link>

      <div className="mt-8 space-y-3">
        {ISSUES.map((it) => (
          <details key={it.q} className="card group p-5">
            <summary className="flex cursor-pointer items-center justify-between font-display font-bold text-ink">
              {it.q}
              <span className="text-brand-600 transition-transform group-open:rotate-45">＋</span>
            </summary>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink/70">
              {it.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </details>
        ))}
      </div>
    </div>
  );
}
