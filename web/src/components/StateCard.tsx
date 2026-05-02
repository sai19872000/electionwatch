'use client';

import Link from 'next/link';
import { AnimatedNumber } from './AnimatedNumber';
import { getPartyColor } from '@/lib/parties';
import type { StateData } from '@/lib/types';

interface StateCardProps {
  code: string;
  data: StateData;
  watchdogMinimal?: boolean;
}

export function StateCard({ code, data, watchdogMinimal }: StateCardProps) {
  const topParties = watchdogMinimal
    ? []
    : Object.entries(data.leading)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

  const totalCounted = Object.values(data.leading).reduce((s, v) => s + v, 0);

  return (
    <Link href={`/state/${code}`} className="block">
      <div className="bg-surface border border-border rounded-xl p-4 hover:border-accent/30 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-fg font-medium text-base">{data.name}</h2>
            <p className="text-muted text-xs mt-0.5">{data.total_seats} seats</p>
          </div>
          <div className="text-right">
            <p className="text-muted text-xs">Declared</p>
            <AnimatedNumber value={data.declared} className="text-fg font-semibold text-lg" />
          </div>
        </div>

        {watchdogMinimal ? (
          <p className="text-muted text-sm">
            <AnimatedNumber value={totalCounted} /> seats counted
          </p>
        ) : (
          <div className="space-y-1.5">
            {topParties.map(([party, seats]) => (
              <div key={party} className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getPartyColor(party) }}
                />
                <span className="text-muted text-xs w-16 truncate">{party}</span>
                <div className="flex-1 h-1.5 bg-surface2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((seats / data.total_seats) * 100, 100)}%`,
                      backgroundColor: getPartyColor(party),
                    }}
                  />
                </div>
                <AnimatedNumber
                  value={seats}
                  className="text-fg text-xs font-semibold tabular-nums w-6 text-right"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
