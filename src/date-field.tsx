"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { fieldBox, iconBtnClass, POPOVER_SHELL } from "./classes";
import { cn } from "./cn";
import { useMarkDrawerDirty } from "./drawer";
import { PillButton } from "./fields";
import { todayIso } from "./format";
import { usePanel } from "./panel-provider";

// "YYYY-MM-DD" ↔ a local-midnight Date. The form and the server speak ISO day
// strings; the calendar speaks Dates. Going through local parts (never
// Date.parse) keeps a day a day — no timezone can shift it to the evening
// before.
export function isoToDate(iso: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : undefined;
}
function dateToIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
const MONTH_INDEX = new Map(MONTHS.map((m, i) => [m.slice(0, 3).toLowerCase(), i]));

// What a person might type for a day, in the order the office writes them:
// 25/08/2026 · 25/8 · 25-08-2026 · 25.08.26 · 25 aug · 25 aug 2026 · aug 25 ·
// 2026-08-25 · 25082026. A missing year means this year.
export function parseTypedDate(raw: string, today: string): string | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  const year = Number(today.slice(0, 4));
  const build = (y: number, m: number, d: number): string | null => {
    if (y < 100) y += 2000;
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return isoToDate(iso) ? iso : null;
  };
  let m: RegExpExecArray | null;
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) return build(+m[1]!, +m[2]!, +m[3]!);
  if ((m = /^(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2,4}))?$/.exec(s))) return build(m[3] ? +m[3] : year, +m[2]!, +m[1]!);
  if ((m = /^(\d{2})(\d{2})(\d{4})$/.exec(s))) return build(+m[3]!, +m[2]!, +m[1]!);
  if ((m = /^(\d{1,2})\s*([a-z]{3,})\.?(?:\s*,?\s*(\d{2,4}))?$/.exec(s))) {
    const mi = MONTH_INDEX.get(m[2]!.slice(0, 3));
    return mi === undefined ? null : build(m[3] ? +m[3] : year, mi + 1, +m[1]!);
  }
  if ((m = /^([a-z]{3,})\.?\s*(\d{1,2})(?:\s*,?\s*(\d{2,4}))?$/.exec(s))) {
    const mi = MONTH_INDEX.get(m[1]!.slice(0, 3));
    return mi === undefined ? null : build(m[3] ? +m[3] : year, mi + 1, +m[2]!);
  }
  return null;
}

const LONG = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
/** "Tue, 25 Aug 2026" for an ISO day — the way a day reads anywhere in the panel. */
export const longDay = (iso: string): string => {
  const d = isoToDate(iso);
  return d ? LONG.format(d) : "";
};

// Slashes appear as you type: 2 → "2", 25 → "25/", 2508 → "25/08/", then the
// year. Only while adding characters and only for digits, so a backspace or a
// typed "25 aug" is left alone.
export function maskTypedDate(next: string, prev: string): string {
  if (next.length <= prev.length || !/^[\d/]*$/.test(next)) return next;
  const d = next.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d.length === 2 ? `${d}/` : d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}${d.length === 4 ? "/" : ""}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

const SHORT = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** Which days are closed — marked, not blocked. A room brings its own rule
 *  (Elite Touch reads its office calendar, Señorritas its closing days). */
export type ClosedDay = (iso: string) => boolean;

