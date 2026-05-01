'use client';

import { useSnapshot } from '@/hooks/useSnapshot';
import { StateCard } from '@/components/StateCard';
import { AllianceView } from '@/components/AllianceView';
import { StaleBanner } from '@/components/StaleBanner';
import { LiveIndicator } from '@/components/LiveIndicator';
import { SourcesStrip } from '@/components/SourcesStrip';

const STATE_ORDER = ['S03', 'S11', 'S22', 'S25', 'U06'];

export default function OverviewPage() {
  const { snapshot, isLoading } = useSnapshot();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Stale banner */}
      {snapshot && (
        <StaleBanner
          dataSource={snapshot.data_source}
          stale={snapshot.stale}
          asOf={snapshot.as_of}
        />
      )}

      {/* Sticky top bar */}
      <header className="sticky top-0 z-20 bg-[#0f0f0f]/90 backdrop-blur border-b border-zinc-800 px-4 py-3">
        <h1 className="text-white font-bold text-lg tracking-tight">
          ElectionWatch India{' '}
          <span className="text-zinc-500 font-normal text-sm">May 4, 2026</span>
        </h1>
      </header>

      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full space-y-4">
        {isLoading && !snapshot && (
          <p className="text-zinc-500 text-sm animate-pulse">Loading results…</p>
        )}

        {snapshot && (
          <>
            <AllianceView
              india={snapshot.national_alliance_view.INDIA}
              nda={snapshot.national_alliance_view.NDA}
              oth={snapshot.national_alliance_view.OTH}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STATE_ORDER.map((code) => {
                const data = snapshot.states[code];
                if (!data) return null;
                return (
                  <StateCard
                    key={code}
                    code={code}
                    data={data}
                    watchdogMinimal={snapshot.data_source === 'watchdog_minimal'}
                  />
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Bottom info bar */}
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
