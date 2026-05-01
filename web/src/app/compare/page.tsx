'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSnapshot } from '@/hooks/useSnapshot';
import { allianceTotals } from '@/lib/alliance';
import { HistoryOverlay, type HistoryCycle } from '@/components/HistoryOverlay';
import { StateStackedBar } from '@/components/StateStackedBar';
import { PartyDonut } from '@/components/PartyDonut';
import { AllianceCounter } from '@/components/AllianceCounter';
import { SourcesStrip } from '@/components/SourcesStrip';
import { LiveIndicator } from '@/components/LiveIndicator';
import { ALLIANCE_COLORS } from '@/lib/party-colors';
import type { Snapshot } from '@/lib/types';

const CYCLE_NOTES: Record<HistoryCycle, string> = {
  live:          'Current live counting results (May 4, 2026)',
  ls_2024:       '2024 Lok Sabha — note: LS seats ≠ assembly ACs. State-level rollups shown.',
  ls_2019:       '2019 Lok Sabha — same geography caveat as 2024.',
  assembly_2021: 'Last assembly cycle (2021) — same-body comparison, per-AC diff valid.',
};

interface HistoricalData {
  cycle: string;
  results: Array<{
    ls_seat: string;
    state: string;
    winner_party: string;
    vote_share: Record<string, number>;
  }>;
}

const BASE = process.env.NEXT_PUBLIC_DATA_BASE ?? '/fixtures';

function useHistoricalData(cycle: HistoryCycle) {
  const [data, setData] = useState<HistoricalData | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);

  if (cycle === 'live' || cycle === 'assembly_2021') return null;

  const url = `${BASE}/${cycle === 'ls_2024' ? 'historical_2024_ls' : 'historical_2019_ls'}.json`;
  if (loaded !== url) {
    setLoaded(url);
    fetch(url)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null));
  }

  return data;
}

function HistoricalSummaryRow({ data }: { data: HistoricalData | null }) {
  if (!data) return <p className="text-zinc-600 text-sm">Loading historical data…</p>;
  const byParty: Record<string, number> = {};
  for (const r of data.results) {
    byParty[r.winner_party] = (byParty[r.winner_party] ?? 0) + 1;
  }
  const entries = Object.entries(byParty).sort((a, b) => b[1] - a[1]);
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([party, wins]) => (
        <span key={party} className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
          {party}: <strong>{wins}</strong>
        </span>
      ))}
    </div>
  );
}

export default function ComparePage() {
  const { snapshot } = useSnapshot();
  const [activeCycle, setActiveCycle] = useState<HistoryCycle>('live');
  const [deltaMode, setDeltaMode] = useState(false);

  const av    = snapshot ? allianceTotals(snapshot.national_alliance_view) : {};
  const nda   = av.NDA   ?? 0;
  const india = av.INDIA ?? 0;
  const oth   = av.OTH   ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-[#0f0f0f]/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors text-sm" aria-label="Back to overview">
          ←
        </Link>
        <h1 className="text-white font-bold text-base flex-1">Historical Overlay</h1>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-5 space-y-6">

        {/* Cycle selector */}
        <section aria-label="Cycle selector">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h2 className="text-zinc-400 text-xs uppercase tracking-wider">Comparison Cycle</h2>
            <HistoryOverlay
              activeCycle={activeCycle}
              onChange={setActiveCycle}
              deltaMode={deltaMode}
              onDeltaToggle={() => setDeltaMode((d) => !d)}
            />
            <p className="text-zinc-600 text-xs border-t border-zinc-800 pt-3">{CYCLE_NOTES[activeCycle]}</p>
          </div>
        </section>

        {/* Live view (always shown) */}
        <section aria-label="Live results">
          <h2 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">2026 Live — Alliance Tally</h2>
          <AllianceCounter nda={nda} india={india} oth={oth} totalSeats={824} />
        </section>

        {/* Comparison view */}
        {activeCycle !== 'live' && (
          <section aria-label="Historical results" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h2 className="text-zinc-400 text-xs uppercase tracking-wider">
              {activeCycle === 'ls_2024' ? '2024 Lok Sabha' : activeCycle === 'ls_2019' ? '2019 Lok Sabha' : '2021 Assembly'} — State-level Results
            </h2>

            {(activeCycle === 'ls_2024' || activeCycle === 'ls_2019') && (
              <HistoricalSummaryRow data={null} />
            )}

            {activeCycle === 'assembly_2021' && (
              <p className="text-zinc-500 text-sm">Assembly 2021 per-AC data baked by T1 data agent. Available after T1 completes.</p>
            )}

            <p className="text-zinc-700 text-xs pt-2 border-t border-zinc-800">
              Note: LS constituency boundaries differ from assembly constituency boundaries.
              {' '}State-level seat rollups are used for cross-body comparison.
            </p>
          </section>
        )}

        {/* Current charts */}
        <section aria-label="Current party composition">
          <h2 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Current — Party Seat Share</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <PartyDonut snapshot={snapshot} />
          </div>
        </section>

        <section aria-label="State-level breakdown">
          <h2 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Current — Seats by State</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <StateStackedBar snapshot={snapshot} />
          </div>
        </section>

        {deltaMode && activeCycle !== 'live' && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4">
            <p className="text-amber-400 text-sm font-medium">Δ mode active</p>
            <p className="text-amber-400/70 text-xs mt-1">
              XOR diff highlights seats that changed party vs the selected cycle.
              Full diff map requires T1 data artifacts.
            </p>
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 bg-[#0f0f0f]/95 backdrop-blur border-t border-zinc-800">
        <SourcesStrip />
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-zinc-600 text-xs">electionwatch.saiteja.ai</span>
          {snapshot && <LiveIndicator asOf={snapshot.as_of} stale={snapshot.stale} />}
        </div>
      </footer>
    </div>
  );
}