// The panel's date field: the same box as every Input, typed into or picked
// from our own calendar. Typing accepts the ways the office writes a day (see
// parseTypedDate) and the box reads "Tue, 25 Aug 2026" once it rests. Posts
// the ISO day under `name` through a hidden input; controlled or not.
export function DateField({
  id,
  name,
  value,
  defaultValue = "",
  onChange,
  min,
  max,
  closed,
  placeholder = "dd/mm/yyyy",
  disabled,
  picker = true,
  size = "md",
  className,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (iso: string) => void;
  /** ISO day bounds, inclusive. */
  min?: string;
  max?: string;
  closed?: ClosedDay;
  placeholder?: string;
  disabled?: boolean;
  /** false = typed entry only, no calendar button (one already sits inline). */
  picker?: boolean;
  /** compact = the fixed-height row cell (a payment schedule, a line grid). */
  size?: "md" | "compact";
  /** Extra classes on the box — a JoinedRow passes the edge rounding. */
  className?: string;
}) {
  const { t, timeZone } = usePanel();
  const [inner, setInner] = useState(defaultValue);
  const iso = value ?? inner;
  const markDirty = useMarkDrawerDirty();
  const set = (next: string) => {
    markDirty();
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const today = todayIso(timeZone);
  const selected = isoToDate(iso);
  const inBounds = (d: string) => (!min || d >= min) && (!max || d <= max);

  // Typing: a draft lives only while the box has focus. Each keystroke that
  // parses to a day inside the window commits it; an unparsable draft shows
  // in the danger tone and is dropped on blur; an emptied box clears the day.
  const [draft, setDraft] = useState<string | null>(null);
  const draftIso = draft === null ? null : parseTypedDate(draft, today);
  const draftBad = draft !== null && draft.trim() !== "" && (draftIso === null || !inBounds(draftIso));
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {name ? <input type="hidden" name={name} value={iso} /> : null}
      <Popover.Anchor asChild>
        <div
          className={cn(
            fieldBox(size),
            "flex items-center gap-2 p-0 focus-within:border-brand-deep focus-within:ring-1 focus-within:ring-brand-deep/30",
            size === "compact" && "h-9",
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
            value={draft ?? (selected ? LONG.format(selected) : "")}
            placeholder={t(placeholder)}
            onFocus={() => setDraft(iso ? SHORT(iso) : "")}
            onChange={(e) => {
              const v = maskTypedDate(e.target.value, draft ?? "");
              setDraft(v);
              const parsed = parseTypedDate(v, today);
              if (parsed && inBounds(parsed)) set(parsed);
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
              if (e.key === "ArrowDown" && picker && !open) setOpen(true);
            }}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink/35",
              size === "compact" ? "px-2.5 py-0 text-[13px]" : "px-3 py-2 text-[14px]",
            )}
          />
          {selected && !disabled ? (
            <button
              type="button"
              aria-label={t("Clear date")}
              onClick={() => set("")}
              className={cn(iconBtnClass(7, "ink"), "size-6 shrink-0 text-ink/35")}
            >
              <X size={13} strokeWidth={2.2} aria-hidden="true" />
            </button>
          ) : null}
          {picker ? (
            <Popover.Trigger
              type="button"
              disabled={disabled}
              aria-label={t("Open calendar")}
              className={cn(
                iconBtnClass(7),
                "me-1.5 shrink-0 data-[state=open]:bg-brand-soft data-[state=open]:text-brand-deep",
              )}
            >
              <CalendarDays size={16} strokeWidth={1.9} aria-hidden="true" />
            </Popover.Trigger>
          ) : (
            <span className="me-3 shrink-0 text-ink/45">
              <CalendarDays size={16} strokeWidth={1.9} aria-hidden="true" />
            </span>
          )}
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(POPOVER_SHELL, "w-[296px] p-3")}
        >
          <CalendarPanel
            selected={selected}
            onSelect={set}
            onDone={() => setOpen(false)}
            min={min}
            max={max}
            closed={closed}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// A picked day, a picked month and a day in a plan wear the one fill the
// house allows in a calendar: the brand, with its own ink.
const PICKED =
  "[&>button]:bg-brand [&>button]:text-brand-ink [&>button]:font-semibold [&>button]:shadow-kit-tile [&>button]:hover:bg-[color-mix(in_oklab,var(--brand)_88%,black)] [&>button]:hover:text-brand-ink";

// The calendar itself — caption row, day grid or month grid, footer. Small in
// DateField's popover; a form can lay it out `large` and inline (a schedule
// card) with nothing else changing. Tap the month name to jump by year and
// month. Days outside `min`…`max` can't be picked; closed days stay pickable
// but wear a warn mark, because an office may book on one and ask first.
export function CalendarPanel({
  selected,
  onSelect,
  onDone,
  min,
  max,
  closed,
  large = false,
  marked,
}: {
  selected: Date | undefined;
  onSelect: (iso: string) => void;
  /** After a day is picked or Today pressed — a popover closes on it. */
  onDone?: () => void;
  min?: string;
  max?: string;
  closed?: ClosedDay;
  large?: boolean;
  /** Days that belong to a plan (ISO) — filled; a tap toggles them. For a
   *  schedule editor where the calendar IS the plan. */
  marked?: Set<string>;
}) {
  const { t, timeZone } = usePanel();
  const today = todayIso(timeZone);
  const minDate = min ? isoToDate(min) : undefined;
  const maxDate = max ? isoToDate(max) : undefined;
  const inBounds = (d: string) => (!min || d >= min) && (!max || d <= max);
  const isClosed = (d: Date) => !!closed && closed(dateToIso(d));
  const isMarked = (d: Date) => !!marked && marked.has(dateToIso(d));
  const [view, setView] = useState<"days" | "months">("days");
  const [month, setMonth] = useState<Date>(() => selected ?? isoToDate(today) ?? new Date());
  const minYear = minDate ? minDate.getFullYear() : month.getFullYear() - 10;
  const maxYear = maxDate ? maxDate.getFullYear() : month.getFullYear() + 10;
  const monthAllowed = (y: number, mi: number) => {
    const first = `${y}-${String(mi + 1).padStart(2, "0")}-01`;
    const last = dateToIso(new Date(y, mi + 1, 0));
    return (!min || last >= min) && (!max || first <= max);
  };
  // Large = inline in a card that is a flex column: the grid takes the
  // column's spare height and the rows share it, so the calendar fits its
  // rectangle instead of floating in it.
  const cell = large ? "h-full min-h-[38px] w-full text-[13px]" : "size-9 text-[13px]";

  return (
    <>
      {/* The caption row: the arrows step a month (a year in the month view),
          the name in the middle flips between the two views. */}
      <div className="flex h-8 items-center justify-between">
        <NavButton
          label={view === "days" ? t("Previous month") : t("Previous year")}
          disabled={
            view === "days"
              ? !!minDate && month <= new Date(minDate.getFullYear(), minDate.getMonth(), 1)
              : month.getFullYear() <= minYear
          }
          onClick={() =>
            setMonth((m) =>
              view === "days"
                ? new Date(m.getFullYear(), m.getMonth() - 1, 1)
                : new Date(m.getFullYear() - 1, m.getMonth(), 1),
            )
          }
        >
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" className="rtl:-scale-x-100" />
        </NavButton>
        <button
          type="button"
          onClick={() => setView((v) => (v === "days" ? "months" : "days"))}
          aria-expanded={view === "months"}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-semibold text-ink transition-colors hover:bg-brand-soft hover:text-brand-deep"
        >
          {view === "days" ? `${t(MONTHS[month.getMonth()] ?? "")} ${month.getFullYear()}` : month.getFullYear()}
          <ChevronDown
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className={cn("text-quiet transition-transform", view === "months" && "rotate-180")}
          />
        </button>
        <NavButton
          label={view === "days" ? t("Next month") : t("Next year")}
          disabled={
            view === "days"
              ? !!maxDate && month >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
              : month.getFullYear() >= maxYear
          }
          onClick={() =>
            setMonth((m) =>
              view === "days"
                ? new Date(m.getFullYear(), m.getMonth() + 1, 1)
                : new Date(m.getFullYear() + 1, m.getMonth(), 1),
            )
          }
        >
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" className="rtl:-scale-x-100" />
        </NavButton>
      </div>

      {view === "months" ? (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {MONTHS.map((name, mi) => {
            const y = month.getFullYear();
            const current = selected && selected.getFullYear() === y && selected.getMonth() === mi;
            const thisMonth = today.startsWith(`${y}-${String(mi + 1).padStart(2, "0")}`);
            return (
              <button
                key={name}
                type="button"
                disabled={!monthAllowed(y, mi)}
                onClick={() => {
                  setMonth(new Date(y, mi, 1));
                  setView("days");
                }}
                className={cn(
                  large ? "h-12" : "h-10",
                  "rounded-lg text-[13px] font-medium text-ink/80 transition-colors hover:bg-brand-soft hover:text-brand-deep disabled:cursor-not-allowed disabled:text-ink/25 disabled:hover:bg-transparent",
                  thisMonth && "text-brand-deep",
                  current && "bg-brand text-brand-ink hover:bg-[color-mix(in_oklab,var(--brand)_88%,black)] hover:text-brand-ink",
                )}
              >
                {t(name.slice(0, 3))}
              </button>
            );
          })}
        </div>
      ) : (
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={(d) => {
            onSelect(d ? dateToIso(d) : "");
            if (d) onDone?.();
          }}
          month={month}
          onMonthChange={setMonth}
          startMonth={minDate}
          endMonth={maxDate}
          hideNavigation
          disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
          modifiers={{ closed: isClosed, marked: isMarked }}
          modifiersClassNames={{
            closed:
              "[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-warn [&>button]:after:content-['']",
            marked: cn(PICKED, "[&>button]:after:bg-brand-ink/80"),
          }}
          weekStartsOn={6}
          showOutsideDays
          fixedWeeks
          classNames={{
            root: cn("select-none", large && "flex min-h-0 flex-1 flex-col"),
            months: cn(large && "flex min-h-0 flex-1 flex-col"),
            month: cn(large && "flex min-h-0 flex-1 flex-col"),
            month_caption: "hidden",
            month_grid: cn("mt-1 w-full table-fixed border-separate border-spacing-0.5", large && "h-full"),
            week: cn(large && "h-full"),
            weekday: cn("text-center text-[11px] font-medium text-quiet", large ? "h-7" : "h-8"),
            day: "p-0 text-center",
            day_button: cn(
              "relative mx-auto grid place-items-center rounded-lg text-ink/85 transition-colors hover:bg-brand-soft hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep/40",
              cell,
            ),
            today: "[&>button]:font-semibold [&>button]:text-brand-deep",
            selected: PICKED,
            outside: "[&>button]:text-ink/25",
            disabled: "[&>button]:cursor-not-allowed [&>button]:text-ink/20 [&>button]:hover:bg-transparent",
            hidden: "invisible",
          }}
        />
      )}

      <div className="mt-2 flex items-center justify-between gap-3 border-t border-ink/[0.07] pt-2.5">
        {/* The legend names the mark only where a room marks closed days. */}
        {closed ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-quiet">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-warn" />
            {t("Closed day")}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1.5">
          <PillButton
            disabled={!inBounds(today)}
            onClick={() => {
              onSelect(today);
              onDone?.();
            }}
          >
            {t("Today")}
          </PillButton>
          {selected ? <PillButton onClick={() => onSelect("")}>{t("Clear")}</PillButton> : null}
        </div>
      </div>
    </>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(iconBtnClass(8, "ink"), "disabled:opacity-30 disabled:hover:bg-transparent")}
    >
      {children}
    </button>
  );
}
