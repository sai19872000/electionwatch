'use client';

import Link from 'next/link';
import { useStateData } from '@/hooks/useStateData';
import { useSnapshot } from '@/hooks/useSnapshot';
import { ConstituencyList } from '@/components/ConstituencyList';
import { StaleBanner } from '@/components/StaleBanner';
import { LiveIndicator } from '@/components/LiveIndicator';
import { SourcesStrip } from '@/components/SourcesStrip';

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
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors text-sm">
          ← Back
        </Link>
        <h1 className="text-white font-bold text-base">
          {STATE_NAMES[code] ?? code}
        </h1>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full">
        {isLoading && !stateData && (
          <p className="text-zinc-500 text-sm p-4 animate-pulse">Loading constituencies…</p>
        )}
        {stateData && (
          <>
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3 text-sm">
              <span className="text-zinc-400">{stateData.constituencies.length} constituencies</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-400">
                {stateData.constituencies.filter((c) => c.status === 'declared').length} declared
              </span>
            </div>
            <ConstituencyList constituencies={stateData.constituencies} />
          </>
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
