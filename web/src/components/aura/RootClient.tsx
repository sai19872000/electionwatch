'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { BootScreen } from './BootScreen';
import { AuraCredit } from './AuraCredit';
import { printAuraSignature } from './printAuraSignature';

interface RootClientProps {
  children: React.ReactNode;
}

export function RootClient({ children }: RootClientProps) {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    printAuraSignature();
  }, []);

  return (
    <>
      <AnimatePresence>
        {!booted && <BootScreen onDone={() => setBooted(true)} />}
      </AnimatePresence>
      {children}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: 'var(--sp-4)',
          borderTop: '1px solid var(--border)',
          marginTop: 'var(--sp-8)',
        }}
      >
        <AuraCredit />
      </footer>
    </>
  );
}
