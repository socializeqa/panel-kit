import { cn } from "./cn";
import { Eyebrow } from "./record";
import { tx } from "./tx";

// The inline "label above value" figure — one component for the trio Elite
// Touch's audit found (a contact's balance, a job's money, payment stats).
// Tones: positive and negative for money directions, warn for an outstanding
// sum, muted for a settled zero.
export function Figure({
  label,
  value,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "positive" | "negative" | "warn" | "muted";
  className?: string;
}) {
  const valueColor = {
    default: "text-ink/85",
    positive: "text-ok",
    negative: "text-danger",
    warn: "text-warn",
    muted: "text-quiet",
  }[tone];
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Eyebrow size="sm">{label}</Eyebrow>
      <span className={cn("whitespace-nowrap text-[14px] font-semibold tabular-nums", valueColor)}>{tx(value)}</span>
    </div>
  );
}
