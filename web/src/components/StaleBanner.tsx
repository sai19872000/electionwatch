'use client';

import { useEffect, useState } from 'react';
import { isPreCounting } from '@/lib/counting';

interface StaleBannerProps {
  dataSource: string;
  stale: boolean;
  asOf: string;
}

export function StaleBanner({ dataSource, stale, asOf }: StaleBannerProps) {
  // Suppress pre-counting — the CountdownBanner explains the empty state.
  const [pre, setPre] = useState(true);
  useEffect(() => {
    setPre(isPreCounting());
    const id = setInterval(() => setPre(isPreCounting()), 30000);
    return () => clearInterval(id);
  }, []);

  const show = !pre && (dataSource === 'watchdog_minimal' || stale);
  if (!show) return null;

  const ts = new Date(asOf);
  const hhmm = ts.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

  return (
    <div
      role="alert"
      className="w-full bg-amber-900/80 border-b border-amber-600 px-4 py-2 text-amber-200 text-sm text-center"
    >
      {dataSource === 'watchdog_minimal'
        ? `ECI portal degraded — last refresh ${hhmm} IST`
        : `Data may be stale — last refresh ${hhmm} IST`}
    </div>
  );
}
