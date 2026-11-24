'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useApi } from '@/lib/use-api';

const nav = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/orders', label: 'Orders', icon: '🧾' },
  { href: '/customers', label: 'Customers', icon: '👤' },
  { href: '/campaigns', label: 'Campaigns', icon: '📣' },
  { href: '/coupons', label: 'Coupons', icon: '🏷️' },
  { href: '/influencers', label: 'Influencers', icon: '⭐' },
  { href: '/affiliates', label: 'Affiliate Program', icon: '🤝' },
  { href: '/sources', label: 'Traffic Sources', icon: '📈' },
  { href: '/support', label: 'Support', icon: '💬' },
  { href: '/tips', label: 'Community', icon: '🌍' },
  { href: '/faqs', label: 'FAQ', icon: '❓' },
  { href: '/articles', label: 'Blog', icon: '📝' },
  { href: '/testimonials', label: 'Testimonials', icon: '💬' },
  { href: '/settings', label: 'Pricing & Settings', icon: '⚙️' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { data: ver } = useApi<{ version: string }>('/api/version');
  const isLogin = pathname === '/login';

  useEffect(() => {
    if (isLogin || loading) return;
    if (!user || user.role !== 'admin') router.replace('/login');
  }, [isLogin, loading, user, router]);

  if (isLogin) return <>{children}</>;
  if (loading || !user || user.role !== 'admin') {
    return <div className="container-bp py-24 text-center text-ink/40">Loading…</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-brand-100 bg-white">
        <div className="container-bp flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-lg font-extrabold tracking-tight text-ink">
            Backpack<span className="text-brand-600">Link</span>{' '}
            <span className="chip bg-ink text-white">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-ink/50 sm:block">{user.email}</span>
            <button onClick={logout} className="btn-ghost px-4 py-2">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="container-bp py-8">
        <div className="grid gap-8 lg:grid-cols-[210px_1fr]">
          <aside>
            <nav className="card sticky top-8 space-y-1 p-2">
              {nav.map((n) => {
                const active = pathname === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active ? 'bg-lagoon text-white' : 'text-ink/70 hover:bg-sand-50'
                    }`}
                  >
                    <span>{n.icon}</span>
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main>{children}</main>
        </div>
      </div>
      <footer className="border-t border-brand-100 py-4 text-center text-xs text-ink/40">
        BackpackLink Admin{ver?.version ? ` · v${ver.version}` : ''}
      </footer>
    </div>
  );
}
