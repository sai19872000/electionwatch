'use client';

import Fuse, { type FuseResult } from 'fuse.js';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface SearchRow {
  id: string;   // e.g. "S22-1"
  name: string;
  state: string;
  district: string;
  aliases: string[];
}

interface SearchIndex {
  rows: SearchRow[];
}

const BASE = process.env.NEXT_PUBLIC_DATA_BASE ?? '/fixtures';

// @registry-candidate v2
export function ConstituencySearch() {
  const router = useRouter();
  const [index, setIndex] = useState<Fuse<SearchRow> | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FuseResult<SearchRow>[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load search index once on mount
  useEffect(() => {
    fetch(`${BASE}/search_index.json`)
      .then((r) => r.json())
      .then((data: SearchIndex) => {
        const fuse = new Fuse(data.rows, {
          keys: [
            { name: 'name',     weight: 2 },
            { name: 'aliases',  weight: 1.5 },
            { name: 'district', weight: 1 },
            { name: 'state',    weight: 0.5 },
          ],
          threshold: 0.35,
          includeScore: true,
          minMatchCharLength: 2,
          useExtendedSearch: false,
        });
        setIndex(fuse);
      })
      .catch(() => {
        // Index not yet available (pre-T1); search stays disabled silently.
      });
  }, []);

  const runSearch = useCallback(
    (q: string) => {
      if (!index || q.length < 2) {
        setResults([]);
        return;
      }
      setResults(index.search(q, { limit: 8 }));
    },
    [index]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(q);
      setOpen(q.length >= 2);
    }, 80);
  };

  const navigate = useCallback(
    (row: SearchRow) => {
      // /ac/[id] route: id = "S22-1"
      router.push(`/ac/${row.id}`);
      setQuery('');
      setResults([]);
      setOpen(false);
      setActiveIdx(-1);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[activeIdx] ?? results[0];
      if (target) navigate(target.item);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Click-outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm">
      <div className="relative flex items-center">
        <svg
          className="absolute left-3 w-4 h-4 text-muted pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search constituency…"
          aria-label="Search constituency"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-activedescendant={activeIdx >= 0 ? `sr-${activeIdx}` : undefined}
          maxLength={100}
          className="w-full pl-9 pr-3 py-2 bg-surface2 border border-border rounded-lg text-sm text-fg placeholder:text-muted focus:outline-none focus:border-accent/60 transition-colors"
        />
      </div>

      {open && results.length > 0 && (
        <div
          ref={listRef}
          id="search-results"
          role="listbox"
          aria-label="Constituency search results"
          className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
        >
          {results.map((result, idx) => (
            <button
              key={result.item.id}
              id={`sr-${idx}`}
              role="option"
              aria-selected={idx === activeIdx}
              onClick={() => navigate(result.item)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                idx === activeIdx ? 'bg-surface2' : 'hover:bg-surface2/60'
              }`}
            >
              <span className="flex-1 min-w-0">
                <span className="text-fg text-sm font-medium block truncate">{result.item.name}</span>
                <span className="text-muted text-xs block truncate">{result.item.state} · {result.item.district}</span>
              </span>
              <span className="text-muted text-xs flex-shrink-0">{result.item.id}</span>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface border border-border rounded-lg shadow-xl px-4 py-3 text-muted text-sm"
        >
          No results for &ldquo;{query.slice(0, 80)}&rdquo;
        </div>
      )}
    </div>
  );
}
