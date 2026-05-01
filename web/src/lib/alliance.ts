import type { AllianceView, RawScraperSnapshot } from '@/lib/types';

/**
 * Extract per-alliance seat totals from a national_alliance_view array.
 * Returns 0 for any alliance not present in the view.
 */
export function allianceTotals(view: AllianceView[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of view) {
    out[row.alliance] = row.total;
  }
  return out;
}

interface AllianceMap {
  party_to_alliance: Record<string, string>;
}

/**
 * Compute national_alliance_view from a raw scraper snapshot.
 *
 * Strategy:
 *   1. If snapshot.national.leading is present, use it directly (pre-aggregated).
 *   2. Otherwise aggregate per-AC 'leading' tallies across all states in the array.
 *
 * Alliance membership is resolved via party_to_alliance from alliance_map_2026.json.
 * Any party not in the map is bucketed under 'OTH'.
 *
 * Returns rows sorted by (seats_leading + seats_won) DESC.
 */
export function computeAllianceView(
  raw: RawScraperSnapshot,
  allianceMap: AllianceMap,
): AllianceView[] {
  const p2a = allianceMap.party_to_alliance;

  // Accumulator: alliance -> { seats_won, seats_leading }
  const acc: Record<string, { seats_won: number; seats_leading: number }> = {};

  const bump = (alliance: string, won: number, leading: number) => {
    if (!acc[alliance]) acc[alliance] = { seats_won: 0, seats_leading: 0 };
    acc[alliance].seats_won += won;
    acc[alliance].seats_leading += leading;
  };

  const partyAlliance = (party: string) => p2a[party] ?? 'OTH';

  if (raw.national?.leading && Object.keys(raw.national.leading).length > 0) {
    // Use pre-aggregated national.leading (party -> count of leading seats).
    // The scraper does not yet emit seats_won separately at national level,
    // so we treat all national.leading entries as seats_leading.
    for (const [party, count] of Object.entries(raw.national.leading)) {
      bump(partyAlliance(party), 0, count as number);
    }
  } else {
    // Aggregate from per-state leading maps.
    for (const state of raw.states) {
      for (const [party, count] of Object.entries(state.leading)) {
        bump(partyAlliance(party), 0, count as number);
      }
    }
  }

  return Object.entries(acc)
    .map(([alliance, { seats_won, seats_leading }]) => ({
      alliance,
      seats_won,
      seats_leading,
      total: seats_won + seats_leading,
    }))
    .sort((a, b) => b.total - a.total);
}
