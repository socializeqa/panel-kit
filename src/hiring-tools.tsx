"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, UserRoundX } from "lucide-react";
import type { ActionResult } from "./action-result";
import { CheckList } from "./check-list";
import { CTRL_BTN } from "./classes";
import { hiredOf, rejectedOf, stageOf, type HiringWords } from "./hiring-words";
import { ConfirmDialog } from "./modal";
import { usePanelT } from "./panel-provider";
import { Switch } from "./switch";
import { useToast } from "./toast";

/** A candidate as the bulk tools need them: who, where they stand, and the reader's score for the tick list. */
export interface ToolCandidate {
  id: string;
  name: string;
  stage: string;
  fitScore: number | null;
}

// The candidates list's own seats in the top bar (PageMeta's `action`): the
// list as a spreadsheet, and letting many go at once. Both act on what the
// filters show, every page of it, so "Fit: weak" then "Let go" is the whole of
// the weak, not one page. Only those still on the walk can be let go: a hire
// or a no is settled. Everyone starts ticked; untick anyone to keep.
export function HiringTools({
  words,
  candidates,
  exportHref,
  canManage,
  regretLetter = true,
  reasonPlaceholder = "Not enough experience for the role",
  onLetGo,
}: {
  words: Pick<HiringWords, "stages" | "hired" | "rejected" | "fitWord">;
  /** Everyone the list's filters show, across all its pages. */
  candidates: ToolCandidate[];
  /** The spreadsheet, with the same filters as the list on screen; no seat when left out. */
  exportHref?: string;
  canManage: boolean;
  /** Offer to send each the regret letter (a panel that writes no letters turns it off). */
  regretLetter?: boolean;
  reasonPlaceholder?: string;
  onLetGo: (ids: string[], reason: string, sendLetter: boolean) => Promise<ActionResult>;
}) {
  const t = usePanelT();
  const router = useRouter();
  const toast = useToast();
  const settled = new Set([hiredOf(words), rejectedOf(words)]);
  const open = candidates.filter((c) => !settled.has(c.stage));
  const [asking, setAsking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [withLetter, setWithLetter] = useState(regretLetter);
  const [pending, start] = useTransition();
  const out = stageOf(words, rejectedOf(words));

  const begin = () => {
    setPicked(open.map((c) => c.id));
    setAsking(true);
  };
  const confirm = (reason: string) =>
    start(async () => {
      const res = await onLetGo(picked, reason, regretLetter && withLetter);
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      setAsking(false);
      toast(res.message ?? t("Done"));
      router.refresh();
    });

  const exportLabel = t("Download the list as a spreadsheet");
  return (
    // `contents`: its two seats join the top bar's fused strip, framed like search and filter beside them.
    <div className="contents">
      {exportHref ? (
        <a href={exportHref} download aria-label={exportLabel} title={exportLabel} className={CTRL_BTN}>
          <Download size={16} strokeWidth={2} aria-hidden="true" />
        </a>
      ) : null}
      {canManage ? (
        <button
          type="button"
          onClick={begin}
          disabled={!open.length}
          aria-label={t("Let go in bulk")}
          title={t("Let go the people this list shows")}
          className={CTRL_BTN}
        >
          <UserRoundX size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}
      <ConfirmDialog
        open={asking}
        onClose={() => setAsking(false)}
        onConfirm={confirm}
        kicker="Before you let them go"
        title={picked.length === 1 ? t("Let 1 candidate go?") : t("Let {n} candidates go?", { n: picked.length })}
        body={t("Each moves to {stage} with your reason in their story. Untick anyone you want to keep.", { stage: t(out.label) })}
        reason={{ label: "Why?", placeholder: reasonPlaceholder, required: true }}
        confirmLabel={t("Let {n} go", { n: picked.length })}
        confirmIcon={UserRoundX}
        pendingLabel="Letting go…"
        tone="danger"
        pending={pending}
        // With nobody ticked the act has no one to act on; the bar says so and holds the button.
        error={picked.length ? null : t("Tick at least one person.")}
      >
        <div className="flex flex-col gap-4">
          <CheckList
            label="Candidates to let go"
            items={open.map((c) => ({
              id: c.id,
              label: c.name,
              meta: c.fitScore === null ? t(words.fitWord(null)) : `${c.fitScore} · ${t(words.fitWord(c.fitScore))}`,
            }))}
            picked={picked}
            onChange={setPicked}
          />
          {regretLetter ? (
            <label className="flex items-center justify-between gap-4 text-[13px] text-ink">
              <span>
                {t("Send each the regret letter")}
                <span className="block text-[12px] text-quiet">{t("In their own language, once each")}</span>
              </span>
              <Switch checked={withLetter} onChange={setWithLetter} label="Send each the regret letter" size="md" />
            </label>
          ) : null}
        </div>
      </ConfirmDialog>
    </div>
  );
}
