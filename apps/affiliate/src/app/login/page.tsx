'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Field } from '@/components/Field';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-bp grid place-items-center py-16">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-8">
        <h1 className="font-display text-2xl font-extrabold text-ink">Affiliate log in</h1>
        <p className="text-sm text-ink/50">Use your BackpackLink account.</p>
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        {error && <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm text-coral-700">{error}</p>}
        <button disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'Signing in…' : 'Log in'}
        </button>
        <p className="text-center text-sm text-ink/50">
          New here?{' '}
          <Link href="/join" className="font-semibold text-brand-700">
            Join the program
          </Link>
        </p>
      </form>
    </div>
  );
}
