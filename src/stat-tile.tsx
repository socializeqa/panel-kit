import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { PANEL_SHELL } from "./classes";
import { cn } from "./cn";
import { IconTile } from "./icon-tile";
import { Eyebrow } from "./record";
import { tx } from "./tx";

// The stat tile: a label, an icon, one big tabular figure, an optional line of
// context. `accent` marks a good number with an ok hairline on top (Elite
// Touch's prop name, kept so a room moves over unchanged); `danger` frames a
// number that needs attention. `href` draws the same frame as a link.
// `control` (Señorritas) seats a small live control at the end of a strip
// cell — the online-booking switch — so a fact and the one thing you do about
// it share a cell.
export function StatTile({
  label,
  value,
  sub,
  Icon,
  accent,
  danger,
  href,
  control,
  strip = false,
}: {
  label: string;
  value: string;
  sub?: string;
  Icon: LucideIcon;
  accent?: boolean;
  danger?: boolean;
  href?: string;
  /** A cell of a strip only, and never with `href` (no control inside a link). */
  control?: React.ReactNode;
  /** A cell of a StatStrip: no frame of its own, one line of label · value · sub. */
  strip?: boolean;
}) {
  const tone = danger ? "danger" : accent ? "ok" : "quiet";
  if (strip) {
    const frame = cn("@container relative flex min-w-0 items-center gap-3 px-4 py-3", danger && "text-danger");
    const cell = (
      <>
        <IconTile size="md" tone={tone}>
          <Icon aria-hidden="true" />
        </IconTile>
        <span className="min-w-0">
          <Eyebrow size="sm" className="truncate">
            {label}
          </Eyebrow>
          <span className="mt-0.5 flex items-baseline gap-2">
            <span className="whitespace-nowrap text-[18px] font-semibold leading-none tabular-nums text-ink">{tx(value)}</span>
            {/* The cell's own width decides, not the screen's: a strip of
                four has room for the line where a strip of six does not. */}
            {sub ? <span className="hidden truncate text-[12px] text-quiet @[300px]:block">{tx(sub)}</span> : null}
          </span>
        </span>
        {control ? <span className="ms-auto shrink-0">{control}</span> : null}
      </>
    );
    return href ? (
      <Link href={href} scroll={false} className={cn(frame, "transition-colors hover:bg-ink/[0.02]")}>
        {cell}
      </Link>
    ) : (
      <div className={frame}>{cell}</div>
    );
  }
  const frame = cn(
    PANEL_SHELL,
    "relative overflow-hidden p-5",
    danger ? "border-danger/40" : accent ? "border-ok/30" : undefined,
  );
  const body = (
    <>
      {accent ? <span className="absolute inset-x-0 top-0 h-0.5 bg-ok" /> : null}
      <div className="flex items-center justify-between">
        <Eyebrow size="sm">{label}</Eyebrow>
        <IconTile size="md" tone={tone}>
          <Icon aria-hidden="true" />
        </IconTile>
      </div>
      <p className="mt-3 text-[26px] font-semibold tabular-nums text-ink">{tx(value)}</p>
      {sub ? <p className="mt-0.5 text-[12px] text-quiet">{tx(sub)}</p> : null}
    </>
  );
  return href ? (
    <Link href={href} className={cn(frame, "block transition-shadow hover:shadow-tile")}>
      {body}
    </Link>
  ) : (
    <div className={frame}>{body}</div>
  );
}
