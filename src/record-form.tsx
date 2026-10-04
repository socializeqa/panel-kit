"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState } from "react";
import { Loader2, Undo2 } from "lucide-react";
import type { ActionResult } from "./action-result";
import { useDrawerDirty } from "./drawer";
import { cn } from "./cn";
import { Button } from "./fields";
import { ConfirmDialog } from "./modal";
import { usePanelT } from "./panel-provider";
import { FormBar } from "./record";
import { LockedFields } from "./record-editing";
import { useToast } from "./toast";
import { useUnsavedGuard } from "./unsaved-guard";

// The one save model for every editor in the panel (Damine, 23 Aug 2026):
// nothing writes until Save is pressed, and nothing is ever lost silently.
//
// - Save lights up on the first edit and greys out again once saved. The
//   drawer's dirty tracking is the single source of truth — it drives this
//   button, the "Discard changes?" on close, and the browser's own warning on
//   refresh or tab close while there are unsaved edits.
// - A failed save stays in the bar and the form stays dirty, so nothing can
//   look saved that isn't.
// - Ctrl+S saves. Cancel asks "Discard changes?" first when there is unsaved
//   work, in a drawer and on a page alike, and only then empties the form.

// The last save result, for fields that want to react to a refusal (a
// duplicate-phone offer) without RecordForm knowing their shape.
const ResultContext = createContext<ActionResult | null>(null);
export function useRecordFormResult<R extends ActionResult>(): R | null {
  return useContext(ResultContext) as R | null;
}

