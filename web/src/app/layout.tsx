import type { Metadata } from 'next';
import './globals.css';
import { CountdownBanner } from '@/components/CountdownBanner';
import { RootClient } from '@/components/aura/RootClient';

export const metadata: Metadata = {
  title: {
    default: 'ElectionWatch India 2026',
    template: '%s · ElectionWatch',
  },
  description: 'Live assembly election results for May 4, 2026 counting day — Assam, Kerala, Tamil Nadu, West Bengal, Puducherry',
  metadataBase: new URL('https://electionwatch.saiteja.ai'),
  openGraph: {
    siteName: 'ElectionWatch India 2026',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased">
        <CountdownBanner />
        <RootClient>
          {children}
        </RootClient>
      </body>
    </html>
  );
}
