'use client';

import Link from 'next/link';
import { useApi } from '@/lib/use-api';
import { useAuth } from '@/lib/auth';
import type { Program } from '@/lib/types';

export default function Landing() {
  const { data } = useApi<{ data: Program }>('/api/affiliate/program');
  const { user } = useAuth();
  const p = data?.data;
  const pct = p ? `${p.commissionPercent}%` : '10%';

  return (
    <>
      <section className="bg-lagoon text-white">
        <div className="container-bp grid gap-10 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="chip bg-white/20 text-white">BackpackLink Affiliate Program</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              Earn {pct} on every eSIM your audience buys.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-white/85">
              Travel creator, blogger or community admin? Share your personal link or discount code and get
              paid for every traveller who stays connected with BackpackLink in 200+ countries.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={user ? '/dashboard' : '/join'} className="btn bg-white text-brand-800 hover:-translate-y-0.5">
                {user ? 'Go to my dashboard' : 'Become an affiliate'}
              </Link>
              {!user && (
                <Link href="/login" className="btn border border-white/50 text-white hover:bg-white/10">
                  I already have an account
                </Link>
              )}
            </div>
            {p && !p.open && (
              <p className="mt-4 text-sm text-white/80">Applications are paused right now — check back soon.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stat big={pct} label="commission on every sale" />
            <Stat big={p?.customerDiscountPercent ? `${p.customerDiscountPercent}%` : '—'} label="discount for your audience" />
            <Stat big={`${p?.cookieDays ?? 30} days`} label="referral window" />
            <Stat big="Free" label="to join · no minimum traffic" />
          </div>
        </div>
      </section>

      <section className="container-bp py-16">
        <h2 className="text-center font-display text-3xl font-extrabold text-ink">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Step n={1} title="Apply in 2 minutes" body="Create your account and tell us where you'll share BackpackLink. We review applications quickly." />
          <Step n={2} title="Share your link & code" body={`Get a personal tracking link plus a discount code your followers can use${p?.customerDiscountPercent ? ` for ${p.customerDiscountPercent}% off` : ''} — on the website and in the app.`} />
          <Step n={3} title="Track & get paid" body={`Watch clicks, sales and earnings live in your dashboard. Commissions become payable after ${p?.holdDays ?? 14} days and are paid via PayPal, Wise or bank transfer.`} />
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-bp grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-ink">Who it's for</h2>
            <ul className="mt-4 space-y-2 text-ink/70">
              <li>✈️ Travel YouTubers, TikTokers & Instagram creators</li>
              <li>📝 Travel bloggers & digital-nomad newsletters</li>
              <li>👥 Backpacker, expat & student community admins</li>
              <li>🧳 Tour operators, hostels & travel agents</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-ink">FAQ</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <Faq q="How is a sale credited to me?" a={`When someone clicks your link we remember it for ${p?.cookieDays ?? 30} days. If they buy in that window — or use your discount code at checkout, including in the mobile app — the sale is yours.`} />
              <Faq q="When do I get paid?" a={`Each commission is held for ${p?.holdDays ?? 14} days to cover refunds, then becomes payable. We pay out once your balance reaches ${p?.currency ?? 'USD'} ${p?.minPayout ?? 20}.`} />
              <Faq q="Can I use my own code?" a="Commission isn't paid on your own purchases." />
            </dl>
          </div>
        </div>
      </section>

      <section className="container-bp py-16 text-center">
        <h2 className="font-display text-3xl font-extrabold text-ink">Ready to start earning?</h2>
        <Link href={user ? '/dashboard' : '/join'} className="btn-primary mt-6">
          {user ? 'Open dashboard' : 'Join the program'}
        </Link>
      </section>
    </>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div className="rounded-3xl bg-white/15 p-6 backdrop-blur">
      <p className="font-display text-3xl font-extrabold">{big}</p>
      <p className="mt-1 text-sm text-white/80">{label}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="card p-6">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-lagoon font-display font-bold text-white">{n}</span>
      <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink/60">{body}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <dt className="font-semibold text-ink">{q}</dt>
      <dd className="mt-1 text-ink/60">{a}</dd>
    </div>
  );
}
