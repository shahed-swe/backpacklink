'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Field } from '@/components/Field';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', country: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signup({
        name: form.name || undefined,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        country: form.country || undefined,
      });
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-bp py-16">
      <div className="mx-auto max-w-sm">
        <h1 className="font-display text-3xl font-extrabold text-ink">Create your account</h1>
        <p className="mt-1 text-ink/60">One account for all your eSIMs, usage, and orders.</p>

        <form onSubmit={onSubmit} className="mt-8 card space-y-4 p-6">
          {error && (
            <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">{error}</p>
          )}
          <Field label="Full name" value={form.name} onChange={set('name')} placeholder="Optional" />
          <Field label="Email" type="email" value={form.email} onChange={set('email')} required />
          <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="Optional" />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            placeholder="At least 6 characters"
          />
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink/60">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
