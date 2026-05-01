export interface StateData {
  name: string;
  total_seats: number;
  leading: Record<string, number>;
  declared: number;
  source?: string;
}

export interface Snapshot {
  as_of: string;
  scraper_run_id?: string;
  states: Record<string, StateData>;
  national_alliance_view: {
    INDIA: number;
    NDA: number;
    OTH: number;
  };
  data_source: 'eci_primary' | 'watchdog_minimal';
  stale: boolean;
  stale_since: string | null;
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
