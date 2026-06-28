import Link from 'next/link';
import { Logo } from './Logo';
import { AccountNav } from './AccountNav';

const nav = [
  { href: '/destinations', label: 'Destinations' },
  { href: '/regions', label: 'Regions' },
  { href: '/global', label: 'Global' },
  { href: '/how-it-works', label: 'How it works' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-100/60 bg-sand-50/80 backdrop-blur-lg">
      <div className="container-bp flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm font-semibold text-ink/70 transition-colors hover:text-brand-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <AccountNav />
      </div>
    </header>
  );
}
