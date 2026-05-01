'use client';

import useSWR from 'swr';
import type { Snapshot } from '@/lib/types';
import { BAKED_SNAPSHOT } from '@/lib/baked';

const BASE = process.env.NEXT_PUBLIC_DATA_BASE ?? '/fixtures';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useSnapshot() {
  const { data, error, isLoading } = useSWR<Snapshot>(
    `${BASE}/snapshot.json`,
    fetcher,
    {
      refreshInterval: 20000,
      // Baked snapshot is bundled into the JS so the overview renders
      // on first paint, even if the R2 fetch fails (e.g. DNS not wired).
      fallbackData: BAKED_SNAPSHOT,
      keepPreviousData: true,
    }
  );
  return { snapshot: data, error, isLoading };
}
