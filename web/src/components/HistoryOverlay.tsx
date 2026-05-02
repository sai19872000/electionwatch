'use client';

import { useState, useEffect } from 'react';

export type HistoryCycle = 'live' | 'ls_2024' | 'ls_2019' | 'assembly_2021';

const CYCLE_LABELS: Record<HistoryCycle, string> = {
  live:          '2026 Live',
  ls_2024:       '2024 LS',
  ls_2019:       '2019 LS',
  assembly_2021: '2021 Assembly',
};

const CYCLE_NOTE: Record<HistoryCycle, string> = {
  live:          'Current counting-day results',
  ls_2024:       'Lok Sabha 2024 — state-level rollups (LS ≠ AC geography)',
  ls_2019:       'Lok Sabha 2019 — state-level rollups',
  assembly_2021: 'Last assembly cycle (2021) — per-AC comparison',
};

interface HistoryOverlayProps {
  activeCycle: HistoryCycle;
  onChange: (cycle: HistoryCycle) => void;
  deltaMode: boolean;
  onDeltaToggle: () => void;
}

// @registry-candidate v2
export function HistoryOverlay({ activeCycle, onChange, deltaMode, onDeltaToggle }: HistoryOverlayProps) {
  const cycles: HistoryCycle[] = ['live', 'ls_2024', 'ls_2019', 'assembly_2021'];

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-wrap gap-1.5"
        role="radiogroup"
        aria-label="Historical overlay cycle"
      >
        {cycles.map((cycle) => (
          <button
            key={cycle}
            role="radio"
            aria-checked={activeCycle === cycle}
            onClick={() => onChange(cycle)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeCycle === cycle
                ? 'bg-fg text-bg'
                : 'bg-surface2 text-muted hover:bg-surface2/80 hover:text-fg'
            }`}
          >
            {CYCLE_LABELS[cycle]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <p className="text-muted text-xs flex-1">{CYCLE_NOTE[activeCycle]}</p>

        {activeCycle !== 'live' && (
          <button
            onClick={onDeltaToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              deltaMode
                ? 'bg-warn/15 text-warn border border-warn/30'
                : 'bg-surface2 text-muted hover:bg-surface2/80'
            }`}
            aria-pressed={deltaMode}
            title="Δ mode: highlights seats that changed vs current cycle"
          >
            <span>Δ vs current</span>
          </button>
        )}
      </div>
    </div>
  );
}
