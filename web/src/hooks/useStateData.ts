'use client';

import useSWR from 'swr';
import type { StateDetail } from '@/lib/types';
import { bakedStateDetail } from '@/lib/baked';

const BASE = process.env.NEXT_PUBLIC_DATA_BASE ?? '/fixtures';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useStateData(code: string) {
  const { data, error, isLoading } = useSWR<StateDetail>(
    `${BASE}/state_${code}.json`,
    fetcher,
    {
      refreshInterval: 20000,
      // Baked fixture is bundled into the JS so the full roster renders
      // on first paint, even if the R2 fetch fails (e.g. DNS not wired).
      fallbackData: bakedStateDetail(code),
      keepPreviousData: true,
    }
  );
  return { stateData: data, error, isLoading };
}
