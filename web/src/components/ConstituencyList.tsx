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
      <div className="flex gap-2 p-3 border-b border-zinc-800 flex-wrap">
        <input
          type="search"
          placeholder="Search constituency…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-32 bg-zinc-800 text-white text-sm rounded-lg px-3 py-1.5 border border-zinc-700 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
        />
        {(['all', 'leading', 'declared'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Virtualized list */}
      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm p-4">No constituencies match your filter.</p>
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
      <p className="text-zinc-600 text-xs p-2 text-right">{filtered.length} of {constituencies.length} shown</p>
    </div>
  );
}
