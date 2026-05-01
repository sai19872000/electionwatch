'use client';

import { useEffect, useState } from 'react';
import { msUntilCounting } from '@/lib/counting';

function format(ms: number): { d: number; h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

const pad = (n: number) => n.toString().padStart(2, '0');

export function CountdownBanner() {
  // SSR/initial paint: render banner with placeholder ticker (avoids hydration mismatch).
  // After mount, tick every second from real client clock.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(msUntilCounting());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Hide once counting has started (only after we know client time).
  if (remaining !== null && remaining <= 0) return null;

  const t = remaining === null ? null : format(remaining);

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 border-b border-emerald-500 px-4 py-3 text-white text-center"
    >
      <p className="text-sm sm:text-base font-semibold tracking-tight">
        Counting starts May 4 — live data will populate automatically
      </p>
      <p
        className="mt-1 text-xs sm:text-sm font-mono tabular-nums text-emerald-100"
        suppressHydrationWarning
        aria-label={
          t
            ? `Time remaining: ${t.d} days, ${t.h} hours, ${t.m} minutes, ${t.s} seconds`
            : 'Loading countdown'
        }
      >
        {t ? (
          <>
            <span className="font-bold">{t.d}</span>d{' '}
            <span className="font-bold">{pad(t.h)}</span>h{' '}
            <span className="font-bold">{pad(t.m)}</span>m{' '}
            <span className="font-bold">{pad(t.s)}</span>s
          </>
        ) : (
          <span className="font-bold">— d — h — m — s</span>
        )}
        <span className="ml-2 text-emerald-200/80">until 08:00 IST · May 4, 2026</span>
      </p>
    </div>
  );
}
