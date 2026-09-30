import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "./cn";
import { tx } from "./tx";

// The empty state — DataTable's when a list has no rows, and anywhere else
// with nothing in it yet. An icon medallion, a title, an optional line and
// action: an empty screen reads as designed, not broken.
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  fill = false,
  size = "full",
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  // Stretch to fill the parent's height (full-height list pages).
  fill?: boolean;
  // "full" = the medallion (list pages). "inline" = a compact dashed box for a
  // section with nothing in it yet. "line" = one quiet sentence.
  size?: "full" | "inline" | "line";
  className?: string;
}) {
  if (size === "line") {
    return (
      <p className={cn("py-2 text-[13px] text-quiet", className)}>
        {tx(title)}
        {description ? <> {tx(description)}</> : null}
      </p>
    );
  }
  if (size === "inline") {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-ink/15 px-4 py-6 text-center",
          className,
        )}
      >
        <Icon size={18} strokeWidth={1.8} className="text-ink/30" aria-hidden="true" />
        <p className="text-[13px] font-medium text-ink/60">{tx(title)}</p>
        {description ? <p className="text-[12px] text-quiet">{tx(description)}</p> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid place-items-center rounded-panel border border-dashed border-ink/15 bg-gradient-to-b from-surface/70 to-ink/[0.02] px-6 py-16 text-center",
        fill && "h-full min-h-0 flex-1",
        className,
      )}
    >
      <div className="flex max-w-sm flex-col items-center">
        {/* The medallion: a soft wash and a dashed ring around a raised disc. */}
        <div className="relative mb-5 grid size-16 place-items-center">
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand/[0.07]" />
          <span aria-hidden="true" className="absolute inset-[5px] rounded-full border border-dashed border-brand-deep/25" />
          <span className="relative grid size-11 place-items-center rounded-full bg-surface shadow-tile ring-1 ring-ink/[0.06]">
            <Icon size={20} strokeWidth={1.8} className="text-brand-deep" aria-hidden="true" />
          </span>
        </div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{tx(title)}</h3>
        {description ? <p className="mt-1.5 text-[13px] leading-relaxed text-quiet">{tx(description)}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
