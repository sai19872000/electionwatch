/**
 * Canonical party color palette for ElectionWatch.
 * Shared by map fills, Recharts, and all chart components.
 * Colors chosen for WCAG AA contrast on dark (#0f0f0f) backgrounds.
 *
 * Source: scraper/seed/parties_master.json — do NOT diverge from that file.
 * This module exists so the frontend has a typed, tree-shakeable import
 * without pulling in the full JSON at runtime on non-party code paths.
 */

export const PARTY_COLORS: Record<string, string> = {
  BJP:       '#FF9933',
  INC:       '#19A3DC',
  'CPI(M)':  '#EF4444',
  CPI:       '#F97316',
  DMK:       '#1C86EE',
  AIADMK:   '#22C55E',
  TMC:       '#38BDF8',
  AIUDF:     '#A3E635',
  AGP:       '#C4B5FD',
  IUML:      '#34D399',
  KEC:       '#FDE047',
  AIML:      '#FB923C',
  BDFL:      '#67E8F9',
  RSP:       '#F472B6',
  SDF:       '#818CF8',
  NPF:       '#4ADE80',
  AAP:       '#0EA5E9',
  SP:        '#DA3729',
  BSP:       '#1D4ED8',
  NCP:       '#64748B',
  PMK:       '#FBBF24',
  VCK:       '#E879F9',
  MDMK:      '#F59E0B',
  AMMK:      '#86EFAC',
};

/** Alliance fill colors (state-level choropleth + leaderboard) */
export const ALLIANCE_COLORS = {
  NDA:    '#FF9933',
  INDIA:  '#19A3DC',
  OTH:    '#6B7280',
} as const;

/** Leading (60%) vs declared (100%) opacity per D-7 ADR. */
export const OPACITY = {
  leading:  0.6,
  declared: 1.0,
} as const;

/** Fallback for unknown parties */
export const UNKNOWN_COLOR = '#6B7280';

export function partyColor(party: string): string {
  return PARTY_COLORS[party] ?? UNKNOWN_COLOR;
}

/** Top-6 parties + Others for PartyDonut */
export const DONUT_PARTY_ORDER = [
  'BJP', 'INC', 'DMK', 'TMC', 'CPI(M)', 'AIADMK',
];
