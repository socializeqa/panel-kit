import { cn } from "./cn";

// Fine film grain for a dark door's ground (sign in, set a password). A
// self-contained feTurbulence SVG, so there is no asset to ship or fetch.
// Never over the rail: a blend layer over a full-height, always-visible rail
// froze weaker tablet GPUs in Elite Touch.
const GRAIN_IMAGE =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='160'%20height='160'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.9'%20numOctaves='4'%20stitchTiles='stitch'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23n)'/%3E%3C/svg%3E\")";

// Pass an `opacity-[…]` class to tune the grain per surface.
export function GrainOverlay({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-soft-light", className)}
      style={{ backgroundImage: GRAIN_IMAGE, backgroundSize: "160px 160px" }}
    />
  );
}
