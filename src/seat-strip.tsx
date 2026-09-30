import { cn } from "./cn";

// The one action language of a card or a row: seats, fused into a strip.
//
// The drawer header already spoke it — PDF · download · close touching in one
// bordered control. Rows spoke two others: bordered pills with words, and
// naked grey glyphs scattered along the row (Damine, 25 Aug 2026: "like two
// different worlds… the icons look so AI"). This is the header's grammar
// brought down to the content: a word seat and a glyph seat (wordSeat and
// glyphSeat in classes.ts) share one body, one hairline, one 31px height, and
// sit shoulder to shoulder, so a row carries ONE control at its end.
//
// The strip owns the frame and the seams; a seat is borderless inside it.
// Server-safe: lists compose it around links and server-action buttons.
export function SeatStrip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        // style-guard-ignore: the strip wears a field's frame on purpose — a
        // row's one control reads as kin to the inputs, not as a field itself.
        "inline-flex shrink-0 items-stretch overflow-hidden rounded-control border border-ink/15 bg-surface",
        "[&>*+*]:border-s [&>*+*]:border-ink/[0.1]",
        className,
      )}
    >
      {children}
    </span>
  );
}
