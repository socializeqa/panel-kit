"use client";

import type { LucideIcon } from "lucide-react";
import { pillClass } from "./classes";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";

// The one fused pill bar — a short set of answers as one object on one line,
// each segment sharing its borders with the next, the chosen one lit in the
// brand's soft wash. Single choice (radio) or several (checkbox); controlled
// (value + onChange, the filter drawer) or posted by a plain form (name +
// defaultValue). Four copies of this bar lived in Elite Touch before it
// (Damine, 25 Aug 2026).

/** A pill's glyph in the dress every fused pill wears — quiet until its pill is picked. */
export function pillGlyph(Icon: LucideIcon): React.ReactNode {
  return <Icon size={16} strokeWidth={1.9} aria-hidden="true" className="shrink-0 text-ink/40 transition-colors" />;
}

export interface PillOption {
  value: string;
  label: string;
  /** A glyph before the word. */
  icon?: React.ReactNode;
}

type Single = {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  /** Tapping the lit pill clears the choice ("" arrives). */
  onChange?: (value: string) => void;
};
type Multi = {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
};

export function ChoicePills({
  name,
  options,
  ariaLabel,
  className,
  wrap = false,
  flush,
  columns,
  ...choice
}: {
  /** Posted by the form: each checked pill sends `name=value`. */
  name?: string;
  options: PillOption[];
  ariaLabel?: string;
  className?: string;
  /** Compact screens break the bar into a grid of standalone pills; the fused line returns at sm. */
  wrap?: boolean;
  /** The bar is one half of a JoinedRow — drop the radius on that edge. */
  flush?: "start" | "end";
  /** Many answers: a grid of standalone pills, this many a row, instead of one
   *  fused line. Below sm at most three a row (Señorritas: six across a phone
   *  cut every word). */
  columns?: number;
} & (Single | Multi)) {
  const t = usePanelT();
  const controlled = choice.value !== undefined;
  const isOn = (v: string) =>
    choice.multiple
      ? (controlled ? (choice.value as string[]) : (choice.defaultValue ?? [])).includes(v)
      : (controlled ? choice.value : choice.defaultValue) === v;

  const pick = (v: string) => {
    if (choice.multiple) {
      const cur = (choice.value ?? choice.defaultValue ?? []) as string[];
      choice.onChange?.(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
    } else {
      choice.onChange?.(choice.value === v ? "" : v);
    }
  };

  return (
    <div
      role={choice.multiple ? "group" : "radiogroup"}
      aria-label={ariaLabel ? t(ariaLabel) : undefined}
      className={cn(
        columns
          ? "grid gap-1 [grid-template-columns:repeat(var(--cols-sm),minmax(0,1fr))] sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
          : wrap
            ? "grid grid-cols-3 gap-1 sm:flex sm:gap-0"
            : "flex",
        className,
      )}
      style={columns ? ({ "--cols": columns, "--cols-sm": Math.min(columns, 3) } as React.CSSProperties) : undefined}
    >
      {options.map((o, i) => {
        const on = isOn(o.value);
        const first = i === 0;
        const last = i === options.length - 1;
        return (
          <label key={o.value} className="relative min-w-0 flex-1 cursor-pointer">
            <input
              type={choice.multiple ? "checkbox" : "radio"}
              name={name}
              value={o.value}
              className="peer sr-only"
              {...(controlled
                ? {
                    checked: on,
                    onChange: () => pick(o.value),
                    onClick: choice.multiple ? undefined : () => on && pick(o.value),
                  }
                : { defaultChecked: on })}
            />
            <span
              className={cn(
                pillClass(first, last, !columns),
                flush === "start" && first && "sm:rounded-s-none",
                flush === "end" && last && "sm:rounded-e-none",
              )}
            >
              {o.icon}
              <span className="truncate">{t(o.label)}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
