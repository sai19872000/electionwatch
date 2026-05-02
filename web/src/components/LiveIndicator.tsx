'use client';

import { useEffect, useState } from 'react';
import { isPreCounting } from '@/lib/counting';

interface LiveIndicatorProps {
  asOf: string;
  stale: boolean;
}

export function LiveIndicator({ asOf, stale }: LiveIndicatorProps) {
  // Suppress pre-counting — there is no "live" data yet, the CountdownBanner shows the wait.
  const [pre, setPre] = useState(true);
  useEffect(() => {
    setPre(isPreCounting());
    const id = setInterval(() => setPre(isPreCounting()), 30000);
    return () => clearInterval(id);
  }, []);
  if (pre) return null;

  const ts = new Date(asOf);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - ts.getTime()) / 1000);
  const isLive = diffSec < 60;

  const relTime =
    diffSec < 60
      ? `${diffSec}s ago`
      : diffSec < 3600
      ? `${Math.floor(diffSec / 60)}m ago`
      : `${Math.floor(diffSec / 3600)}h ago`;

  return (
    <div
      className="flex items-center gap-2 text-xs text-muted"
      aria-live="polite"
      aria-label={`Last updated ${relTime}`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          isLive && !stale ? 'bg-ok animate-pulse' : 'bg-warn'
        }`}
      />
      <span>
        Updated {relTime} •{' '}
        <span className={isLive && !stale ? 'text-ok' : 'text-warn'}>
          {isLive && !stale ? 'LIVE' : 'STALE'}
        </span>
      </span>
    </div>
  );
}
