'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { partyColor, DONUT_PARTY_ORDER } from '@/lib/party-colors';
import type { Snapshot } from '@/lib/types';

interface PartyDonutProps {
  snapshot: Snapshot | undefined;
}

interface DonutEntry {
  name: string;
  value: number;
  color: string;
}

function buildDonutData(snapshot: Snapshot | undefined): DonutEntry[] {
  if (!snapshot) return [];

  // Aggregate national vote/seat share by party across all states
  const partyCounts: Record<string, number> = {};
  for (const state of Object.values(snapshot.states)) {
    for (const [party, seats] of Object.entries(state.leading)) {
      partyCounts[party] = (partyCounts[party] ?? 0) + seats;
    }
  }

  const total = Object.values(partyCounts).reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  // Top 6 parties ordered by DONUT_PARTY_ORDER, then rest as "Others"
  const ordered = DONUT_PARTY_ORDER.filter((p) => partyCounts[p] > 0).map((p) => ({
    name: p,
    value: partyCounts[p],
    color: partyColor(p),
  }));

  const coveredParties = new Set(DONUT_PARTY_ORDER);
  let othersTotal = 0;
  for (const [party, seats] of Object.entries(partyCounts)) {
    if (!coveredParties.has(party)) othersTotal += seats;
  }

  // Also add any parties with seats not in DONUT_PARTY_ORDER that aren't in ordered list
  const extraParties = Object.entries(partyCounts)
    .filter(([p]) => !coveredParties.has(p))
    .sort((a, b) => b[1] - a[1]);

  const entries = [...ordered];
  // Promote top extra party if it has significant seats
  if (extraParties.length > 0 && entries.length < 6) {
    const [topExtra, topExtraSeats] = extraParties[0];
    entries.push({ name: topExtra, value: topExtraSeats, color: partyColor(topExtra) });
    othersTotal -= topExtraSeats;
  }

  if (othersTotal > 0) {
    entries.push({ name: 'Others', value: othersTotal, color: '#52525b' });
  }

  return entries;
}

// @registry-candidate v2
export function PartyDonut({ snapshot }: PartyDonutProps) {
  const data = buildDonutData(snapshot);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
        Results pending…
      </div>
    );
  }

  return (
    <div className="w-full h-48 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="75%"
            paddingAngle={2}
            dataKey="value"
            isAnimationActive
            animationBegin={0}
            animationDuration={600}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#191919', border: '1px solid #3f3f3f', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#fff' }}
            itemStyle={{ color: '#a1a1aa' }}
            formatter={(value) => [`${value} seats`]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
