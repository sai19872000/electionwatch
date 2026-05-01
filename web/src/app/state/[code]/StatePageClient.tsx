'use client';

import { useState, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStateData } from '@/hooks/useStateData';
import { useSnapshot } from '@/hooks/useSnapshot';
import { ConstituencyList } from '@/components/ConstituencyList';
import { StateStackedBar } from '@/components/StateStackedBar';
import { StaleBanner } from '@/components/StaleBanner';
import { LiveIndicator } from '@/components/LiveIndicator';
import { SourcesStrip } from '@/components/SourcesStrip';
import { HistoryOverlay, type HistoryCycle } from '@/components/HistoryOverlay';

// Lazy-load MapLibre component per ADR D-7 (WebGL init only on drill-in)
const StateChoroplethDrillDown = lazy(() =>
  import('@/components/StateChoroplethDrillDown').then((m) => ({
    default: m.StateChoroplethDrillDown,
  }))
);

const STATE_NAMES: Record<string, string> = {
  S03: 'Assam',
  S11: 'Kerala',
  S22: 'Tamil Nadu',
  S25: 'West Bengal',
  U06: 'Puducherry',
};

interface StatePageClientProps {
  code: string;
}

export function StatePageClient({ code }: StatePageClientProps) {
  const { stateData, isLoading } = useStateData(code);
  const { snapshot } = useSnapshot();
  const router = useRouter();

  const [historyCycle, setHistoryCycle] = useState<HistoryCycle>('live');
  const [deltaMode, setDeltaMode] = useState(false);

  const stateName = STATE_NAMES[code] ?? code;
  const stateSnap = snapshot?.states[code];

  return (
    <div className="min-h-screen flex flex-col">
      {snapshot && (
        <StaleBanner
          dataSource={snapshot.data_source}
          stale={snapshot.stale}
          asOf={snapshot.as_of}
        />
      )}

      <header className="sticky top-0 z-20 bg-[#0f0f0f]/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="text-zinc-400 hover:text-white transition-colors text-sm flex-shrink-0"
          aria-label="Back to overview"
        >
          ←
        </Link>
        <h1 className="text-white font-bold text-base flex-1 truncate">{stateName}</h1>
        {stateSnap && (
          <span className="text-zinc-500 text-xs flex-shrink-0 tabular-nums">
            {stateSnap.declared}/{stateSnap.total_seats}
          </span>
        )}
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full space-y-4 pb-6">

        {/* MapLibre Choropleth — lazy-loaded; skeleton while WebGL warms up */}
        <section className="px-4 pt-4" aria-label={`${stateName} constituency map`}>
          <Suspense
            fallback={
              <div className="w-full h-[360px] sm:h-[480px] rounded-xl bg-zinc-900 flex items-center justify-center animate-pulse">
                <div className="space-y-2 w-full px-8">
                  {[80, 60, 75, 50, 65].map((w, i) => (
                    <div key={i} className="h-6 rounded bg-zinc-800" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            }
          >
            <StateChoroplethDrillDown
              stateCode={code}
              stateData={stateData}
              onConstituencyClick={(acId) => router.push(`/ac/${acId}`)}
            />
          </Suspense>
        </section>

        {/* Historical comparison toggle */}
        <section className="px-4" aria-label="Historical comparison">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Historical Comparison</h2>
            <HistoryOverlay
              activeCycle={historyCycle}
              onChange={setHistoryCycle}
              deltaMode={deltaMode}
              onDeltaToggle={() => setDeltaMode((d) => !d)}
            />
          </div>
        </section>

        {/* Party breakdown bar for this state */}
        {snapshot && (
          <section className="px-4" aria-label="Party seat breakdown">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h2 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Party Breakdown</h2>
              <StateStackedBar snapshot={snapshot} />
            </div>
          </section>
        )}

        {/* Virtualized constituency list */}
        <section aria-label="All constituencies">
          {isLoading && !stateData && (
            <p className="text-zinc-500 text-sm p-4 animate-pulse">Loading constituencies…</p>
          )}
          {stateData && (
            <div className="border-t border-zinc-800">
              <div className="px-4 py-3 flex items-center gap-3 text-sm text-zinc-500 border-b border-zinc-800">
                <span>{stateData.constituencies.length} constituencies</span>
                <span className="text-zinc-700">·</span>
                <span>{stateData.constituencies.filter((c) => c.status === 'declared').length} declared</span>
              </div>
              <ConstituencyList constituencies={stateData.constituencies} />
            </div>
          )}
        </section>
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
