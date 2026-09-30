"use client";

import { useRef, useState } from "react";
import { PenLine } from "lucide-react";
import { fieldBox } from "./classes";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";
import { SelectMenu, type SelectMenuOption } from "./select-menu";

// The sentinel the dropdown uses for "none of these — I'll type it". Never
// stored: the moment it's picked, the TYPED text becomes the value.
const OTHER = "__other__";

/**
 * What the box beside "Others" shows: what the office typed, character for
 * character, even when the text is also a word on the list ("Owner", or the
 * start of "Owner's representative"). Emptying the box for any listed word
 * made the next key start the word over, so "Owner's representative" was
 * saved as "'s representative". The one listed word the box leaves out is a
 * caller's stand-in that nobody typed (Elite Touch's people editor hands a
 * blank designation back as "Representative").
 */
export function othersBoxText(value: string, preset: boolean, typed: string): string {
  return !preset || typed === value ? value : "";
}

/**
 * A dropdown whose "Others" really means something (Elite Touch, 28 Jul
 * 2026). The listed options stay one tap away; picking "Others — type your
 * own" opens a text box, and what's typed IS the saved value — no second
 * column, no code word. A record that already carries its own word opens with
 * the box filled, because the value isn't on the list.
 *
 * Controlled: `value` is the final stored string (a slug or the typed text);
 * `name` renders a hidden input so a plain FormData post keeps working.
 */
export function OtherSelect({
  id,
  name,
  value,
  onChange,
  options,
  blank,
  otherLabel = "Others — type your own",
  placeholder = "Type it…",
  maxLength = 60,
  compact = false,
  className,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  /** Put a "not set" row first, wearing this label (e.g. "—"). */
  blank?: string;
  otherLabel?: string;
  placeholder?: string;
  maxLength?: number;
  /** Tighter paddings for a table row. */
  compact?: boolean;
  /** Extra classes on the box — a JoinedRow passes the edge rounding. */
  className?: string;
}) {
  const t = usePanelT();
  const preset = options.some((o) => o.value === value);
  // "Other mode" survives the box being emptied mid-edit — only choosing a
  // listed option leaves it.
  const [other, setOther] = useState(() => !!value && !preset);
  const mode = other || (!!value && !preset);
  // The box's own last text, so a typed word that is also on the list stays.
  const [typed, setTyped] = useState(() => (preset ? "" : value));
  const box = useRef<HTMLInputElement>(null);
  // Set when Others is picked, so the closing list hands the cursor to the
  // box. Left on the list, the next key jumped the pick to the first option
  // starting with that letter: "Caretaker" became "Consultant".
  const focusBox = useRef(false);

  const rows = [
    ...(blank !== undefined ? [{ value: "", label: blank }] : []),
    ...options,
    { value: OTHER, label: otherLabel, icon: PenLine },
  ];

  // Other mode splits the cell in two on the SAME line — the list (now
  // reading "Others") beside the box for the word, fused. Stacking the box
  // underneath broke every JoinedRow it sat in.
  return (
    <div className={cn("grid min-w-0", mode && "grid-cols-2")}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <SelectMenu
        id={id}
        size={compact ? "xs" : "md"}
        value={mode ? OTHER : value}
        onValueChange={(v) => {
          if (v === OTHER) {
            setOther(true);
            setTyped("");
            focusBox.current = true;
            onChange("");
          } else {
            setOther(false);
            onChange(v);
          }
        }}
        onCloseAutoFocus={(e) => {
          const toBox = focusBox.current;
          focusBox.current = false;
          if (!toBox || !box.current) return;
          e.preventDefault();
          box.current.focus();
        }}
        options={rows}
        className={cn(className, mode && "rounded-e-none")}
      />
      {mode ? (
        <input
          ref={box}
          type="text"
          value={othersBoxText(value, preset, typed)}
          onChange={(e) => {
            setTyped(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={t(placeholder)}
          maxLength={maxLength}
          aria-label={t(otherLabel)}
          className={cn(fieldBox(compact ? "xs" : "md"), className, "-ms-px rounded-s-none focus:relative focus:z-[1]")}
        />
      ) : null}
    </div>
  );
}
