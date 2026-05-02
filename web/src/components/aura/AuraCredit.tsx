import { AuraMark } from "./AuraMark";

export function AuraCredit() {
  return (
    <span
      aria-label="Aura design system credit"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        color: "var(--muted)",
        fontWeight: 300,
      }}
    >
      <AuraMark size={14} state="still" />
      <span>quietly forged at saiteja.ai</span>
    </span>
  );
}
