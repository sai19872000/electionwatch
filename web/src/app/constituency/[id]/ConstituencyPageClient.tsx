'use client';

import Link from 'next/link';
import { useStateData } from '@/hooks/useStateData';
import { useSnapshot } from '@/hooks/useSnapshot';
import { getPartyColor } from '@/lib/parties';
import { UNKNOWN_COLOR } from '@/lib/party-colors';
import { StaleBanner } from '@/components/StaleBanner';
import { LiveIndicator } from '@/components/LiveIndicator';
import { SourcesStrip } from '@/components/SourcesStrip';
import type { Constituency } from '@/lib/types';

interface ConstituencyPageClientProps {
  id: string;
}

function RoundProgress({ completed, total }: { completed: number; total: number }) {
  if (total === 0) {
    return <p className="text-muted text-sm">Round info unavailable</p>;
  }
  const pct = Math.min((completed / total) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>Round {completed} of {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: 'var(--ok)' }}
        />
      </div>
    </div>
  );
}

export function ConstituencyPageClient({ id }: ConstituencyPageClientProps) {
  const [stateCode, acNoStr] = id.split('-');
  const acNo = parseInt(acNoStr, 10);

  const { stateData, error, isLoading } = useStateData(stateCode);
  const { snapshot } = useSnapshot();

  const c: Constituency | undefined = stateData?.constituencies.find(
    (x) => x.ac_no === acNo
  );

  const partyColor = c ? getPartyColor(c.leading_party) : UNKNOWN_COLOR;
  const isDecided = c?.status === 'declared';

  // Per-status copy + visual treatment (exhaustive over Constituency['status']).
  // Used for the candidate-name label and the Status section pill.
  const statusView = ((): { candidateLabel: string; statusLabel: string; pillClass: string } => {
    switch (c?.status) {
      case 'declared':
        return {
          candidateLabel: 'Winner',
          statusLabel: 'Result Declared',
          pillClass: 'bg-surface2 text-ok',
        };
      case 'counting':
        return {
          candidateLabel: 'Currently Leading',
          statusLabel: 'Counting in Progress',
          pillClass: 'bg-surface2 text-warn',
        };
      case 'pending':
        return {
          candidateLabel: 'Awaiting Count',
          statusLabel: 'Counting Not Started',
          pillClass: 'bg-surface2 text-muted',
        };
      case 'leading':
      default:
        return {
          candidateLabel: 'Currently Leading',
          statusLabel: 'Counting in Progress',
          pillClass: 'bg-surface2 text-muted',
        };
    }
  })();

  return (
    <div className="min-h-screen flex flex-col">
      {snapshot && (
        <StaleBanner
          dataSource={snapshot.data_source}
          stale={snapshot.stale}
          asOf={snapshot.as_of}
        />
      )}

      <header className="sticky top-0 z-20 bg-[#0A0E1A]/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href={`/state/${stateCode}`} className="text-muted hover:text-accent transition-colors text-sm">
          ← Back
        </Link>
        <h1 className="text-fg font-light text-base truncate">
          {c?.name ?? `Constituency ${acNo}`}
        </h1>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
        {isLoading && (
          <p className="text-muted text-sm animate-pulse">Loading…</p>
        )}
        {error && (
          <p className="text-danger text-sm">Failed to load data.</p>
        )}

        {c && (
          <>
            <div
              className="rounded-xl p-5 border"
              style={{ borderColor: partyColor + '44', backgroundColor: partyColor + '11' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted text-xs mb-1">
                    {statusView.candidateLabel}
                  </p>
                  <h2 className="text-fg text-xl font-medium">{c.leading_candidate}</h2>
                </div>
                <span
                  className="text-sm font-bold px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: partyColor + '33', color: partyColor }}
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

            <div className="bg-surface border border-border rounded-xl p-4">
              <h3 className="text-muted text-xs uppercase tracking-wider mb-3">Counting Progress</h3>
              <RoundProgress completed={c.rounds_completed} total={c.rounds_total} />
            </div>

            <div className="bg-surface border border-border rounded-xl p-4">
              <h3 className="text-muted text-xs uppercase tracking-wider mb-2">Status</h3>
              <span
                className={`inline-block text-sm font-medium px-2.5 py-1 rounded-lg ${statusView.pillClass}`}
              >
                {statusView.statusLabel}
              </span>
            </div>
          </>
        )}

        {!isLoading && !error && !c && stateData && (
          <p className="text-muted text-sm">Constituency data not yet available.</p>
        )}
      </main>

      <footer className="sticky bottom-0 bg-[#0A0E1A]/95 backdrop-blur border-t border-border">
        <SourcesStrip />
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-muted text-xs">electionwatch.saiteja.ai</span>
          {snapshot && <LiveIndicator asOf={snapshot.as_of} stale={snapshot.stale} />}
        </div>
      </footer>
    </div>
  );
}
