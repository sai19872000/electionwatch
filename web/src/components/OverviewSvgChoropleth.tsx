'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ALLIANCE_COLORS, UNKNOWN_COLOR, OPACITY } from '@/lib/party-colors';
import type { Snapshot } from '@/lib/types';

// State SVG path data (simplified shapes; T1 replaces with authoritative boundaries).
// id corresponds to ECI state_code values.
const STATE_PATHS: Record<string, { d: string; label: string; labelXY: [number, number] }> = {
  S25: {
    label: 'West Bengal',
    labelXY: [305, 175],
    d: 'M280,100 L340,100 L355,140 L350,200 L330,240 L300,250 L275,230 L270,190 L265,150 Z',
  },
  S03: {
    label: 'Assam',
    labelXY: [393, 128],
    d: 'M340,95 L430,90 L445,110 L440,140 L420,155 L380,158 L355,145 L340,120 Z',
  },
  S11: {
    label: 'Kerala',
    labelXY: [180, 430],
    d: 'M170,350 L195,345 L205,380 L210,430 L205,490 L185,510 L165,495 L155,460 L150,420 L155,380 Z',
  },
  S22: {
    label: 'Tamil Nadu',
    labelXY: [237, 430],
    d: 'M205,340 L260,330 L285,360 L290,410 L280,460 L255,510 L225,530 L200,510 L185,480 L185,440 L195,390 Z',
  },
  U06: {
    label: 'Puducherry',
    labelXY: [265, 490],
    d: 'M248,472 L258,470 L262,482 L255,490 L245,488 Z',
  },
};

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
        viewBox="0 0 500 600"
        className="w-full max-w-xs sm:max-w-sm"
        aria-hidden="false"
      >
        {Object.entries(STATE_PATHS).map(([code, { d, label, labelXY }]) => {
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
                {code === 'U06' ? 'PY' : code === 'S03' ? 'AS' : code === 'S11' ? 'KL' : code === 'S22' ? 'TN' : 'WB'}
              </text>
            </g>
          );
        })}

        {/* Half-way majority line at ~y midpoint for visual reference — not shown for now */}
      </svg>
    </div>
  );
}
