"use client";

import { Check, X } from "lucide-react";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";

type Step = { value: string; label: string };

// Where one record stands on its path: every stage in order as a point on a
// line, the ones behind it done, the one it is at ringed, the rest ahead. The
// way out (rejected, lost) sits apart at the end. With `onPick` each point is
// a button that moves the record there; the app decides what a pick means
// (a hire or a rejection can ask first). Labels are short: the walk has to
// fit a drawer, and a phone. X Capital's candidate file, 4 Oct 2026.
export function StageWalk({
  steps,
  current,
  exit,
  onPick,
  disabled = false,
  label = "Stage",
}: {
  steps: Step[];
  current: string;
  exit?: Step;
  onPick?: (value: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const t = usePanelT();
  const out = exit?.value === current;
  const at = steps.findIndex((s) => s.value === current);
  const reach = out ? -1 : at;
  const span = steps.length > 1 ? reach / (steps.length - 1) : 0;

  const point = (step: Step, i: number) => {
    const done = i < reach;
    const here = i === reach;
    const body = (
      <>
        <span
          className={cn(
            "relative z-[1] grid size-6 place-items-center rounded-full border text-[11px] font-semibold tabular-nums",
            done && "border-ink bg-ink text-surface",
            here && "border-brand-deep bg-surface text-brand-deep ring-4 ring-brand-soft",
            !done && !here && "border-ink/20 bg-surface text-ink/40",
            onPick && !here && "transition-colors duration-150 fine:group-hover:border-ink/50",
          )}
        >
          {done ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : i + 1}
        </span>
        <span
          className={cn(
            "text-[11px] font-medium",
            here ? "whitespace-nowrap text-brand-deep" : cn("max-w-full truncate @max-[34rem]:sr-only", done ? "text-ink/75" : "text-ink/45"),
          )}
        >
          {t(step.label)}
        </span>
      </>
    );
    const shape = "flex min-w-0 flex-col items-center gap-1.5";
    return onPick && !here ? (
      <button
        key={step.value}
        type="button"
        disabled={disabled}
        onClick={() => onPick(step.value)}
        title={t("Move to {stage}", { stage: t(step.label) })}
        className={cn(shape, "group rounded-control transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60")}
      >
        {body}
      </button>
    ) : (
      <span key={step.value} className={shape} aria-current={here ? "step" : undefined}>
        {body}
      </span>
    );
  };

  return (
    // A container, so a narrow seat (a phone, a slim drawer) keeps only the
    // current stage's name under its point: seven names never fit there.
    <div role="group" aria-label={t(label)} className="@container flex items-start gap-3">
      <div className={cn("relative grid min-w-0 flex-1", out && "opacity-45")} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {/* The line runs from the first point's centre to the last; the part walked is ink. */}
        <span aria-hidden className="absolute top-3 h-px bg-ink/15" style={{ insetInline: `calc(100% / ${steps.length * 2})` }} />
        <span
          aria-hidden
          className="absolute top-3 h-px origin-[left_center] bg-ink rtl:origin-[right_center]"
          style={{ insetInlineStart: `calc(100% / ${steps.length * 2})`, width: `calc(100% - 100% / ${steps.length})`, transform: `scaleX(${Math.max(span, 0)})` }}
        />
        {steps.map(point)}
      </div>
      {exit ? (
        <>
          <span aria-hidden className="mt-1 h-4 w-px shrink-0 bg-ink/15" />
          {onPick && !out ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(exit.value)}
              title={t("Move to {stage}", { stage: t(exit.label) })}
              className="group flex shrink-0 flex-col items-center gap-1.5 rounded-control transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
            >
              <span className="grid size-6 place-items-center rounded-full border border-ink/20 bg-surface text-ink/40 transition-colors duration-150 fine:group-hover:border-danger/60 fine:group-hover:text-danger">
                <X className="size-3.5" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="text-[11px] font-medium text-ink/45">{t(exit.label)}</span>
            </button>
          ) : (
            <span className="flex shrink-0 flex-col items-center gap-1.5" aria-current={out ? "step" : undefined}>
              <span className={cn("grid size-6 place-items-center rounded-full border", out ? "border-danger bg-danger-soft text-danger" : "border-ink/20 bg-surface text-ink/40")}>
                <X className="size-3.5" strokeWidth={2.2} aria-hidden />
              </span>
              <span className={cn("text-[11px] font-medium", out ? "text-danger" : "text-ink/45")}>{t(exit.label)}</span>
            </span>
          )}
        </>
      ) : null}
    </div>
  );
}
