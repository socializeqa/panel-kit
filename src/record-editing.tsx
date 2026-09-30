"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Lock, Pencil } from "lucide-react";
import { CTRL_BTN } from "./classes";
import { cn } from "./cn";
import { Button } from "./fields";
import { usePanelT } from "./panel-provider";
import { FormBar } from "./record";

// A record opens read-only; the pencil seat in the drawer header (between ⋯
// and close) unlocks its form. The form reads useRecordEditing() to lock its
// fields and hide its Save bar (Damine, 23 Aug 2026: "use the shared component
// for header we made with the edit button").
interface RecordEditing {
  editing: boolean;
  setEditing: (on: boolean) => void;
  /** One-shot bounce for the view bar when the locked sheet is tapped —
   *  carried here so a DETACHED bar (ViewBar at the drawer's true foot) still
   *  bounces. */
  nudged: boolean;
  nudge: () => void;
  settle: () => void;
  /** What the view bar calls the record — Elite Touch's office says "file";
   *  a room names its own ("booking"). */
  noun: string;
}
const RecordEditingContext = createContext<RecordEditing>({
  editing: true,
  setEditing: () => {},
  nudged: false,
  nudge: () => {},
  settle: () => {},
  noun: "file",
});
export function useRecordEditing() {
  return useContext(RecordEditingContext);
}

/** Holds the editing flag for a record; wrap the form and its header publisher. */
export function RecordEditingProvider({
  initial = false,
  noun = "file",
  children,
}: {
  initial?: boolean;
  noun?: string;
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(initial);
  const [nudged, setNudged] = useState(false);
  return (
    <RecordEditingContext.Provider
      value={{
        editing,
        setEditing,
        nudged,
        nudge: () => setNudged(true),
        settle: () => setNudged(false),
        noun,
      }}
    >
      {children}
    </RecordEditingContext.Provider>
  );
}

// The seat only opens edit mode; leaving it is the form's job (Save or
// Cancel), so unsaved work is never dropped by a stray click up here.
export function EditSeat({ editing, onEdit }: { editing: boolean; onEdit: () => void }) {
  const t = usePanelT();
  return (
    <button
      type="button"
      onClick={onEdit}
      disabled={editing}
      aria-pressed={editing}
      aria-label={t("Edit")}
      title={editing ? t("Editing") : t("Edit")}
      className={cn(CTRL_BTN, editing && "relative z-[1] border-brand-deep bg-brand-soft text-brand-deep")}
    >
      <Pencil className="size-[16px]" strokeWidth={1.9} />
    </button>
  );
}

// The locked body of a record in view mode. A clear sheet sits over the fields
// so nothing underneath can be touched — not a text box, not a map drag, not a
// fold. The footer is ALWAYS there in view mode — "viewing — switch to edit"
// with its one button (Damine, 24 Aug 2026) — and a tap on the locked fields
// gives it a small bounce so the eye finds the way in. The sheet lifts and the
// Save bar rises in its place the moment editing starts.
export function LockedFields({
  children,
  className,
  bar = true,
}: {
  children: ReactNode;
  className?: string;
  /** false when the host seats a detached <ViewBar /> at the drawer's foot
   *  instead — when a card or a history log sits between fields and bar. */
  bar?: boolean;
}) {
  const { editing, nudge } = useRecordEditing();
  return (
    <>
      <div className={cn("relative", className)}>
        {children}
        {editing ? null : <div aria-hidden="true" onPointerDown={nudge} className="absolute inset-0 z-[3] cursor-not-allowed" />}
      </div>
      {bar ? <ViewBar /> : null}
    </>
  );
}

// The view-mode bar on its own, for hosts that seat it at the drawer's foot,
// past content LockedFields doesn't wrap. Renders nothing in edit mode.
export function ViewBar() {
  const t = usePanelT();
  const { editing, setEditing, nudged, settle, noun } = useRecordEditing();
  if (editing) return null;
  return (
    // display:contents so the bar keeps its sticky footing; the wrapper only
    // hears the bounce end and re-arms the next tap.
    <div className="contents" onAnimationEnd={settle}>
      <FormBar
        noteIcon={Lock}
        note={t("You're viewing this {noun} — switch to edit to change anything.", { noun: t(noun) })}
        className={nudged ? "animate-bar-nudge" : undefined}
      >
        <Button type="button" size="lg" onClick={() => setEditing(true)}>
          <Pencil size={14} strokeWidth={2} aria-hidden="true" />
          {t("Switch to edit")}
        </Button>
      </FormBar>
    </div>
  );
}
