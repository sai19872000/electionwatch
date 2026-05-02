'use client';

import { FixedSizeList } from 'react-window';
import { useState, useCallback } from 'react';
import { ConstituencyRow } from './ConstituencyRow';
import type { Constituency } from '@/lib/types';

interface ConstituencyListProps {
  constituencies: Constituency[];
}

type StatusFilter = 'all' | 'leading' | 'declared';

// @registry-candidate v2
export function ConstituencyList({ constituencies }: ConstituencyListProps) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = constituencies.filter((c) => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <ConstituencyRow constituency={filtered[index]} style={style} />
    ),
    [filtered]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex gap-2 p-3 border-b border-border flex-wrap">
        <input
          type="search"
          placeholder="Search constituency…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-32 bg-surface2 text-fg text-sm rounded-lg px-3 py-1.5 border border-border focus:outline-none focus:border-accent/60 placeholder:text-muted"
        />
        {(['all', 'leading', 'declared'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-fg text-bg'
                : 'bg-surface2 text-muted hover:bg-surface2/80'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Virtualized list */}
      {filtered.length === 0 ? (
        <p className="text-muted text-sm p-4">No constituencies match your filter.</p>
      ) : (
        <FixedSizeList
          height={520}
          width="100%"
          itemCount={filtered.length}
          itemSize={68}
        >
          {Row}
        </FixedSizeList>
      )}
      <p className="text-muted text-xs p-2 text-right">{filtered.length} of {constituencies.length} shown</p>
    </div>
  );
}
