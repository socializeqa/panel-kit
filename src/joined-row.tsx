import { cn } from "./cn";

// Two or three field boxes fused into one control — a date with its slot, a
// visit's day with its time. Each child takes `className={joinedEdge(i, n)}`
// (classes.ts), which squares the corners facing a seam, and an equal share
// of the width. Below sm the pair stays one control, stacked.
export function JoinedRow({ cols = 2, children }: { cols?: 2 | 3; children: React.ReactNode }) {
  return (
    <div className={cn("grid grid-cols-1", cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>{children}</div>
  );
}
