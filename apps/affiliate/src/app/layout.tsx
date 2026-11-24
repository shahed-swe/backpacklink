import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Sora } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Shell } from '@/components/Shell';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });
const display = Sora({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_AFFILIATE_URL ?? 'https://affiliate.backpacklink.com'),
  title: {
    default: 'BackpackLink Affiliate Program — earn on every eSIM you refer',
    template: '%s · BackpackLink Affiliates',
  },
  description:
    'Join the BackpackLink affiliate program. Share your link or discount code with travellers and earn commission on every eSIM sale.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans">
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
