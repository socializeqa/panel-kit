import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge only knows Tailwind's own names. Without these, `shadow-menu`
// reads as a shadow COLOUR and `cn("shadow-sm", "shadow-menu")` keeps both, so
// the menu loses its shadow to whichever the stylesheet printed last; and
// `cn("bg-surface", "bg-brand")` keeps both, so a lit seat stays white. Every
// name kit.css adds is taught here.
// Ported from Señorritas' kit/cn.ts (which taught it ET's shadow names).
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "ink",
        "quiet",
        "ground",
        "surface",
        "surface-2",
        "rail",
        "on-rail",
        "rail-accent",
        "brand",
        "brand-ink",
        "brand-deep",
        "brand-bright",
        "brand-soft",
        "ok",
        "ok-soft",
        "warn",
        "warn-soft",
        "danger",
        "danger-soft",
        "info",
        "info-soft",
      ],
      shadow: ["panel", "menu", "tile", "lift", "focus"],
      radius: ["panel", "control"],
      ease: ["drawer", "brand"],
      font: ["panel", "panel-arabic"],
      animate: [
        "menu-in",
        "menu-out",
        "dialog-in",
        "drawer-in",
        "drawer-out",
        "rail-in",
        "scrim-in",
        "scrim-out",
        "fade-in",
        "bar-rise",
        "bar-nudge",
      ],
    },
  },
});

// The kit's one class joiner: conditional classes in, the later utility wins
// on a conflict.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
