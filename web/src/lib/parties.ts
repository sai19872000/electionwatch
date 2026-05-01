import partiesMaster from '@/data/parties_master.json';

interface PartyInfo {
  name: string;
  short: string;
  primary_color: string;
  text_on_color: string;
  alliance: string;
}

export const PARTIES: Record<string, PartyInfo> = partiesMaster.parties as Record<string, PartyInfo>;

export function getPartyColor(party: string): string {
  return PARTIES[party]?.primary_color ?? '#6B7280';
}

export function getPartyTextColor(party: string): string {
  return PARTIES[party]?.text_on_color ?? '#0A0A0A';
}

export function getAlliance(party: string): string {
  return PARTIES[party]?.alliance ?? 'OTH';
}
