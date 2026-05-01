'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { partyColor } from '@/lib/party-colors';
import type { Snapshot } from '@/lib/types';

const STATE_LABELS: Record<string, string> = {
  S03: 'AS', S11: 'KL', S22: 'TN', S25: 'WB', U06: 'PY',
};

const TOP_PARTIES = ['BJP', 'INC', 'DMK', 'TMC', 'CPI(M)', 'AIADMK', 'AIUDF', 'AGP'];

interface BarEntry {
  state: string;
  total: number;
  [party: string]: number | string;
}

function buildBarData(snapshot: Snapshot | undefined): BarEntry[] {
  if (!snapshot) return [];
  return Object.entries(snapshot.states).map(([code, data]) => {
    const entry: BarEntry = { state: STATE_LABELS[code] ?? code, total: data.total_seats };
    let covered = 0;
    for (const party of TOP_PARTIES) {
      const seats = data.leading[party] ?? 0;
      entry[party] = seats;
      covered += seats;
    }
    const othersTotal = Object.entries(data.leading)
      .filter(([p]) => !TOP_PARTIES.includes(p))
      .reduce((s, [, v]) => s + v, 0);
    entry['Others'] = othersTotal;
    return entry;
  });
}

const ALL_BARS = [...TOP_PARTIES, 'Others'];

// @registry-candidate v2
export function StateStackedBar({ snapshot }: { snapshot: Snapshot | undefined }) {
  const data = buildBarData(snapshot);
  const hasData = data.some((d) => (d.total as number) > 0 && ALL_BARS.some((p) => (d[p] as number) > 0));

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
        Results pending…
      </div>
    );
  }

  return (
    <div className="w-full h-48 sm:h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 12, left: 4, bottom: 0 }}
          barCategoryGap="25%"
        >
          <XAxis
            type="number"
            tick={{ fill: '#52525b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="state"
            tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'Manrope, system-ui' }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#191919', border: '1px solid #3f3f3f', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#fff', fontWeight: 600 }}
            itemStyle={{ color: '#a1a1aa' }}
            formatter={(value, name) =>
              (value as number) > 0 ? [`${value} seats`, name as string] : null
            }
          />
          {ALL_BARS.map((party) => (
            <Bar key={party} dataKey={party} stackId="a" fill={partyColor(party)} isAnimationActive animationDuration={600}>
              {data.map((entry) => (
                <Cell
                  key={`${entry.state}-${party}`}
                  fill={party === 'Others' ? '#52525b' : partyColor(party)}
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
