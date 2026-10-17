"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CalendarPanel, isoToDate } from "./date-field";
import { initials } from "./initials";
import { useCalendar } from "./calendar-context";
import type { CalendarPerson } from "./calendar-layout";
import type { CalendarView } from "./calendar-views";

/**
 * The search box. Typing searches, a moment after the last key, and shows
 * what it found in the list; emptied, it goes back to the calendar (`back`).
 * What a search reaches is the app's: the page reads `q` from the address.
 */
export function SearchField({ q, date, back, autoFocus }: { q: string; date: string; back: CalendarView; autoFocus?: boolean }) {
  const { t, w, href } = useCalendar();
  const router = useRouter();
  const [value, setValue] = useState(q);
  // A search closed from elsewhere (a day picked, a view changed) empties the box.
  const [seen, setSeen] = useState(q);
  if (q !== seen) {
    setSeen(q);
    if (!q) setValue("");
  }
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (next: string, wait: number) => {
    clearTimeout(timer.current);
    const term = next.trim();
    if (!term && !q) return;
    timer.current = setTimeout(() => router.replace(term ? href("list", date, term) : href(back, date), { scroll: false }), wait);
  };

  return (
    <div className="cal-search">
      <Search className="size-4 shrink-0 text-quiet" strokeWidth={2} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          go(e.target.value, 300);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") go(value, 0);
          if (e.key === "Escape" && value) {
            setValue("");
            go("", 0);
          }
        }}
        placeholder={t(w.search)}
        aria-label={t(w.search)}
        enterKeyHint="search"
        autoFocus={autoFocus}
      />
      {value ? (
        <button
          type="button"
          aria-label={t(w.clearSearch)}
          className="cal-search-clear"
          onClick={() => {
            setValue("");
            go("", 0);
          }}
        >
          <X className="size-3.5" strokeWidth={2.4} />
        </button>
      ) : null}
    </div>
  );
}

/** Whose items show: a row per person, their colour in the circle, how many they have in view; off, it goes quiet. */
export function PeopleToggles({
  people,
  hidden,
  counts,
  onToggle,
  onShowAll,
}: {
  people: CalendarPerson[];
  hidden: Set<string>;
  counts: Map<string, number>;
  onToggle: (id: string) => void;
  onShowAll: () => void;
}) {
  const { t, w, personColour } = useCalendar();
  return (
    <div className="flex flex-col gap-1" role="group" aria-label={t(w.whoShows)}>
      <div className="flex h-7 items-center justify-between px-2">
        <p className="text-[12px] font-semibold text-quiet">{t(w.people)}</p>
        {hidden.size ? (
          <button type="button" onClick={onShowAll} className="text-[12px] font-semibold text-brand-deep">
            {t(w.showEveryone)}
          </button>
        ) : null}
      </div>
      {people.map((p) => (
        <button key={p.id} type="button" aria-pressed={!hidden.has(p.id)} onClick={() => onToggle(p.id)} className="cal-side-person" style={{ "--c": personColour(p.id) } as React.CSSProperties}>
          <span className="cal-avatar">{initials(p.name)}</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">{p.name}</span>
            {p.subtitle ? <span className="cal-side-sub truncate">{p.subtitle}</span> : null}
          </span>
          {counts.get(p.id) ? <span className="cal-count">{counts.get(p.id)}</span> : null}
        </button>
      ))}
    </div>
  );
}

export type KindToggle = { kind: string; label: string; count: number };

/** What shows: a row per kind of item, its icon and how many are in view; off, those items hide. */
export function KindToggles({ kinds, hidden, onToggle, onShowAll }: { kinds: KindToggle[]; hidden: Set<string>; onToggle: (kind: string) => void; onShowAll: () => void }) {
  const { t, w, kindIcon } = useCalendar();
  return (
    <div className="flex flex-col gap-1" role="group" aria-label={t(w.kinds)}>
      <div className="flex h-7 items-center justify-between px-2">
        <p className="text-[12px] font-semibold text-quiet">{t(w.kinds)}</p>
        {hidden.size ? (
          <button type="button" onClick={onShowAll} className="text-[12px] font-semibold text-brand-deep">
            {t(w.showAll)}
          </button>
        ) : null}
      </div>
      {kinds.map((k) => {
        const Icon = kindIcon?.(k.kind);
        return (
          <button key={k.kind} type="button" aria-pressed={!hidden.has(k.kind)} onClick={() => onToggle(k.kind)} className="cal-side-kind">
            <span className="cal-side-kind-icon">{Icon ? <Icon className="size-4" strokeWidth={2} aria-hidden /> : null}</span>
            <span className="min-w-0 flex-1 truncate">{t(k.label)}</span>
            {k.count ? <span className="cal-count">{k.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The calendar's side on a desk: the search, a small month to jump to any day,
 * the people, the kinds, and the app's own seat at the foot (the phone link).
 */
export function CalendarSide({
  view,
  date,
  q,
  people,
  hidden,
  counts,
  onToggle,
  onShowAll,
  kinds,
  hiddenKinds,
  onToggleKind,
  onShowAllKinds,
  foot,
}: {
  view: CalendarView;
  date: string;
  q: string;
  people: CalendarPerson[];
  hidden: Set<string>;
  counts: Map<string, number>;
  onToggle: (id: string) => void;
  onShowAll: () => void;
  kinds: KindToggle[];
  hiddenKinds: Set<string>;
  onToggleKind: (kind: string) => void;
  onShowAllKinds: () => void;
  foot?: React.ReactNode;
}) {
  const { href } = useCalendar();
  const router = useRouter();
  return (
    <aside className="cal-side">
      <SearchField q={q} date={date} back="week" />
      <div className="cal-card cal-mini">
        <CalendarPanel key={date.slice(0, 7)} selected={isoToDate(date)} clearable={false} onSelect={(day) => router.push(href(view === "year" ? "day" : view, day), { scroll: false })} />
      </div>
      {people.length > 1 ? <PeopleToggles people={people} hidden={hidden} counts={counts} onToggle={onToggle} onShowAll={onShowAll} /> : null}
      {kinds.length > 1 ? <KindToggles kinds={kinds} hidden={hiddenKinds} onToggle={onToggleKind} onShowAll={onShowAllKinds} /> : null}
      {foot}
    </aside>
  );
}
