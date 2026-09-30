import { cn } from "./cn";

// The one thin bar of the panel — a share of a whole, read at a glance.
// Server-safe, no state.
const TONE = {
  brand: "bg-brand-deep/60",
  ok: "bg-ok/60",
  ink: "bg-ink/45",
  warn: "bg-warn/70",
  danger: "bg-danger/70",
} as const;

export function Meter({
  value,
  max,
  tone = "brand",
  className,
}: {
  value: number;
  /** The whole the value is a share of; a zero max draws an empty bar. */
  max: number;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <span
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("relative block h-1.5 overflow-hidden rounded-full bg-ink/[0.06]", className)}
    >
      <span className={cn("absolute inset-y-0 start-0 rounded-full", TONE[tone])} style={{ width: `${pct}%` }} />
    </span>
  );
}
