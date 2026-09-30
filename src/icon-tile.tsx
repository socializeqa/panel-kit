import { tileClass, type TileSize, type TileTone } from "./classes";
import { cn } from "./cn";

export type { TileSize, TileTone };

// The one glyph square. Every icon that sits in a tinted tile — a section's
// head, a band's badge, a stat cell, the drawer's room mark — is this, and
// the TILE sizes the glyph: whatever size the caller's <Icon size={…}> asked
// for, the tile's own rule wins (Elite Touch's audit of 25 Aug 2026 measured
// 28/32/36 squares wearing 14/15/16/17 glyphs across one drawer).
// Server-safe on purpose — record details compose it with server actions.
export function IconTile({
  size = "sm",
  tone = "quiet",
  className,
  children,
}: {
  size?: TileSize;
  tone?: TileTone;
  className?: string;
  /** The glyph — any size; the tile resizes it. */
  children: React.ReactNode;
}) {
  return <span className={cn(tileClass(size, tone), className)}>{children}</span>;
}

// The ordinal mark of a row — "1", "V2" — the same 28px square as the row
// glyphs beside it, so a card's left column is one straight rail of squares.
// `open` draws it hollow: a thing not yet in force (a draft, a proposal).
export function IndexTile({ open, className, children }: { open?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-lg text-[11px] font-semibold tabular-nums",
        open ? "border border-ink/15 bg-surface text-ink/70" : "bg-rail text-on-rail",
        className,
      )}
    >
      {children}
    </span>
  );
}
