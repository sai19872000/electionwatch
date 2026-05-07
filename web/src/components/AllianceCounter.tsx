'use client';

import { useEffect, useRef } from 'react';
import { useSpring, useMotionValueEvent, motion } from 'motion/react';
import { useState } from 'react';
import { ALLIANCE_COLORS } from '@/lib/party-colors';
import { AnimatedNumber } from './AnimatedNumber';

interface AllianceCounterProps {
  nda: number;
  india: number;
  oth: number;
  totalSeats?: number;
}

interface CounterCardProps {
  label: string;
  value: number;
  color: string;
  totalSeats: number;
  pulsing: boolean;
}

function CounterCard({ label, value, color, totalSeats, pulsing }: CounterCardProps) {
  const majority = totalSeats / 2;
  const hasMajority = value > majority;
  return (
    <motion.div
      className="flex-1 rounded-xl border p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{ borderColor: color + '55', backgroundColor: color + '0f' }}
      animate={pulsing ? { scale: [1, 1.03, 1], backgroundColor: [color + '0f', color + '22', color + '0f'] } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color }}>
        {label}
      </span>
      <AnimatedNumber
        value={value}
        className="text-4xl font-extrabold tabular-nums leading-none"
        style={{ color: 'var(--fg)' }}
      />
      {hasMajority && (
        <span className="text-xs mt-1 font-semibold px-2 py-0.5 rounded-full self-start" style={{ backgroundColor: color + '33', color }}>
          Majority
        </span>
      )}
    </motion.div>
  );
}

// @registry-candidate v2
export function AllianceCounter({ nda, india, oth, totalSeats = 824 }: AllianceCounterProps) {
  const prevRef = useRef<{ nda: number; india: number; oth: number }>({ nda, india, oth });
  const [pulsingAlliance, setPulsingAlliance] = useState<string | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    const changed: string[] = [];
    if (nda > prev.nda) changed.push('NDA');
    if (india > prev.india) changed.push('INDIA');
    if (oth > prev.oth) changed.push('OTH');

    // Detect leader flip — whoever gained on another
    const wasFront = prev.nda >= prev.india ? 'NDA' : 'INDIA';
    const isFront = nda >= india ? 'NDA' : 'INDIA';
    const didFlip = wasFront !== isFront;

    if (didFlip || changed.length > 0) {
      const target = didFlip ? isFront : changed[0];
      setPulsingAlliance(target ?? null);
      const t = setTimeout(() => setPulsingAlliance(null), 800);
      prevRef.current = { nda, india, oth };
      return () => clearTimeout(t);
    }
    prevRef.current = { nda, india, oth };
  }, [nda, india, oth]);

  const total = nda + india + oth;
  const seats = [
    { key: 'NDA',   value: nda,   color: ALLIANCE_COLORS.NDA },
    { key: 'INDIA', value: india, color: ALLIANCE_COLORS.INDIA },
    { key: 'OTH',   value: oth,   color: ALLIANCE_COLORS.OTH },
  ];
  const undeclared = totalSeats - total;

  return (
    <div className="space-y-3">
      {/* Counter cards */}
      <div className="flex gap-2 sm:gap-3">
        {seats.map(({ key, value, color }) => (
          <CounterCard
            key={key}
            label={key}
            value={value}
            color={color}
            totalSeats={totalSeats}
            pulsing={pulsingAlliance === key}
          />
        ))}
      </div>

      {/* 824-seat stacked progress bar */}
      <div
        className="flex h-2 w-full rounded-full overflow-hidden bg-surface2"
        role="meter"
        aria-label="Seat share progress"
        aria-valuenow={total}
        aria-valuemax={totalSeats}
      >
        {seats.map(({ key, value, color }) => (
          <motion.div
            key={key}
            className="h-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${(value / totalSeats) * 100}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        ))}
        {undeclared > 0 && (
          <div
            className="h-full bg-border"
            style={{ width: `${(undeclared / totalSeats) * 100}%` }}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{total} / {totalSeats} seats</span>
        <span>{undeclared} pending</span>
      </div>
    </div>
  );
}
