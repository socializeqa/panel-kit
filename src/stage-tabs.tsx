"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PANEL_SHELL } from "./classes";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";
import { usePanelPathname } from "./use-panel-pathname";

/** One stage of a list and how many records stand in it. */
export type StageCount = {
  value: string;
  label: string;
  count: number;
  /** A dot before the name: a way out that went well (hired, won) or not (rejected, lost). */
  tone?: "ok" | "danger";
};

const DOT = { ok: "bg-ok", danger: "bg-danger" } as const;

// A list's stages as one strip across its head, each with how many stand
// there: All, then the path a record walks from left to right, then the ways
// out set apart at the end. Each stage is a link that shows only its records
// and keeps the list's other filters; the one in force is washed and marked.
// It replaces a row of figures: the stages ARE the figures. Too many for the
// screen, it scrolls sideways rather than squeeze a name onto two lines.
// X Capital's candidates, 4 Oct 2026 (Damine: "i dont see phases").
export function StageTabs({
  steps,
  exits = [],
  total,
  allLabel = "All",
  param = "status",
  label = "Stages",
  className,
}: {
  steps: StageCount[];
  exits?: StageCount[];
  total: number;
  allLabel?: string;
  /** The search param the list filters its stage by. */
  param?: string;
  /** What the strip is, for a screen reader. */
  label?: string;
  className?: string;
}) {
  const t = usePanelT();
  const pathname = usePanelPathname();
  const params = useSearchParams();
  const current = params.get(param) ?? "";

  const hrefFor = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(param, value);
    else next.delete(param);
    next.delete("page");
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const cell = (stage: StageCount) => {
    const on = current === stage.value;
    return (
      <Link
        key={stage.value || "all"}
        href={hrefFor(stage.value)}
        scroll={false}
        aria-current={on ? "page" : undefined}
        className={cn(
          "relative flex min-w-[118px] flex-1 flex-col justify-center gap-0.5 bg-surface px-4 py-2.5 transition-colors duration-150",
          on ? "bg-brand-soft" : "fine:hover:bg-ink/[0.03]",
        )}
      >
        <span className={cn("flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium", on ? "text-brand-deep" : "text-ink/60")}>
          {stage.tone ? <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT[stage.tone])} /> : null}
          {t(stage.label)}
        </span>
        <span className={cn("text-[18px] font-semibold leading-tight tabular-nums", on ? "text-brand-deep" : stage.count ? "text-ink" : "text-ink/30")}>
          {stage.count}
        </span>
        {on ? <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-deep" /> : null}
      </Link>
    );
  };

  return (
    <nav aria-label={t(label)} className={cn(PANEL_SHELL, "overflow-hidden", className)}>
      <div className="flex gap-px overflow-x-auto bg-ink/[0.07] [scrollbar-width:none]">
        {cell({ value: "", label: allLabel, count: total })}
        {steps.map(cell)}
        {exits.length ? <span aria-hidden className="w-1.5 shrink-0 bg-ink/[0.05]" /> : null}
        {exits.map(cell)}
      </div>
    </nav>
  );
}
