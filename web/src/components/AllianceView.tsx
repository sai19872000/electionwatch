'use client';

import { AnimatedNumber } from './AnimatedNumber';

interface AllianceViewProps {
  india: number;
  nda: number;
  oth: number;
}

const ALLIANCE_COLORS: Record<string, string> = {
  INDIA: '#19A3DC',
  NDA: '#FF9933',
  OTH: '#6B7280',
};

export function AllianceView({ india, nda, oth }: AllianceViewProps) {
  const total = india + nda + oth;
  const items = [
    { label: 'INDIA', value: india },
    { label: 'NDA', value: nda },
    { label: 'OTH', value: oth },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h2 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">National Alliance View</h2>
      <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
        {items.map(({ label, value }) => (
          <div
            key={label}
            className="transition-all duration-700"
            style={{
              width: total > 0 ? `${(value / total) * 100}%` : '33.33%',
              backgroundColor: ALLIANCE_COLORS[label],
            }}
          />
        ))}
      </div>
      <div className="flex gap-4">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ALLIANCE_COLORS[label] }}
            />
            <span className="text-zinc-400 text-xs">{label}</span>
            <AnimatedNumber value={value} className="text-white text-sm font-bold tabular-nums" />
          </div>
        ))}
      </div>
    </div>
  );
}