export function RecordForm<R extends ActionResult>({
  action,
  hidden,
  children,
  submitLabel = "Save changes",
  pendingLabel = "Saving…",
  savedMessage = "Saved",
  onSaved,
  onCancel,
  cancelLabel = "Cancel",
  alwaysSavable = false,
  readOnly = false,
  top = false,
  page = false,
  className,
}: {
  /** The save: one per record, create or update decided by `id`. Any async
   *  function — a server action, or a save from the browser (Señorritas). */
  action: (prev: R | null, fd: FormData) => Promise<R>;
  hidden?: Record<string, string>;
  children: React.ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  savedMessage?: string | null;
  /** After a good save — adopt a new id, close, navigate. */
  onSaved?: (result: R) => void;
  onCancel?: () => void;
  cancelLabel?: string;
  /** A create form: Save is live from the start, there is nothing to be dirty against. */
  alwaysSavable?: boolean;
  /** View mode: fields locked, no Save bar — until the header's pencil unlocks it. */
  readOnly?: boolean;
  /**
   * The form IS the page (Settings), not a drawer's body: it drops the
   * drawer's inset and its vertical centring, so its sections line up with
   * the rest of the page, and its bar bleeds to the frame's edges.
   */
  page?: boolean;
  /**
   * A long record in a drawer (a candidate's whole file) starts at the top. A
   * short form keeps the default: it sits in the middle of the drawer, where
   * a few fields look placed rather than stranded at the top.
   */
  top?: boolean;
  className?: string;
}) {
  const t = usePanelT();
  const [result, formAction, pending] = useActionState<R | null, FormData>(action, null);
  const toast = useToast();
  const { isDirty, markClean, close, inDrawer, askThen } = useDrawerDirty();
  const formRef = useRef<HTMLFormElement>(null);
  // Outside a drawer there is no dirty tracking to borrow — isDirty is a
  // constant true there, which would make the browser warn on EVERY leave. So
  // a page form watches its own fields instead.
  const [touched, setTouched] = useState(false);
  const [cleanedAt, setCleanedAt] = useState<R | null>(null);
  // A good save makes the page form clean again — adjusted during render
  // rather than in an effect, so no second paint carries a stale warning.
  if (result?.ok && cleanedAt !== result) {
    setCleanedAt(result);
    setTouched(false);
  }
  const unsaved = inDrawer ? isDirty : touched;

  // A good save is announced and clears the dirty flag; a bad one is shown in
  // the bar by the render below and leaves the flag alone.
  const last = useRef<R | null>(null);
  useEffect(() => {
    if (!result || result === last.current) return;
    last.current = result;
    if (result.ok) {
      markClean();
      if (savedMessage) toast(savedMessage);
      onSaved?.(result);
    }
  }, [result, markClean, toast, savedMessage, onSaved]);

  // Unsaved work on a form that is NOT in a drawer (Settings). In a drawer the
  // Drawer owns this, on the same hook, because it owns the flag; guarding
  // again here would ask twice for one exit.
  const [leaving, setLeaving] = useState<(() => void) | null>(null);
  useUnsavedGuard({
    when: !inDrawer && unsaved,
    ask: (discard) => setLeaving(() => discard),
  });

  // Ctrl+S / ⌘S saves — the reflex every desk has.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (!formRef.current?.contains(document.activeElement)) return;
        e.preventDefault();
        if (!pending && (isDirty || alwaysSavable)) formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, isDirty, alwaysSavable]);

  const canSave = !pending && (alwaysSavable || isDirty);
  const cancel = onCancel ?? (inDrawer ? close : undefined);
  const error = result && !result.ok ? result.error : null;

  return (
    <>
      <form
        ref={formRef}
        // Submitted from onSubmit, not the action prop. React empties every
        // uncontrolled field after an `action` prop's action succeeds, and a
        // refused save returns rather than throws, so it "succeeds" too: the
        // typed work vanished under the refusal (Elite Touch, 23 Sep 2026).
        // The data is read here, before the save disables the fieldset.
        onSubmit={(e) => {
          e.preventDefault();
          const submitter = (e.nativeEvent as SubmitEvent).submitter;
          const fd = new FormData(e.currentTarget, submitter ?? undefined);
          startTransition(() => formAction(fd));
        }}
        onInput={inDrawer ? undefined : () => setTouched(true)}
        className={className ?? (page ? "flex flex-col" : "flex min-h-full flex-1 flex-col")}
      >
        {hidden ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />) : null}
        <LockedFields className={page ? "flex flex-col gap-5" : cn("flex flex-1 flex-col gap-4 px-5 pt-6 sm:px-7", !top && "justify-center")}>
          {/* Freeze every field while the save round-trips; `contents` keeps
              the section gap untouched. */}
          <fieldset disabled={pending || readOnly} className="contents">
            <ResultContext.Provider value={result}>{children}</ResultContext.Provider>
          </fieldset>
        </LockedFields>
        {/* One fused control: Save leads, Cancel rides its edge. A Delete
            belongs in the header's ⋯ menu, never here. */}
        {readOnly ? null : (
          <FormBar error={error} align={page ? "end" : "fill"} className={page ? "-mx-5 px-5 sm:-mx-8 sm:px-8" : undefined}>
            <Button type="submit" size="lg" disabled={!canSave}>
              {pending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
              {pending ? t(pendingLabel) : t(submitLabel)}
            </Button>
            {cancel ? (
              <Button
                type="button"
                size="lg"
                variant="ghost"
                onClick={() => {
                  // Uncontrolled fields (the pill bars) live in the DOM, so
                  // dropping the edits has to reach them as well as the state.
                  // Only after the person agreed: with unsaved edits Cancel
                  // asks first, the same question as Esc and the X.
                  const discard = () => {
                    formRef.current?.reset();
                    setTouched(false);
                    cancel();
                  };
                  if (inDrawer) askThen(discard);
                  else if (touched) setLeaving(() => discard);
                  else discard();
                }}
                disabled={pending}
                className="bg-surface"
              >
                {t(cancelLabel)}
              </Button>
            ) : null}
          </FormBar>
        )}
      </form>
      <ConfirmDialog
        open={!!leaving}
        onClose={() => setLeaving(null)}
        onConfirm={() => {
          const go = leaving;
          setLeaving(null);
          go?.();
        }}
        title="Discard changes?"
        body="You have unsaved edits on this page. Leaving it will discard them."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        kicker="Before you leave"
        confirmIcon={Undo2}
      />
    </>
  );
}
