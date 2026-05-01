'use client';

import useSWR from 'swr';
import type { Snapshot, RawScraperSnapshot } from '@/lib/types';
import { BAKED_SNAPSHOT } from '@/lib/baked';
import { computeAllianceView } from '@/lib/alliance';

const BASE = process.env.NEXT_PUBLIC_DATA_BASE ?? '/fixtures';

// Alliance map is a small static JSON — import at module level so it's
// bundled and available synchronously during the normalise step.
import allianceMap from '../../public/fixtures/alliance_map_2026.json';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Normalise the raw scraper shape into the TS Snapshot contract:
 *   - states[] (array)  →  states Record<code, StateData>
 *   - total_ac          →  total_seats  (aliased; scraper field name differs)
 *   - computes national_alliance_view via alliance.ts
 */
function normaliseSnapshot(raw: RawScraperSnapshot): Snapshot {
  // Build states Record<code, StateData>
  const states: Snapshot['states'] = {};
  for (const s of raw.states) {
    states[s.code] = {
      name: s.name,
      // total_ac (scraper) mirrors total_seats (TS contract)
      total_seats: s.total_ac,
      declared: s.declared,
      leading: s.leading,
    };
  }

  const national_alliance_view = computeAllianceView(raw, allianceMap);

  return {
    as_of: raw.as_of,
    scraper_run_id: raw.scraper_run_id,
    states,
    national_alliance_view,
    data_source: raw.data_source as Snapshot['data_source'],
    stale: raw.stale,
    stale_since: raw.stale_since ?? null,
  };
}

export function useSnapshot() {
  const { data, error, isLoading } = useSWR<RawScraperSnapshot>(
    `${BASE}/live/snapshot.json`,
    fetcher,
    {
      refreshInterval: 20000,
      // Baked snapshot is bundled into the JS so the overview renders
      // on first paint, even if the R2 fetch fails (e.g. DNS not wired).
      fallbackData: BAKED_SNAPSHOT as unknown as RawScraperSnapshot,
      keepPreviousData: true,
    }
  );

  const snapshot: Snapshot | undefined = data ? normaliseSnapshot(data) : undefined;

  return { snapshot, error, isLoading };
}
