'use client';

import { useSpring, useMotionValueEvent } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

// @registry-candidate v2
export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness: 100, damping: 30, duration: 0.6 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useMotionValueEvent(spring, 'change', (v) => {
    setDisplay(Math.round(v));
  });

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display}
    </span>
  );
}
