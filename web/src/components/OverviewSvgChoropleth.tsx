'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ALLIANCE_COLORS, UNKNOWN_COLOR, OPACITY } from '@/lib/party-colors';
import type { Snapshot } from '@/lib/types';
import {
  STATE_OUTLINES,
  STATE_OUTLINES_VIEWBOX,
} from '@/lib/state_outlines.generated';

// Derived from alliance_map_2026.json — used to color state-level choropleth
const PARTY_TO_ALLIANCE: Record<string, keyof typeof ALLIANCE_COLORS> = {
  BJP: 'NDA', AGP: 'NDA', UPPL: 'NDA', PMK: 'NDA', AINRC: 'NDA',
  INC: 'INDIA', DMK: 'INDIA', 'CPI(M)': 'INDIA', CPI: 'INDIA', TMC: 'INDIA',
  AIUDF: 'INDIA', IUML: 'INDIA', VCK: 'INDIA', MDMK: 'INDIA', AAP: 'INDIA',
};

function allianceFor(party: string): keyof typeof ALLIANCE_COLORS | 'OTH' {
  return PARTY_TO_ALLIANCE[party] ?? 'OTH';
}

function leadingAlliance(stateData: Snapshot['states'][string] | undefined): keyof typeof ALLIANCE_COLORS | null {
  if (!stateData) return null;
  const entries = Object.entries(stateData.leading);
  if (entries.length === 0) return null;
  const byAlliance: Record<string, number> = { NDA: 0, INDIA: 0, OTH: 0 };
  for (const [party, seats] of entries) {
    const al = allianceFor(party);
    byAlliance[al] = (byAlliance[al] ?? 0) + seats;
  }
  const top = Object.entries(byAlliance).sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] === 0) return null;
  return top[0] as keyof typeof ALLIANCE_COLORS;
}

interface OverviewSvgChoroplethProps {
  snapshot: Snapshot | undefined;
}

// @registry-candidate v2
export function OverviewSvgChoropleth({ snapshot }: OverviewSvgChoroplethProps) {
  const router = useRouter();

  const getStateFill = useCallback((code: string): string => {
    const stateData = snapshot?.states[code];
    const alliance = leadingAlliance(stateData);
    // Aura --surface-2 token (#161B2A) for states with no data yet
    if (!alliance) return '#161B2A';
    return ALLIANCE_COLORS[alliance];
  }, [snapshot]);

  const getStateOpacity = useCallback((code: string): number => {
    const stateData = snapshot?.states[code];
    if (!stateData || Object.keys(stateData.leading).length === 0) return 0.3;
    // Use declared opacity if most seats declared
    const declaredRatio = stateData.declared / stateData.total_seats;
    return declaredRatio > 0.5 ? OPACITY.declared : OPACITY.leading;
  }, [snapshot]);

  return (
    <div className="w-full flex justify-center" role="img" aria-label="India 5-state overview choropleth">
      <svg
        viewBox={`0 0 ${STATE_OUTLINES_VIEWBOX.width} ${STATE_OUTLINES_VIEWBOX.height}`}
        className="w-full max-w-xs sm:max-w-sm"
        aria-hidden="false"
      >
        {STATE_OUTLINES.map(({ code, d, label, short, labelXY }) => {
          const fill = getStateFill(code);
          const opacity = getStateOpacity(code);
          const stateData = snapshot?.states[code];
          const tooltipText = stateData
            ? `${label}: ${stateData.declared}/${stateData.total_seats} declared`
            : label;

          return (
            <g key={code}>
              <path
                id={code}
                d={d}
                fill={fill}
                fillOpacity={opacity}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                className="transition-all duration-500 cursor-pointer hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/30"
                onClick={() => router.push(`/state/${code}`)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/state/${code}`)}
                tabIndex={0}
                role="button"
                aria-label={tooltipText}
              >
                <title>{tooltipText}</title>
              </path>
              <text
                x={labelXY[0]}
                y={labelXY[1]}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize={code === 'U06' ? '8' : '11'}
                fontFamily="Geist, system-ui"
                className="pointer-events-none select-none"
              >
                {short}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
