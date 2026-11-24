'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://backpacklink.com';

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-brand-100 bg-white">
        <div className="container-bp flex h-16 items-center justify-between gap-3">
          <Link href="/" className="font-display text-lg font-extrabold tracking-tight text-ink">
            Backpack<span className="text-brand-600">Link</span>{' '}
            <span className="chip bg-lagoon text-white">Affiliates</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm font-semibold">
            {user ? (
              <>
                <Link href="/dashboard" className="hidden px-3 py-2 text-ink/70 hover:text-ink sm:block">
                  Dashboard
                </Link>
                <button onClick={logout} className="btn-ghost px-4 py-2">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-2 text-ink/70 hover:text-ink">
                  Log in
                </Link>
                <Link href="/join" className="btn-primary px-4 py-2">
                  Join now
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-brand-100 py-6 text-center text-xs text-ink/40">
        © BackpackLink ·{' '}
        <a href={SITE} className="underline">
          backpacklink.com
        </a>{' '}
        ·{' '}
        <Link href="/terms" className="underline">
          Affiliate terms
        </Link>
      </footer>
    </div>
  );
}
