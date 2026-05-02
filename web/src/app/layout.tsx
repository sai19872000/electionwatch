import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CountdownBanner } from '@/components/CountdownBanner';
import { RootClient } from '@/components/aura/RootClient';

const geistSans = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
});

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
    <html lang="en" data-theme="dark" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-bg text-fg antialiased">
        <CountdownBanner />
        <RootClient>
          {children}
        </RootClient>
      </body>
    </html>
  );
}
