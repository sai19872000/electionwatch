import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AuraMark } from "./AuraMark";

interface BootScreenProps {
  onDone: () => void;
}

export function BootScreen({ onDone }: BootScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const doneCalledRef = useRef(false);

  useEffect(() => {
    if (doneCalledRef.current) return;

    if (prefersReducedMotion) {
      const t = setTimeout(() => {
        if (!doneCalledRef.current) {
          doneCalledRef.current = true;
          onDone();
        }
      }, 200);
      return () => clearTimeout(t);
    }

    // Normal: min 200ms display, then fade out (480ms), then done
    const minDisplay = 200;
    const maxDisplay = 700;

    const t = setTimeout(() => {
      if (!doneCalledRef.current) {
        // Fade out handled by AnimatePresence — we just call onDone after fade
      }
    }, minDisplay);

    const tDone = setTimeout(() => {
      if (!doneCalledRef.current) {
        doneCalledRef.current = true;
        onDone();
      }
    }, maxDisplay);

    return () => {
      clearTimeout(t);
      clearTimeout(tDone);
    };
  }, [onDone, prefersReducedMotion]);

  return (
    <motion.div
      key="boot"
      role="status"
      aria-live="polite"
      aria-label="electionwatch loading"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.48 } }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--sp-4)",
      }}
    >
      <AuraMark size={48} state="breathing" />
      <h2
        style={{
          fontWeight: 300,
          fontSize: "1.25rem",
          color: "var(--fg)",
          margin: 0,
          textAlign: "center",
        }}
      >
        electionwatch online
      </h2>
      <p
        style={{
          fontStyle: "italic",
          fontWeight: 200,
          fontSize: "12px",
          color: "var(--muted)",
          margin: 0,
        }}
      >
        loading
      </p>
    </motion.div>
  );
}
