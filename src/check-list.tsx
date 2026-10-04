"use client";

import { Check } from "lucide-react";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";

/** One row of a check list: who or what, and a quiet fact beside it. */
export type CheckItem = { id: string; label: string; meta?: string };

// A list to tick, for an act on many records at once (let go the ones the
// filter shows, archive a batch): each row a tick and its name, All and None
// on top, the count of what is ticked. Ticks are the kit's own, not the
// browser's box, so they look the same in every panel and every light, and a
// screen reader hears each as a checkbox. X Capital's bulk let-go, 4 Oct 2026.
export function CheckList({
  items,
  picked,
  onChange,
  label = "Who",
}: {
  items: CheckItem[];
  picked: string[];
  onChange: (picked: string[]) => void;
  /** What the list is, for a screen reader. */
  label?: string;
}) {
  const t = usePanelT();
  const on = new Set(picked);
  const flip = (id: string) => onChange(on.has(id) ? picked.filter((p) => p !== id) : [...picked, id]);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-ink/70 tabular-nums">{t("{n} of {total} ticked", { n: picked.length, total: items.length })}</span>
        <span className="flex gap-3">
          <button type="button" onClick={() => onChange(items.map((i) => i.id))} className="font-medium text-ink/60 transition-colors duration-150 hover:text-ink">
            {t("All")}
          </button>
          <button type="button" onClick={() => onChange([])} className="font-medium text-ink/60 transition-colors duration-150 hover:text-ink">
            {t("None")}
          </button>
        </span>
      </div>
      <ul role="group" aria-label={t(label)} className="max-h-[280px] overflow-y-auto rounded-control border border-ink/10 bg-surface">
        {items.map((item) => {
          const ticked = on.has(item.id);
          return (
            <li key={item.id} className="border-t border-ink/[0.06] first:border-t-0">
              <button
                type="button"
                role="checkbox"
                aria-checked={ticked}
                onClick={() => flip(item.id)}
                className="flex w-full items-center gap-3 px-3 py-2 text-start transition-colors duration-150 hover:bg-ink/[0.03]"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors duration-150",
                    ticked ? "border-ink bg-ink text-surface" : "border-ink/25 bg-surface",
                  )}
                >
                  {ticked ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{item.label}</span>
                {item.meta ? <span className="shrink-0 text-[12px] text-quiet">{item.meta}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
