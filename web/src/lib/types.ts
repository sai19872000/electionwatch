export interface StateData {
  name: string;
  total_seats: number;
  leading: Record<string, number>;
  declared: number;
  source?: string;
}

export interface AllianceView {
  alliance: string;
  seats_won: number;
  seats_leading: number;
  total: number;
}

export interface Snapshot {
  as_of: string;
  scraper_run_id?: string;
  states: Record<string, StateData>;
  national_alliance_view: AllianceView[];
  data_source: 'eci_primary' | 'watchdog_minimal' | 'watchdog_degraded' | 'ceo_fallback';
  stale: boolean;
  stale_since: string | null;
}

/** Raw shape emitted by scraper/scraper.py — states is an array, not a Record */
export interface RawScraperSnapshot {
  as_of: string;
  scraper_run_id?: string;
  states: Array<{
    code: string;
    name: string;
    /** Scraper field; aliased to total_seats in normaliseSnapshot() */
    total_ac: number;
    declared: number;
    leading: Record<string, number>;
  }>;
  national?: {
    declared: number;
    leading: Record<string, number>;
    vote_share?: Record<string, number>;
  };
  data_source: string;
  stale: boolean;
  stale_since?: string | null;
}

export interface Constituency {
  ac_no: number;
  name: string;
  leading_candidate: string;
  leading_party: string;
  leading_margin: number;
  rounds_completed: number;
  rounds_total: number;
  status: 'pending' | 'counting' | 'leading' | 'declared';
  winner: string | null;
  winner_party: string | null;
  final_margin: number | null;
  last_change_ts: string;
}

export interface StateDetail {
  as_of: string;
  state: string;
  code: string;
  constituencies: Constituency[];
}

export interface LeadFlipEvent {
  type: 'lead_flip';
  ac_no: number;
  state: string;
  from: string | null;
  to: string;
  ts: string;
}

export interface ResultDeclaredEvent {
  type: 'result_declared';
  ac_no: number;
  state: string;
  winner: string;
  party: string;
  margin: number;
  ts: string;
}

export type ElectionEvent = LeadFlipEvent | ResultDeclaredEvent;

export interface EventsData {
  events: ElectionEvent[];
}
