import Link from 'next/link';
import { Logo } from './Logo';
import { api } from '@/lib/api';

export async function Footer() {
  const version = await api.version();
  return (
    <footer className="mt-24 border-t border-brand-100 bg-white">
      <div className="container-bp grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-ink/60">
            Stay connected in 200+ countries. Instant eSIM data plans for travelers — no roaming
            bills, no physical SIM.
          </p>
        </div>
        <FooterCol
          title="Explore"
          links={[
            { href: '/destinations', label: 'All destinations' },
            { href: '/regions', label: 'Regional plans' },
            { href: '/global', label: 'Global plans' },
          ]}
        />
        <FooterCol
          title="Support"
          links={[
            { href: '/how-it-works', label: 'How it works' },
            { href: '/faq', label: 'FAQ' },
            { href: '/help/install', label: 'Install guide' },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { href: '/about', label: 'About' },
            { href: '/terms', label: 'Terms' },
            { href: '/privacy', label: 'Privacy' },
          ]}
        />
      </div>
      <div className="border-t border-brand-100">
        <div className="container-bp flex flex-col items-center justify-between gap-2 py-6 text-xs text-ink/50 sm:flex-row">
          <p>© {new Date().getFullYear()} BackpackLink. All rights reserved.</p>
          <p>
            Powered by global eSIM connectivity.
            {version && <span className="ml-2 text-ink/40">v{version}</span>}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-bold text-ink">{title}</h4>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-ink/60 transition-colors hover:text-brand-700">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
