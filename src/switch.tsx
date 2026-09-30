"use client";

import { cn } from "./cn";
import { useMarkDrawerDirty } from "./drawer";
import { usePanelT } from "./panel-provider";

// The one on/off switch — for a grid of many yes/no cells (a role's
// permissions) where a pill bar per cell would not fit. Wherever a handful of
// words is being chosen, ChoicePills is the control; this is for a matrix.
// The knob slides on transform alone, and not at all for a person who asked
// for less motion.
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  size = "sm",
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** What the switch decides — read by screen readers, shown as the title. */
  label: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = usePanelT();
  const markDirty = useMarkDrawerDirty();
  const track = size === "md" ? "h-6 w-10" : "h-[18px] w-8";
  // --kit-dir turns the travel round in Arabic (kit.css).
  const knob =
    size === "md"
      ? "size-5 group-aria-checked:translate-x-[calc(1rem*var(--kit-dir))]"
      : "size-3 group-aria-checked:translate-x-[calc(0.875rem*var(--kit-dir))]";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={t(label)}
      title={t(label)}
      disabled={disabled}
      onClick={() => {
        markDirty();
        onChange(!checked);
      }}
      className={cn(
        "group relative inline-flex shrink-0 items-center rounded-full border border-ink/15 bg-ink/10 transition-colors aria-checked:border-brand-deep aria-checked:bg-brand disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep/40",
        track,
        className,
      )}
    >
      <span
        className={cn(
          "absolute start-0.5 rounded-full bg-surface shadow-kit-panel transition-transform duration-150 ease-out motion-reduce:transition-none group-aria-checked:bg-brand-ink",
          knob,
        )}
      />
    </button>
  );
}
