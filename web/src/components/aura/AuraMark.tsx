import { motion, useReducedMotion } from "framer-motion";

interface AuraMarkProps {
  state?: "breathing" | "still";
  size?: number;
}

export function AuraMark({ state = "still", size = 32 }: AuraMarkProps) {
  const prefersReducedMotion = useReducedMotion();
  const r = size / 2;
  const stroke = size * 0.09;
  const innerR = r - stroke / 2 - 1;
  const circumference = 2 * Math.PI * innerR;
  const halfCirc = circumference / 2;

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Background fill */}
      <circle cx={r} cy={r} r={r - 1} fill="var(--bg)" />
      {/* Dim arc (border) */}
      <circle
        cx={r}
        cy={r}
        r={innerR}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      {/* Accent arc — top half */}
      <circle
        cx={r}
        cy={r}
        r={innerR}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeDasharray={`${halfCirc} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${r} ${r})`}
      />
    </svg>
  );

  if (state === "still" || prefersReducedMotion) {
    return mark;
  }

  return (
    <motion.div
      animate={{
        scale: [0.42, 1, 0.42],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
      }}
      style={{ display: "inline-flex" }}
      aria-hidden="true"
    >
      {mark}
    </motion.div>
  );
}
