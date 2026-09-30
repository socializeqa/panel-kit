"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Clock, X } from "lucide-react";
import { fieldBox, iconBtnClass, POPOVER_SHELL } from "./classes";
import { cn } from "./cn";
import { useMarkDrawerDirty } from "./drawer";
import { formatTime } from "./format";
import { usePanelT } from "./panel-provider";

// What a person might type for a time: 9 · 930 · 9:30 · 9.30 · 9 30 · 1430 ·
// 14:30 · 2pm · 2:30pm · 9:30 am. An hour alone means o'clock; a bare hour 1–6
// with no am/pm is read as afternoon (nobody books a 2 o'clock visit at
// night). Returns "HH:MM" or null.
export function parseTypedTime(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;
  const m = /^(\d{1,2})(?:[:. ]?(\d{2}))?\s*(am|pm|a|p)?$/.exec(s);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ap = m[3]?.[0];
  if (min > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    if (ap === "p" && h < 12) h += 12;
    if (ap === "a" && h === 12) h = 0;
  } else {
    if (h > 23) return null;
    if (!m[2] && h >= 1 && h <= 6) h += 12;
  }
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** "HH:MM" → "9:30 AM" — the panel's one clock (format.ts). */
export function formatTime12(hhmm: string): string {
  return /^\d{2}:\d{2}$/.test(hhmm) ? formatTime(hhmm) : "";
}

// The quarter hours the clock offers, from `from` o'clock to `to` o'clock. An
// office works 6 AM – 10 PM; a bar's evening runs past midnight, so the window
// may wrap (from 12 to 2 = noon through 2 AM). Typing takes any time.
export function quarterHours(from: number, to: number): string[] {
  const span = (to - from + 24) % 24 || 24;
  const times: string[] = [];
  for (let i = 0; i <= span * 4; i++) {
    const h = (from + Math.floor(i / 4)) % 24;
    const m = (i % 4) * 15;
    times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return times;
}
const OFFICE_HOURS = { from: 6, to: 22 };

// The panel's time field: type it ("930", "2pm", "14:30") or pick a quarter
// hour from the clock. Values are "HH:MM" (24h) — what the server and the
// database speak — shown as "9:30 AM" at rest. Posts under `name` through a
// hidden input; controlled or not.
export function TimeField({
  id,
  name,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "hh:mm",
  disabled,
  hours = OFFICE_HOURS,
  className,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (hhmm: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** The clock's window, in whole hours; it may wrap past midnight. */
  hours?: { from: number; to: number };
  className?: string;
}) {
  const t = usePanelT();
  const [inner, setInner] = useState(defaultValue);
  const hhmm = value ?? inner;
  const times = quarterHours(hours.from, hours.to);
  const markDirty = useMarkDrawerDirty();
  const set = (next: string) => {
    markDirty();
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  const [draft, setDraft] = useState<string | null>(null);
  const draftBad = draft !== null && draft.trim() !== "" && parseTypedTime(draft) === null;
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {name ? <input type="hidden" name={name} value={hhmm} /> : null}
      <Popover.Anchor asChild>
        <div
          className={cn(
            fieldBox("md"),
            "flex items-center gap-2 p-0 focus-within:border-brand-deep focus-within:ring-1 focus-within:ring-brand-deep/30",
            open && "border-brand-deep ring-1 ring-brand-deep/30",
            draftBad && "border-danger/60 focus-within:border-danger/60 focus-within:ring-danger/20",
            className,
          )}
        >
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            value={draft ?? (hhmm ? formatTime12(hhmm) : "")}
            placeholder={t(placeholder)}
            onFocus={() => setDraft(hhmm)}
            onChange={(e) => {
              const v = e.target.value;
              setDraft(v);
              const parsed = parseTypedTime(v);
              if (parsed) set(parsed);
            }}
            onBlur={() => {
              if (draft !== null && draft.trim() === "") set("");
              setDraft(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
              if (e.key === "ArrowDown" && !open) setOpen(true);
            }}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[14px] text-ink outline-none placeholder:text-ink/35"
          />
          {hhmm && !disabled ? (
            <button
              type="button"
              aria-label={t("Clear time")}
              onClick={() => set("")}
              className={cn(iconBtnClass(7, "ink"), "size-6 shrink-0 text-ink/35")}
            >
              <X size={13} strokeWidth={2.2} aria-hidden="true" />
            </button>
          ) : null}
          <Popover.Trigger
            type="button"
            disabled={disabled}
            aria-label={t("Pick a time")}
            className={cn(iconBtnClass(7), "me-1.5 shrink-0 data-[state=open]:bg-brand-soft data-[state=open]:text-brand-deep")}
          >
            <Clock size={16} strokeWidth={1.9} aria-hidden="true" />
          </Popover.Trigger>
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            // Open on the time already chosen, not on the top of the clock.
            (e.currentTarget as HTMLElement).querySelector("[data-selected]")?.scrollIntoView({ block: "center" });
          }}
          className={cn(POPOVER_SHELL, "max-h-72 w-40 overflow-y-auto p-1")}
        >
          {times.map((time) => (
            <button
              key={time}
              type="button"
              data-selected={time === hhmm ? "" : undefined}
              onClick={() => {
                set(time);
                setOpen(false);
              }}
              className={cn(
                "block w-full rounded-md px-2.5 py-1.5 text-start text-[13px] text-ink transition-colors hover:bg-brand-soft hover:text-brand-deep",
                time === hhmm && "bg-brand-soft font-medium text-brand-deep",
              )}
            >
              {formatTime12(time)}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
