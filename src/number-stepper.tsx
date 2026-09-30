"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { fieldBox, iconBtnClass } from "./classes";
import { cn } from "./cn";
import { useMarkDrawerDirty } from "./drawer";
import { usePanelT } from "./panel-provider";

/** How many decimals a step carries — half an hour one, a whole day none. */
function placesOf(step: number): number {
  const [, decimals = ""] = String(step).split(".");
  return decimals.length;
}

/**
 * What the box holds after a keystroke. `text` is what it shows, kept as
 * typed while a number is on its way ("2.", "."); `value` is the number to
 * hand up — null for an empty box, undefined while nothing reads as a number
 * yet. A null result refuses the key and the box keeps what it had: a letter,
 * a second point, a decimal the step does not carry.
 */
export function stepperEntry(
  text: string,
  limits: { step: number; min: number; max: number },
): { text: string; value: number | null | undefined } | null {
  if (text === "") return { text: "", value: null };
  const places = placesOf(limits.step);
  const shape = places > 0 ? new RegExp(`^\\d*(\\.\\d{0,${places}})?$`) : /^\d*$/;
  if (!shape.test(text)) return null;
  if (text === ".") return { text, value: undefined };
  const n = Number(text);
  const held = Math.max(limits.min, Math.min(limits.max, n));
  return held === n ? { text, value: n } : { text: String(held), value: held };
}

// A compact − [number unit] + control for small counted figures (crew, days,
// overtime hours). Empty means "not set"; blanking the box hands up null. A
// step with decimals (0.5) takes them typed, too. Controlled — pass `name` to
// also post the value as a hidden form field.
export function NumberStepper({
  value,
  onChange,
  suffix,
  name,
  step = 1,
  min = 0,
  max = 9999,
  className,
  placeholder = "0",
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  suffix: string;
  name?: string;
  step?: number;
  min?: number;
  max?: number;
  /** Extra classes on the box — a JoinedRow passes the edge rounding. */
  className?: string;
  /** What an empty box shows — "Any" where empty means no limit (Señorritas). */
  placeholder?: string;
}) {
  const t = usePanelT();
  // What is being typed, while the box has focus — "2." has to stay on screen
  // even though the number it reads as is 2.
  const [draft, setDraft] = useState<string | null>(null);
  const places = placesOf(step);
  const clamp = (n: number) => Math.max(min, Math.min(max, Number(n.toFixed(places))));
  const markDirty = useMarkDrawerDirty();
  const stepTo = (n: number) => {
    markDirty();
    onChange(clamp(n));
  };
  const unit = t(suffix);
  return (
    <div className={cn(fieldBox("md"), "flex w-auto items-center gap-1 p-0.5", className)}>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      <button
        type="button"
        aria-label={t("Fewer {unit}", { unit })}
        onClick={() => stepTo((value ?? 0) - step)}
        disabled={(value ?? 0) <= min}
        className={cn(iconBtnClass(8, "ink"), "shrink-0")}
      >
        <Minus className="size-4" />
      </button>
      <div className="flex flex-1 items-baseline justify-center gap-1.5">
        <input
          inputMode={places ? "decimal" : "numeric"}
          aria-label={unit}
          value={draft ?? value ?? ""}
          onChange={(e) => {
            const next = stepperEntry(e.target.value.trim(), { step, min, max });
            if (!next) return;
            setDraft(next.text);
            if (next.value !== undefined) onChange(next.value);
          }}
          onBlur={() => setDraft(null)}
          placeholder={t(placeholder)}
          className="w-10 border-0 bg-transparent text-center text-[14px] font-semibold tabular-nums text-ink outline-none"
        />
        <span className="text-[12px] font-medium text-quiet">{unit}</span>
      </div>
      <button
        type="button"
        aria-label={t("More {unit}", { unit })}
        onClick={() => stepTo((value ?? 0) + step)}
        className={cn(iconBtnClass(8, "ink"), "shrink-0")}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
