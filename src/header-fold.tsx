"use client";

import { useState, type ReactNode } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { CTRL_BTN } from "./classes";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";
import { useDismiss } from "./use-dismiss";

// The header's ⋯ seat that unfolds toward the start into a fused control, the
// hidden action riding beside it — one object, the danger only once you ask
// for it (Damine, 23 Aug 2026: "delete must slide left from the dots like the
// cancel request button"). An outside click or Escape folds it back.
// `children` is the revealed button: give it FOLD_ACTION (classes.ts) as its
// class base.
export function HeaderFold({ children }: { children: (fold: () => void, revealed: boolean) => ReactNode }) {
  const t = usePanelT();
  const [revealed, setRevealed] = useState(false);
  const ref = useDismiss<HTMLDivElement>(revealed, () => setRevealed(false));
  const fold = () => setRevealed(false);
  const label = revealed ? t("Hide actions") : t("More actions");

  return (
    <div ref={ref} className="contents">
      {/* The room opens at once and the action slides in from the dots on
          transform and opacity (Elite Touch eased the column's width — a
          layout animation). Folding is instant. --kit-dir sends it the other
          way in Arabic. */}
      <div className={cn("grid", revealed ? "[grid-template-columns:1fr]" : "[grid-template-columns:0fr]")}>
        <div className="min-w-0 overflow-hidden">
          <div
            className={cn(
              "transition-[translate,opacity] duration-200 ease-out motion-reduce:transition-[opacity]",
              revealed ? "translate-x-0 opacity-100" : "translate-x-[calc(100%*var(--kit-dir))] opacity-0",
            )}
          >
            {children(fold, revealed)}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        aria-label={label}
        title={label}
        aria-expanded={revealed}
        className={cn(CTRL_BTN, "w-9 justify-center px-0", revealed && "relative z-[1] -ms-px rounded-s-none border-ink/30 text-ink")}
      >
        {revealed ? <X className="size-[18px]" strokeWidth={1.9} /> : <MoreHorizontal className="size-[18px]" strokeWidth={1.9} />}
      </button>
    </div>
  );
}
