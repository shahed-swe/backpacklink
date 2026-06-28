'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function AuthGate({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = typeof window !== 'undefined' ? window.location.pathname : '/account';
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    } else if (admin && user.role !== 'admin') {
      router.replace('/account');
    }
  }, [user, loading, admin, router]);

  if (loading || !user || (admin && user.role !== 'admin')) {
    return <div className="container-bp py-24 text-center text-ink/40">Loading…</div>;
  }
  return <>{children}</>;
}
