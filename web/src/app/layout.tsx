import type { Metadata } from 'next';
import './globals.css';
import { CountdownBanner } from '@/components/CountdownBanner';

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
    <html lang="en" className="dark">
      <body className="bg-[#0f0f0f] text-white min-h-screen font-sans antialiased">
        <CountdownBanner />
        {children}
      </body>
    </html>
  );
}
