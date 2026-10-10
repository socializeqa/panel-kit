"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCcw, Undo2, UserRoundCheck, UserRoundX } from "lucide-react";
import type { ActionResult } from "./action-result";
import { DecisionItem } from "./decision-bar";
import { Button } from "./fields";
import { hiredOf, offeredMoves, rejectedOf, stageOf, walkOf, walkPick, type HiringWords } from "./hiring-words";
import { ConfirmDialog } from "./modal";
import { usePanelT } from "./panel-provider";
import { RowMenu } from "./row-menu";
import { StageWalk } from "./stage-walk";
import { useToast } from "./toast";

// Where a candidate stands, and the way on. The walk is points on a line; a
// press on a point moves them there. Under it, the stage's next step is the
// one primary door, and the rest (back a step, skip a trial, hire early, let
// go) sit behind the menu. A hire, a let-go and a reopen ask first: they
// settle or unsettle a file. The words and the walk are the app's; which
// moves a stage offers is offeredMoves (hiring-words.ts), held by tests.
export function StageMover({
  words,
  stage,
  name,
  onMove,
  disabled = false,
}: {
  words: HiringWords;
  stage: string;
  /** Who is being moved, for the questions and the toast. */
  name: string;
  /** The move; a reason comes with a hire, a let-go and a reopen, and lands in their story. */
  onMove: (to: string, reason?: string) => Promise<ActionResult>;
  disabled?: boolean;
}) {
  const t = usePanelT();
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [gate, setGate] = useState<"hire" | "letGo" | "reopen" | null>(null);
  const moves = offeredMoves(words, stage);
  const { back, skip, next } = moves;
  // Where a reopened file goes: back to the start, or the stage pressed on the walk.
  const [reopenTo, setReopenTo] = useState(moves.reopen ?? stage);
  const { steps, exit } = walkOf(words);
  const label = (value: string) => t(stageOf(words, value).label);
  const hired = stageOf(words, hiredOf(words));
  const out = stageOf(words, rejectedOf(words));
  const busy = pending || disabled;

  const move = (to: string, reason?: string) =>
    start(async () => {
      const res = await onMove(to, reason || undefined);
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      setGate(null);
      toast(`${name}: ${label(to)}`);
      router.refresh();
    });

  const pick = (to: string) => {
    const kind = walkPick(words, stage, to);
    if (kind === "move") return move(to);
    if (kind === "reopen") setReopenTo(to);
    setGate(kind);
  };

  const stepWords = (to: string) => {
    const s = stageOf(words, to);
    return s.step ? t(s.step) : t("Move to {stage}", { stage: t(s.short) });
  };

  // What comes next, in words, beside the door.
  const said = moves.settled
    ? stage === hired.value
      ? t("Hired: their file is settled.")
      : t("Let go. Reopen to move them again.")
    : next?.hire
      ? t("The last step is the hire.")
      : null;

  return (
    <div className="flex flex-col gap-4">
      <StageWalk steps={steps} current={stageOf(words, stage).value} exit={exit} onPick={pick} disabled={busy} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/[0.07] pt-4">
        <p className="text-[12px] text-quiet">
          {said ??
            (next ? (
              <>
                {t("Next step:")} <span className="font-semibold text-ink">{stepWords(next.to)}</span>
              </>
            ) : null)}
        </p>
        <div className="flex items-center gap-2">
          {!moves.settled ? (
            <RowMenu label="More moves">
              {back ? (
                <DecisionItem onClick={() => move(back)} disabled={busy}>
                  <Undo2 size={15} strokeWidth={2} aria-hidden="true" /> {t("Back to {stage}", { stage: label(back).toLowerCase() })}
                </DecisionItem>
              ) : null}
              {skip ? (
                <DecisionItem onClick={() => move(skip.to)} disabled={busy}>
                  <ArrowRight size={15} strokeWidth={2} aria-hidden="true" /> {t(skip.label)}
                </DecisionItem>
              ) : null}
              {moves.hire ? (
                <DecisionItem onClick={() => setGate("hire")} disabled={busy}>
                  <UserRoundCheck size={15} strokeWidth={2} aria-hidden="true" /> {t("Hire them")}
                </DecisionItem>
              ) : null}
              {moves.letGo ? (
                <DecisionItem danger onClick={() => setGate("letGo")} disabled={busy}>
                  <UserRoundX size={15} strokeWidth={2} aria-hidden="true" /> {t("Let them go")}
                </DecisionItem>
              ) : null}
            </RowMenu>
          ) : null}
          {moves.settled ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setReopenTo(moves.reopen ?? stage);
                setGate("reopen");
              }}
              disabled={busy}
            >
              <RotateCcw size={14} strokeWidth={2} aria-hidden="true" /> {t("Reopen")}
            </Button>
          ) : next && !next.hire ? (
            <Button type="button" size="sm" onClick={() => move(next.to)} disabled={busy}>
              <ArrowRight size={14} strokeWidth={2} aria-hidden="true" /> {stepWords(next.to)}
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={() => setGate("hire")} disabled={busy}>
              <UserRoundCheck size={14} strokeWidth={2} aria-hidden="true" /> {hired.step ? t(hired.step) : t("Hire")}
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={gate === "hire"}
        onClose={() => setGate(null)}
        onConfirm={(why) => move(hired.value, why)}
        title={t("Hire {name}?", { name })}
        body={[
          t("Their file reads {stage} from here. The opening stays on the careers page until you close it.", { stage: t(hired.label) }),
          words.hireNote ? t(words.hireNote) : "",
        ]
          .filter(Boolean)
          .join(" ")}
        reason={{ label: "Anything to note?", placeholder: "Start date, agreed salary, who they report to", required: false }}
        confirmLabel="Hire"
        confirmIcon={UserRoundCheck}
        pendingLabel="Hiring…"
        tone="brand"
        pending={pending}
      />
      <ConfirmDialog
        open={gate === "letGo"}
        onClose={() => setGate(null)}
        onConfirm={(why) => move(out.value, why)}
        kicker="Before you let them go"
        title={t("Let {name} go?", { name })}
        body={t("Their file reads {stage} from here. Nothing is sent to them until you write from Letters.", { stage: t(out.label) })}
        reason={{ label: "Why?", placeholder: "Not enough experience, the role is filled, no reply", required: true }}
        confirmLabel="Let them go"
        confirmIcon={UserRoundX}
        pendingLabel="Saving…"
        tone="danger"
        pending={pending}
      />
      <ConfirmDialog
        open={gate === "reopen"}
        onClose={() => setGate(null)}
        onConfirm={(why) => move(reopenTo, why)}
        title="Reopen this application?"
        body={
          reopenTo === moves.reopen
            ? t("It goes back to {stage}, as if it had just come in.", { stage: label(reopenTo) })
            : t("It moves to {stage} and is open again.", { stage: label(reopenTo).toLowerCase() })
        }
        reason={{ label: "Why?", placeholder: "The role reopened, a second look", required: false }}
        confirmLabel="Reopen"
        confirmIcon={RotateCcw}
        pendingLabel="Reopening…"
        tone="brand"
        pending={pending}
      />
    </div>
  );
}
