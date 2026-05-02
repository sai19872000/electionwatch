'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStateData } from '@/hooks/useStateData';
import { useSnapshot } from '@/hooks/useSnapshot';
import { partyColor, UNKNOWN_COLOR } from '@/lib/party-colors';
import { StaleBanner } from '@/components/StaleBanner';
import { LiveIndicator } from '@/components/LiveIndicator';
import { SourcesStrip } from '@/components/SourcesStrip';
import type { Constituency } from '@/lib/types';

const STATE_NAMES: Record<string, string> = {
  S03: 'Assam', S11: 'Kerala', S22: 'Tamil Nadu', S25: 'West Bengal', U06: 'Puducherry',
};

interface AcDetailClientProps {
  id: string; // e.g. "S22-1"
}

function RoundProgress({ completed, total }: { completed: number; total: number }) {
  if (total === 0) return <p className="text-muted text-sm">Round info unavailable</p>;
  const pct = Math.min((completed / total) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-1.5">
        <span>Round {completed} of {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2.5 bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: 'var(--status-live)' }}
        />
      </div>
    </div>
  );
}

function CandidatesTable({ candidates }: { candidates: Array<{ party: string; candidate: string; votes: number | null; pct: number | null }> }) {
  const [sortKey, setSortKey] = useState<'votes' | 'party'>('votes');
  const sorted = [...candidates].sort((a, b) => {
    if (sortKey === 'votes') return (b.votes ?? 0) - (a.votes ?? 0);
    return a.party.localeCompare(b.party);
  });
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="Candidates list">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 text-muted text-xs font-medium">Candidate</th>
            <th className="text-left py-2 pr-4 text-muted text-xs font-medium">
              <button onClick={() => setSortKey('party')} className="hover:text-accent transition-colors" aria-label="Sort by party">
                Party{sortKey === 'party' && ' ↓'}
              </button>
            </th>
            <th className="text-right py-2 text-muted text-xs font-medium">
              <button onClick={() => setSortKey('votes')} className="hover:text-accent transition-colors" aria-label="Sort by votes">
                Votes{sortKey === 'votes' && ' ↓'}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((cand, i) => (
            <tr key={i} className="border-b border-border hover:bg-surface transition-colors">
              <td className="py-2 pr-4 text-fg">{cand.candidate}</td>
              <td className="py-2 pr-4">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: partyColor(cand.party) }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: partyColor(cand.party) }}
                  />
                  {cand.party}
                </span>
              </td>
              <td className="py-2 text-right text-fg tabular-nums">
                {cand.votes !== null ? cand.votes.toLocaleString() : <span className="text-muted">TBD</span>}
                {cand.pct !== null && (
                  <span className="text-muted text-xs ml-1">{cand.pct.toFixed(1)}%</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Synthesize a candidate list from the leading party data.
// T2 backend will provide a full candidates_<state>.json; this is a
// graceful fallback until that artifact is available.
function buildCandidatesFromConstituency(c: Constituency) {
  const candidates: Array<{ party: string; candidate: string; votes: number | null; pct: number | null }> = [];
  const leading = {
    party: c.leading_party,
    candidate: c.leading_candidate,
    votes: null as number | null,
    pct: null as number | null,
  };
  candidates.push(leading);
  return candidates;
}

export function AcDetailClient({ id }: AcDetailClientProps) {
  const parts = id.split('-');
  const stateCode = parts[0];
  const acNo = parseInt(parts[1], 10);

  const { stateData, error, isLoading } = useStateData(stateCode);
  const { snapshot } = useSnapshot();

  const c: Constituency | undefined = stateData?.constituencies.find((x) => x.ac_no === acNo);
  const stateName = STATE_NAMES[stateCode] ?? stateCode;
  const color = c ? partyColor(c.leading_party) : UNKNOWN_COLOR;
  const isDecided = c?.status === 'declared';
  const candidates = c ? buildCandidatesFromConstituency(c) : [];

  const statusView = (() => {
    switch (c?.status) {
      case 'declared':   return { label: 'Result Declared', pill: 'bg-surface2 text-ok', candidateLabel: 'Winner' };
      case 'counting':   return { label: 'Counting in Progress', pill: 'bg-surface2 text-warn', candidateLabel: 'Currently Leading' };
      case 'pending':    return { label: 'Counting Not Started', pill: 'bg-surface2 text-muted', candidateLabel: 'Awaiting Count' };
      default:           return { label: 'Counting in Progress', pill: 'bg-surface2 text-muted', candidateLabel: 'Currently Leading' };
    }
  })();

  const handleShare = () => {
    const url = `https://electionwatch.saiteja.ai/ac/${id}`;
    if (navigator.share) {
      navigator.share({ title: c?.name ?? id, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {snapshot && (
        <StaleBanner
          dataSource={snapshot.data_source}
          stale={snapshot.stale}
          asOf={snapshot.as_of}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link
          href={`/state/${stateCode}`}
          className="text-muted hover:text-accent transition-colors text-sm flex-shrink-0"
          aria-label={`Back to ${stateName}`}
        >
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-fg font-light text-base truncate">{c?.name ?? `AC ${acNo}`}</h1>
          <p className="text-muted text-xs">{stateName} · AC #{acNo}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusView.pill}`}>
          {statusView.label}
        </span>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 space-y-5">
        {isLoading && !stateData && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-surface2" />)}
          </div>
        )}

        {error && <p className="text-danger text-sm">Failed to load data.</p>}

        {c && (
          <>
            {/* Leading/Winner block */}
            <div
              className="rounded-xl p-5 border"
              style={{ borderColor: color + '44', backgroundColor: color + '0d' }}
            >
              <p className="text-muted text-xs mb-1">{statusView.candidateLabel}</p>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-fg text-2xl font-medium leading-tight">{c.leading_candidate}</h2>
                <span
                  className="text-sm font-bold px-2.5 py-1 rounded-lg flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: color + '33', color }}
                >
                  {c.leading_party}
                </span>
              </div>
              {(c.leading_margin > 0 || (isDecided && c.final_margin)) && (
                <p className="text-fg text-sm mt-3">
                  Margin:{' '}
                  <span className="font-medium text-fg">
                    {(isDecided ? c.final_margin : c.leading_margin)?.toLocaleString()}
                  </span>
                </p>
              )}
            </div>

            {/* Counting progress */}
            {c.rounds_total > 0 && (
              <div className="bg-surface border border-border rounded-xl p-4">
                <h3 className="text-muted text-xs uppercase tracking-wider mb-3">Counting Progress</h3>
                <RoundProgress completed={c.rounds_completed} total={c.rounds_total} />
              </div>
            )}

            {/* Candidates */}
            <div className="bg-surface border border-border rounded-xl p-4">
              <h3 className="text-muted text-xs uppercase tracking-wider mb-3">Candidates</h3>
              {candidates.length > 0 ? (
                <CandidatesTable candidates={candidates} />
              ) : (
                <p className="text-muted text-sm">Full candidates list loading…</p>
              )}
              <p className="text-muted text-xs mt-3">Full candidates data from T2 backend (candidates_{'<state>'}.json)</p>
            </div>

            {/* History block */}
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-muted text-xs uppercase tracking-wider">Historical Context</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between text-muted">
                  <span>2021 Assembly (this AC)</span>
                  <span className="text-muted">T1 data pending</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>2024 LS (parent seat)</span>
                  <span className="text-muted">T1 data pending</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>2019 LS (parent seat)</span>
                  <span className="text-muted">T1 data pending</span>
                </div>
              </div>
              <p className="text-muted text-xs">Historical baked data from T1 data agent. LS cycles show parent seat rollup.</p>
            </div>

            {/* Last update */}
            <div className="text-muted text-xs">
              Last change: {new Date(c.last_change_ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </>
        )}

        {!isLoading && !error && !c && stateData && (
          <p className="text-muted text-sm">Constituency data not yet available.</p>
        )}
      </main>

      {/* Share row */}
      {c && (
        <div className="border-t border-border px-4 py-3 flex items-center gap-3 bg-bg">
          <span className="text-muted text-xs flex-1">/ac/{id}</span>
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-lg bg-surface2 text-fg text-xs font-medium hover:bg-surface transition-colors"
            aria-label="Share this constituency"
          >
            Share ↗
          </button>
        </div>
      )}

      <footer className="bg-bg/95 border-t border-border">
        <SourcesStrip />
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-muted text-xs">electionwatch.saiteja.ai</span>
          {snapshot && <LiveIndicator asOf={snapshot.as_of} stale={snapshot.stale} />}
        </div>
      </footer>
    </div>
  );
}
