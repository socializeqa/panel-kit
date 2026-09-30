"use client";

import { CHIP } from "./classes";
import { cn } from "./cn";
import { usePanel, type StatusTone } from "./panel-provider";
import { tx } from "./tx";

// The chip every badge here builds on. `dot` carries the meaning's colour;
// the chip stays neutral so a table never gets noisy.
export function Chip({
  dot,
  className,
  children,
}: {
  /** A background class for the dot, e.g. "bg-warn"; omit for none. */
  dot?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn(CHIP, className)}>
      {dot ? <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" /> : null}
      {tx(children)}
    </span>
  );
}

// The little tabular count that rides folder headers, rooms and tab labels —
// one shape instead of the ~14 hand-rolled copies Elite Touch's audit found.
export function CountPill({ value, className }: { value: number | string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-ink/[0.06] px-1.5 text-[11px] font-semibold tabular-nums text-quiet",
        className,
      )}
    >
      {value}
    </span>
  );
}

const DOT: Record<StatusTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  quiet: "bg-ink/35",
};

// The words most rooms bring, so a panel speaks them the same way before it
// names any of its own: waiting is warn, in hand is info, done is ok, over
// goes quiet, failed is danger. A room's own words come in through
// PanelProvider `statuses`, or a `tone` on the badge itself.
const COMMON: Record<string, StatusTone> = {
  pending: "warn",
  paused: "warn",
  confirmed: "info",
  sent: "info",
  sending: "info",
  processing: "info",
  active: "ok",
  done: "ok",
  success: "ok",
  completed: "quiet",
  draft: "quiet",
  skipped: "quiet",
  cancelled: "danger",
  failed: "danger",
};

/** The word a status reads as when the room gives none: the stored value,
 *  underscores spaced, in sentence case ("no_show" reads "No show"). */
export function statusWord(status: string | null): string {
  if (!status) return "—";
  const words = status.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// A restrained dot and a word on a neutral chip — one calm system instead of
// a rainbow of pastel fills.
export function StatusBadge({ status, label, tone }: { status: string | null; label?: string; tone?: StatusTone }) {
  const { statuses, t } = usePanel();
  const key = (status ?? "").toLowerCase();
  const dot = DOT[tone ?? statuses[key] ?? COMMON[key] ?? "quiet"];
  return (
    <span className={CHIP}>
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />
      {t(label ?? statusWord(status))}
    </span>
  );
}
