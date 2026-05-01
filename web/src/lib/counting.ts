// Counting starts: May 4, 2026, 08:00 IST (UTC+5:30) → 2026-05-04T02:30:00Z
export const COUNTING_START_ISO = '2026-05-04T08:00:00+05:30';
export const COUNTING_START_MS = new Date(COUNTING_START_ISO).getTime();

export function msUntilCounting(now: number = Date.now()): number {
  return COUNTING_START_MS - now;
}

export function isPreCounting(now: number = Date.now()): boolean {
  return msUntilCounting(now) > 0;
}
