"use client";

import { cn } from "./cn";
import { usePanelT } from "./panel-provider";

// A small two- or three-way switch — merged pills, one lit. For choosing a
// view or a mode, never for data a form posts (that is SelectMenu or
// ChoicePills). Switching is instant: a view switch is used many times a day.
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  equal = false,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  /** Every segment the same width (the widest wins). */
  equal?: boolean;
}) {
  const t = usePanelT();
  return (
    <div role="group" className={cn("inline-flex", equal && "grid auto-cols-fr grid-flow-col")}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 whitespace-nowrap border border-ink/15 bg-surface px-3 text-[12px] font-medium text-ink/65 transition-colors hover:text-ink",
            equal && "text-center",
            i > 0 && "-ms-px",
            i === 0 && "rounded-s-control",
            i === options.length - 1 && "rounded-e-control",
            o.value === value && "relative z-[1] border-brand-deep bg-brand-soft text-brand-deep",
          )}
        >
          {t(o.label)}
        </button>
      ))}
    </div>
  );
}
