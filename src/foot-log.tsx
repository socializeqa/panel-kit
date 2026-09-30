"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";
import { Eyebrow } from "./record";
import { CountPill } from "./status-badge";

// The one log grammar for a drawer's foot: a tinted band riding above the
// sticky action bar — the eyebrow and a count, the newest few rows in view and
// the rest one tap away. A send history and a version trail both wear it (they
// were two copies; Damine, 24 Aug 2026: one component, same logic
// everywhere). Rows come built, so a server component can hand them in; this
// shell only folds them.
const PREVIEW = 4;

export function FootLog({
  eyebrow,
  rows,
  preview = PREVIEW,
  className,
}: {
  eyebrow: string;
  /** Keyed <LogRow>s, newest first. */
  rows: React.ReactNode[];
  preview?: number;
  className?: string;
}) {
  const t = usePanelT();
  const [showAll, setShowAll] = useState(false);
  if (!rows.length) return null;
  const shown = showAll ? rows : rows.slice(0, preview);
  const rest = rows.length - shown.length;
  return (
    <div className={cn("border-t border-ink/[0.08] bg-ink/[0.02] px-5 py-3 sm:px-7", className)}>
      <div className="mb-2 flex items-center gap-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <CountPill value={rows.length} />
      </div>
      <ul className="flex flex-col gap-1">{shown}</ul>
      {rest > 0 || showAll ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-1.5 text-[12px] font-medium text-quiet underline-offset-2 transition-colors hover:text-ink hover:underline"
        >
          {showAll ? t("Show the latest only") : t("+{n} earlier — show all", { n: rest })}
        </button>
      ) : null}
    </div>
  );
}

// One log row: a glyph tile, then what happened on the start side; who and
// when on a straight rail at the end. A row with an href opens its record;
// `current` lights the tile for the live document in a trail. `tone` colours
// the tile for what the row means — the customer's own act reads ok, a thing
// that went wrong reads danger — and `below` hangs a line under the row.
export type LogTone = "quiet" | "customer" | "alert";

const ROW_TILE: Record<LogTone, string> = {
  quiet: "border-ink/10 text-ink/55",
  customer: "border-ok/30 bg-ok-soft text-ok",
  alert: "border-danger/30 bg-danger-soft text-danger",
};

export function LogRow({
  icon,
  href,
  current = false,
  tone = "quiet",
  right,
  below,
  children,
}: {
  icon: React.ReactNode;
  href?: string;
  current?: boolean;
  tone?: LogTone;
  right?: React.ReactNode;
  below?: React.ReactNode;
  children: React.ReactNode;
}) {
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md border bg-surface",
            current ? "border-brand-deep/30 text-brand-deep" : ROW_TILE[tone],
          )}
        >
          {icon}
        </span>
        {children}
      </span>
      {right ? <span className="flex shrink-0 items-center gap-2">{right}</span> : null}
    </>
  );
  const cls = cn(
    "-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5",
    current && "bg-brand/[0.06]",
    href && (current ? "transition-colors hover:bg-brand/[0.09]" : "transition-colors hover:bg-ink/[0.04]"),
  );
  return (
    <li>
      {href ? (
        <Link href={href} className={cls}>
          {body}
        </Link>
      ) : (
        <div className={cls}>{body}</div>
      )}
      {below ? <div className="ms-8 mt-0.5">{below}</div> : null}
    </li>
  );
}

// The "who" chip on a LogRow's rail. The customer reads ok, so their moves pop
// out of a staff-heavy feed; the automatic runs read quiet.
const WHO: Record<"staff" | "customer" | "system", string> = {
  staff: "bg-ink/[0.06] text-ink/65",
  customer: "bg-ok-soft text-ok",
  system: "bg-ink/[0.04] text-quiet",
};

export function LogWho({ tone = "staff", children }: { tone?: keyof typeof WHO; children: React.ReactNode }) {
  return (
    <span
      title={typeof children === "string" ? children : undefined}
      className={cn("max-w-28 truncate rounded-full px-1.5 py-0.5 text-[11px] font-medium 2xl:max-w-44", WHO[tone])}
    >
      {children}
    </span>
  );
}

export function LogWhen({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] tabular-nums text-quiet">{children}</span>;
}
