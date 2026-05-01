'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { getPartyColor } from '@/lib/parties';
import type { Constituency } from '@/lib/types';

interface ConstituencyRowProps {
  constituency: Constituency;
  style?: React.CSSProperties;
}

// @registry-candidate v2
export function ConstituencyRow({ constituency: c, style }: ConstituencyRowProps) {
  const prevPartyRef = useRef<string>(c.leading_party);
  const [flash, setFlash] = useState(false);
  const [flashColor, setFlashColor] = useState('transparent');

  useEffect(() => {
    if (prevPartyRef.current !== c.leading_party) {
      setFlashColor(getPartyColor(c.leading_party));
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 1200);
      prevPartyRef.current = c.leading_party;
      return () => clearTimeout(timer);
    }
  }, [c.leading_party]);

  const partyColor = getPartyColor(c.leading_party);
  const isDecided = c.status === 'declared';
  const roundsUnknown = c.rounds_total === 0;
  const roundPct = roundsUnknown ? 0 : (c.rounds_completed / c.rounds_total) * 100;

  // Explicit per-status badge — exhaustive over Constituency['status'] (TS will
  // flag if a new status is added without matching copy here).
  const statusBadge: { label: string; className: string } | null = (() => {
    switch (c.status) {
      case 'declared':
        return { label: 'Declared', className: 'bg-emerald-900/60 text-emerald-400' };
      case 'counting':
        return { label: 'Counting', className: 'bg-amber-900/60 text-amber-400' };
      case 'pending':
        return { label: 'Pending', className: 'bg-zinc-800 text-zinc-400' };
      case 'leading':
        return null;
    }
  })();

  return (
    <motion.div
      style={{
        ...style,
        backgroundColor: flash ? flashColor + '33' : undefined,
      }}
      animate={{ backgroundColor: flash ? flashColor + '22' : 'transparent' }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors"
    >
      <span className="text-zinc-600 text-xs w-8 flex-shrink-0">{c.ac_no}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white text-sm font-medium truncate">{c.name}</p>
          {statusBadge && (
            <span className={`text-xs ${statusBadge.className} px-1.5 py-0.5 rounded text-nowrap`}>
              {statusBadge.label}
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-xs truncate">{c.leading_candidate}</p>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: partyColor }}
          />
          <span className="text-xs font-semibold" style={{ color: partyColor }}>
            {c.leading_party}
          </span>
          {c.leading_margin > 0 && (
            <span className="text-zinc-500 text-xs">+{c.leading_margin.toLocaleString()}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${roundPct}%`, backgroundColor: partyColor }}
            />
          </div>
          <span className="text-zinc-600 text-xs">
            {roundsUnknown ? '?' : `${c.rounds_completed}/${c.rounds_total}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
