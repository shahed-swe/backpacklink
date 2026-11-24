'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/client-api';
import { Field, PayoutSelect } from '@/components/Field';

// One form: creates the account (if not signed in) and submits the application.
export default function Join() {
  const { user, loading, signup } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    platform: 'instagram',
    handle: '',
    website: '',
    country: '',
    audience: '',
    payoutMethod: 'paypal',
    payoutDetails: '',
    agree: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  // Already an affiliate? Go straight to the dashboard.
  useEffect(() => {
    if (!user) return;
    apiFetch<{ data: unknown }>('/api/affiliate/me')
      .then((r) => {
        if (r.data) router.replace('/dashboard');
      })
      .catch(() => {});
    setF((s) => ({ ...s, name: s.name || user.name || '' }));
  }, [user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!f.agree) return setError('Please accept the affiliate terms.');
    setBusy(true);
    try {
      if (!user) await signup({ email: f.email, password: f.password, name: f.name, country: f.country || undefined });
      await apiFetch('/api/affiliate/apply', {
        method: 'POST',
        body: {
          name: f.name,
          platform: f.platform || undefined,
          handle: f.handle || undefined,
          website: f.website || undefined,
          country: f.country || undefined,
          audience: f.audience || undefined,
          payoutMethod: f.payoutMethod,
          payoutDetails: f.payoutDetails || undefined,
          agree: true,
        },
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  }

  if (loading) return <p className="py-24 text-center text-ink/40">Loading…</p>;

  return (
    <div className="container-bp py-12">
      <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-5 p-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Apply to become an affiliate</h1>
          <p className="mt-1 text-sm text-ink/50">
            {user ? `Applying as ${user.email}.` : (
              <>Already have a BackpackLink account? <Link href="/login" className="font-semibold text-brand-700">Log in first</Link>.</>
            )}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name / brand" value={f.name} onChange={set('name')} required />
          <Field label="Country" value={f.country} onChange={set('country')} />
          {!user && (
            <>
              <Field label="Email" type="email" value={f.email} onChange={set('email')} required />
              <Field label="Password (min 6)" type="password" value={f.password} onChange={set('password')} required />
            </>
          )}
          <label className="block">
            <span className="text-sm font-semibold text-ink/70">Main platform</span>
            <select
              value={f.platform}
              onChange={(e) => set('platform')(e.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 outline-none focus:border-brand-500"
            >
              {['instagram', 'youtube', 'tiktok', 'blog', 'facebook', 'x', 'newsletter', 'community', 'other'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <Field label="Handle (@)" value={f.handle} onChange={set('handle')} placeholder="@yourhandle" />
          <div className="sm:col-span-2">
            <Field label="Link to your channel / website" value={f.website} onChange={set('website')} placeholder="https://" />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Tell us about your audience"
              textarea
              value={f.audience}
              onChange={set('audience')}
              placeholder="Followers / monthly visitors, where they travel, how you plan to promote BackpackLink…"
            />
          </div>
          <PayoutSelect value={f.payoutMethod} onChange={set('payoutMethod')} />
          <Field label="Payout details" value={f.payoutDetails} onChange={set('payoutDetails')} placeholder="PayPal / Wise email or IBAN" />
        </div>

        <label className="flex items-start gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={f.agree} onChange={(e) => set('agree')(e.target.checked)} className="mt-1" />
          <span>
            I agree to the <Link href="/terms" target="_blank" className="font-semibold text-brand-700 underline">affiliate terms</Link>.
          </span>
        </label>

        {error && <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm text-coral-700">{error}</p>}
        <button disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}
