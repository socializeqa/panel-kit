import { PANEL_SHELL } from "./classes";
import { cn } from "./cn";

// The figures strip: one card, its figures side by side behind hairlines —
// half the height of a row of tiles, the same numbers. Children are StatTiles
// rendered with `strip`.
//
// Space-driven, never per-device: as many cells as fit at 220px each, and a
// cell that would go below that wraps to a second row instead of squeezing its
// label onto two lines. The hairlines are the 1px gap showing the tinted
// backdrop through, which stays right however the cells wrap (Elite Touch,
// 26 Aug 2026: "no squeezes, clean on all devices").
//
// `tight` (Señorritas) lets a cell go down to 150px, for strips whose labels
// are one short word — on a phone two cells sit side by side.
export function StatStrip({ children, className, tight = false }: { children: React.ReactNode; className?: string; tight?: boolean }) {
  return (
    <div
      className={cn(
        PANEL_SHELL,
        "grid gap-px overflow-hidden bg-ink/[0.07] [&>*]:bg-surface",
        tight
          ? "[grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]"
          : "[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
