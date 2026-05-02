'use client';

import { useSnapshot } from '@/hooks/useSnapshot';
import { allianceTotals } from '@/lib/alliance';
import { AllianceCounter } from '@/components/AllianceCounter';
import { OverviewSvgChoropleth } from '@/components/OverviewSvgChoropleth';
import { PartyDonut } from '@/components/PartyDonut';
import { StateStackedBar } from '@/components/StateStackedBar';
import { ConstituencySearch } from '@/components/ConstituencySearch';
import { StaleBanner } from '@/components/StaleBanner';
import { LiveIndicator } from '@/components/LiveIndicator';
import { SourcesStrip } from '@/components/SourcesStrip';
import Link from 'next/link';

export default function OverviewPage() {
  const { snapshot, isLoading } = useSnapshot();

  const av    = snapshot ? allianceTotals(snapshot.national_alliance_view) : {};
  const nda   = av.NDA   ?? 0;
  const india = av.INDIA ?? 0;
  const oth   = av.OTH   ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      {snapshot && (
        <StaleBanner
          dataSource={snapshot.data_source}
          stale={snapshot.stale}
          asOf={snapshot.as_of}
        />
      )}

      {/* Sticky header with search — the LCP element (text renders first, map alongside) */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <h1 className="text-fg font-medium text-base tracking-tight whitespace-nowrap">
          ElectionWatch{' '}
          <span className="text-muted font-normal text-sm">May 4, 2026</span>
        </h1>
        <div className="flex-1" />
        <ConstituencySearch />
        <Link href="/compare" className="hidden sm:block text-muted hover:text-accent text-xs transition-colors whitespace-nowrap ml-2">
          History →
        </Link>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 space-y-6">
        {isLoading && !snapshot && (
          <p className="text-muted text-sm animate-pulse pt-8 text-center">Loading results…</p>
        )}

        {/* Alliance Counter — LCP element, renders immediately via baked snapshot */}
        <section aria-label="National alliance tally">
          <h2 className="text-muted text-xs uppercase tracking-wider mb-3">National Alliance Tally</h2>
          <AllianceCounter nda={nda} india={india} oth={oth} totalSeats={824} />
        </section>

        {/* SVG Choropleth + donut side by side on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section aria-label="State choropleth overview">
            <h2 className="text-muted text-xs uppercase tracking-wider mb-3">5-State Overview</h2>
            <div className="bg-surface border border-border rounded-xl p-3">
              <OverviewSvgChoropleth snapshot={snapshot} />
              <p className="text-muted text-xs text-center mt-2">Tap a state to drill in</p>
            </div>
          </section>

          <section aria-label="National vote share">
            <h2 className="text-muted text-xs uppercase tracking-wider mb-3">National Seat Share</h2>
            <div className="bg-surface border border-border rounded-xl p-3">
              <PartyDonut snapshot={snapshot} />
            </div>
          </section>
        </div>

        {/* State-by-state stacked bar */}
        <section aria-label="Seats by state and party">
          <h2 className="text-muted text-xs uppercase tracking-wider mb-3">Seats by State</h2>
          <div className="bg-surface border border-border rounded-xl p-4">
            <StateStackedBar snapshot={snapshot} />
          </div>
        </section>

        {/* State quick-nav cards */}
        <section aria-label="Navigate to state results">
          <h2 className="text-muted text-xs uppercase tracking-wider mb-3">States</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { code: 'S03', name: 'Assam',       seats: 126 },
              { code: 'S11', name: 'Kerala',      seats: 140 },
              { code: 'S22', name: 'Tamil Nadu',  seats: 234 },
              { code: 'S25', name: 'West Bengal', seats: 294 },
              { code: 'U06', name: 'Puducherry',  seats: 30  },
            ].map(({ code, name, seats }) => {
              const stateData = snapshot?.states[code];
              const declared = stateData?.declared ?? 0;
              const leading = stateData ? Object.entries(stateData.leading).sort((a, b) => b[1] - a[1])[0] : null;
              return (
                <Link
                  key={code}
                  href={`/state/${code}`}
                  className="bg-surface border border-border rounded-xl p-3 hover:border-accent/30 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-fg font-medium text-sm group-hover:text-accent">{name}</p>
                      <p className="text-muted text-xs mt-0.5">{seats} seats</p>
                    </div>
                    <div className="text-right">
                      <p className="text-fg font-semibold text-lg tabular-nums">{declared}</p>
                      <p className="text-muted text-xs">declared</p>
                    </div>
                  </div>
                  {leading && (
                    <p className="text-muted text-xs mt-2">
                      Leading: <span className="text-fg font-medium">{leading[0]}</span>
                      {' '}<span className="tabular-nums">{leading[1]}</span>
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="sticky bottom-0 bg-bg/80 backdrop-blur border-t border-border">
        <SourcesStrip />
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-muted text-xs">electionwatch.saiteja.ai</span>
          {snapshot && <LiveIndicator asOf={snapshot.as_of} stale={snapshot.stale} />}
        </div>
      </footer>
    </div>
  );
}
