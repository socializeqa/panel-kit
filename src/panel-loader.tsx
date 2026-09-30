import { cn } from "./cn";
import { Tx } from "./panel-provider";

// The one loading state for every surface — a list, a record page, a drawer.
// Light on purpose: the page's chrome is already there, so the loader only
// says "a moment" in the house voice, not a sketch of the layout in grey
// blocks (which read as a broken page; Elite Touch, 23 Aug 2026).
//
// A rail-dark tile — the tile a drawer header and a room wear — with a single
// brand arc tracing round it, and one quiet word underneath.
export function PanelLoader({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      // Fill whatever holds it — a drawer's scroll area is a plain block, so
      // the loader takes the full height and lands in the middle; a page with
      // no fixed height still gets 40vh to centre in.
      className={cn("flex min-h-[max(40vh,100%)] flex-1 flex-col items-center justify-center gap-4", className)}
    >
      <span className="relative block size-12">
        <span aria-hidden="true" className="absolute inset-0 rounded-2xl border-2 border-brand-deep/15" />
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-spin rounded-2xl border-2 border-transparent border-t-brand-deep [animation-duration:0.9s]"
        />
        <span aria-hidden="true" className="absolute inset-[7px] rounded-xl bg-rail shadow-kit-tile">
          <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-rail-accent" />
        </span>
      </span>
      <span className="text-[12px] font-medium text-quiet">
        <Tx>{label}</Tx>…
      </span>
    </div>
  );
}
