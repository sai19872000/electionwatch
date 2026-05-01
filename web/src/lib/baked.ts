// Baked fixtures: static JSON imports bundled into the build so the page
// renders the full pre-counting roster on first paint with no fetch
// dependency. SWR still tries to fetch fresh data from
// NEXT_PUBLIC_DATA_BASE; if that fetch fails (e.g. DNS not yet wired for
// the R2 custom domain), the baked data remains visible because we pass
// it as `fallbackData` and SWR uses `keepPreviousData: true`.
//
// Source of truth for the fixture content lives in
// `public/fixtures/*.json` — the files served at `/fixtures/*` in the
// static export. These imports just inline the same bytes into JS so the
// page never has to wait on a network round-trip to render.

import snapshotJson from '../../public/fixtures/snapshot.json';
import stateS03 from '../../public/fixtures/state_S03.json';
import stateS11 from '../../public/fixtures/state_S11.json';
import stateS22 from '../../public/fixtures/state_S22.json';
import stateS25 from '../../public/fixtures/state_S25.json';
import stateU06 from '../../public/fixtures/state_U06.json';

import type { RawScraperSnapshot, StateDetail } from './types';

// BAKED_SNAPSHOT uses the scraper's raw wire format (states is an array with
// total_ac). useSnapshot.normaliseSnapshot() converts it to the TS Snapshot
// contract before consumers see it.
export const BAKED_SNAPSHOT: RawScraperSnapshot = snapshotJson as RawScraperSnapshot;

export const BAKED_STATES: Record<string, StateDetail> = {
  S03: stateS03 as StateDetail,
  S11: stateS11 as StateDetail,
  S22: stateS22 as StateDetail,
  S25: stateS25 as StateDetail,
  U06: stateU06 as StateDetail,
};

export function bakedStateDetail(code: string): StateDetail {
  return (
    BAKED_STATES[code] ?? {
      as_of: BAKED_SNAPSHOT.as_of,
      state: code,
      code,
      constituencies: [],
    }
  );
}
