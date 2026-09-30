import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { PANEL_SHELL } from "./classes";
import { cn } from "./cn";
import { Hint } from "./hint";
import { PageMeta } from "./page-header-context";
import { tx } from "./tx";

// The record page's furniture: the links under its header, the card shells,
// the footers, the small labels. Server-safe — a record's details compose
// these around server actions.

// A compact muted row of cross-links under a record header, so a record links
// back to where it came from instead of being a dead end. Falsy entries skip.
export function RecordLinks({ links }: { links: ({ label: string; href: string } | null | undefined | false)[] }) {
  const items = links.filter((l): l is { label: string; href: string } => !!l);
  if (items.length === 0) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      {items.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-[12px] font-medium text-ink/65 transition-colors hover:bg-ink/[0.09] hover:text-ink"
        >
          {tx(l.label)}
        </Link>
      ))}
    </div>
  );
}

// Header for a single-record screen. The title is published into the shared
// top bar (like every list page) rather than repeated in the body, so the page
// opens straight into its content. A status badge still renders inline.
export function RecordHeader({ title, badge }: { title: string; badge?: React.ReactNode }) {
  return (
    <>
      <PageMeta title={title} />
      {badge ? <div className="mb-4 flex flex-wrap items-center gap-3">{badge}</div> : null}
    </>
  );
}

// The one footer arrangement for an editable record form: Save (and a
// secondary, e.g. Cancel) at the start, the destructive action at the end.
export function FormFooter({ children, danger }: { children: React.ReactNode; danger?: React.ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {danger ?? null}
    </div>
  );
}

// A form's action bar pinned to the foot of the drawer: Save or Create first,
// Cancel beside it, each an equal share of the width, an error above. It
// sticks to the foot of the drawer's scroll area, so the button is in reach
// however long the form. The host renders its Drawer with padded={false} and
// pads the fields itself, so the bar reaches the true edge.
export function FormBar({
  error,
  note,
  noteIcon,
  align = "fill",
  className,
  children,
}: {
  error?: string | null;
  /** A quiet line above the buttons — what the bar is asking. */
  note?: React.ReactNode;
  noteIcon?: LucideIcon;
  /**
   * "fill" — every button an equal share of the bar (a drawer, ~600px wide).
   * "end" — the fused control at its own width, at the end of the bar: a page
   * is three times wider, and two buttons stretched across it read as a slab.
   */
  align?: "fill" | "end";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // The rise plays on mount, so the bar rises with the drawer, and switching
    // modes swaps one bar for another with the same motion.
    <div
      className={cn(
        "sticky bottom-0 z-[4] mt-5 flex flex-col gap-2 border-t border-ink/[0.08] bg-ground/95 px-5 py-3 backdrop-blur animate-bar-rise sm:px-7",
        className,
      )}
    >
      {error ? (
        <Hint tone="error" className="justify-center">
          {error}
        </Hint>
      ) : note ? (
        <Hint icon={noteIcon} className="justify-center">
          {note}
        </Hint>
      ) : null}
      {/* One fused control, edges joined — the same merged bar everywhere. */}
      <div
        className={cn(
          "grid grid-flow-col [&>*]:w-full [&>*:not(:first-child)]:-ms-px [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none [&>*:focus-visible]:relative [&>*:focus-visible]:z-[1] [&>*:hover]:relative [&>*:hover]:z-[1]",
          align === "end" ? "ms-auto auto-cols-max" : "auto-cols-fr",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function Panel({
  title,
  className,
  padding = "5",
  grow = false,
  children,
}: {
  title?: string;
  className?: string;
  // The three real paddings: "5" (default), "4" (dense meta cards), "3"
  // (tight inline cards). Pick one — never re-type the shell.
  padding?: "5" | "4" | "3";
  // Stretch with the column instead of auto height.
  grow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(PANEL_SHELL, padding === "5" ? "p-5" : padding === "4" ? "p-4" : "p-3", grow && "flex-1", className)}>
      {title && <h2 className="mb-4 text-[14px] font-semibold text-ink">{tx(title)}</h2>}
      {children}
    </div>
  );
}

// A card for an editable form, with a divided action footer for Save /
// Cancel / Delete. Wrap it in the page's <form>.
export function FormCard({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className={cn(PANEL_SHELL, "overflow-hidden")}>
      <div className="flex flex-col gap-4 p-5">{children}</div>
      {footer ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/[0.06] bg-ink/[0.015] px-5 py-3.5">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

// Two fields side by side on wider screens, stacked on a phone.
export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

// The small heading that splits a record form into parts. Sentence case at
// 12px: the house has no all-caps, and a lowercase word needs the pixel the
// capitals did not.
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[12px] font-semibold text-quiet">{tx(children)}</h3>;
}

// The micro-label, anywhere outside a form section — Elite Touch's audit found
// 15 hand-typed variants; these are the two. "md" is SectionTitle's spec,
// "sm" the meta label MetaRow uses.
export function Eyebrow({
  size = "md",
  className,
  children,
}: {
  size?: "md" | "sm";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "block whitespace-nowrap text-[12px] text-quiet",
        size === "md" ? "font-semibold" : "font-medium",
        className,
      )}
    >
      {tx(children)}
    </span>
  );
}

export function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-ink/[0.06] py-2.5 first:border-t-0 first:pt-0">
      <span className="text-[12px] font-medium text-quiet">{tx(label)}</span>
      <span className="break-words text-[13px] text-ink/80">{tx(value)}</span>
    </div>
  );
}
