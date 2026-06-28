'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export function AccountNav() {
  const { user, loading } = useAuth();

  if (loading) return <span className="h-9 w-24" aria-hidden />;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/account" className="btn-dark px-5 py-2.5">
          {user.name?.split(' ')[0] ?? 'My account'}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="hidden text-sm font-semibold text-ink/70 hover:text-brand-700 sm:block">
        Sign in
      </Link>
      <Link href="/signup" className="btn-primary px-5 py-2.5">
        Get an eSIM
      </Link>
    </div>
  );
}
