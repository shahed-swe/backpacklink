import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Sora } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PromoBar } from '@/components/PromoBar';
import { AttributionCapture } from '@/components/AttributionCapture';
import { AuthProvider } from '@/lib/auth';
import { api } from '@/lib/api';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });
const display = Sora({ subsets: ['latin'], variable: '--font-display' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BackpackLink — Travel eSIM data plans for 200+ countries',
    template: '%s · BackpackLink',
  },
  description:
    'Instant eSIM data plans for travelers in 200+ countries. Stay connected the moment you land — no roaming charges, no physical SIM. Buy, scan, go.',
  keywords: ['travel eSIM', 'international data plan', 'eSIM', 'roaming', 'prepaid data', 'global eSIM'],
  openGraph: {
    type: 'website',
    siteName: 'BackpackLink',
    title: 'BackpackLink — Travel eSIM data plans for 200+ countries',
    description: 'Instant eSIM data plans for travelers. No roaming bills. Buy, scan, go.',
    url: siteUrl,
  },
  twitter: { card: 'summary_large_image' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { bar } = await api.promotions('web');
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans">
        <AuthProvider>
          <AttributionCapture />
          {bar && <PromoBar promo={bar} />}
          <Header />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
