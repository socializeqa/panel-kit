"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Search, type LucideIcon } from "lucide-react";
import type { ActionResult } from "./action-result";
import { initials } from "./initials";
import { usePanel } from "./panel-provider";
import { PillTabs } from "./pill-tabs";
import { useToast } from "./toast";
import { useSwipeTurn } from "./use-swipe-turn";
import { CalendarContext, useCalendar, type CalendarShared } from "./calendar-context";
import { TimeGrid, type CalendarSlot, type GridColumn } from "./calendar-grid";
import { isTimed, itemDays, warnings, warningsByItem, type CalendarItem, type CalendarMove, type CalendarPerson, type CalendarWarning } from "./calendar-layout";
import { Agenda, ListView } from "./calendar-list";
import { MonthGrid, PhoneMonth, WeekStrip, YearGrid } from "./calendar-month";
import { CalendarSide, SearchField, type KindToggle } from "./calendar-side";
import { addDays, addMonths, isWeekend, monthName, weekDays, type ClockSettings } from "./calendar-time";
import { awayFromToday, CALENDAR_VIEWS, calendarHref, PHONE_VIEWS, phoneView, stepDate, viewSpan, type CalendarView } from "./calendar-views";
import { CALENDAR_WORDS, dateWords, type CalendarWords } from "./calendar-words";

// One calendar for every panel: a toolbar, the side (search, a small month,
// the people, the kinds, the app's own seat) and the day, the week, the
// month, the year, the people side by side or the list. On a phone: the week
// as a strip of days over the day's items as cards, the month as dots, or
// the list. The items are the app's, of any kind (meetings, tasks, posts,
// time off); so is every write: the calendar reports a press, a slot and a
// move, and the app opens its drawer or saves.

const BRAND = "var(--brand)";
const NOTHING = () => {};

export interface CalendarProps {
  items: CalendarItem[];
  people: CalendarPerson[];
  view: CalendarView;
  date: string;
  /** Today and the minutes since midnight now, on the office's clock (read on the server, so the page renders once). */
  today: string;
  nowMinutes: number;
  /** The search in the address; with one, the list shows what it found. */
  query?: string;
  /** Where a view and a day live. By default `${basePath}?view=…&date=…&q=…`. */
  href?: (view: CalendarView, date: string, q?: string) => string;
  basePath?: string;
  /** The kinds, in the order the side lists them, with their names. A kind not listed shows under its own key. */
  kinds?: { kind: string; label: string }[];
  /** A kind's icon, beside its items' titles and in the side's list. */
  kindIcon?: (kind: string) => LucideIcon | null | undefined;
  /** A press on an item. */
  onOpen?: (item: CalendarItem) => void;
  /** A press or a stroke on an empty stretch: book something there. */
  onSlot?: (slot: CalendarSlot) => void;
  /**
   * A drag let go. The calendar moves the item at once and calls this; a
   * result that isn't ok puts it back and says why. A message is shown on
   * success, else the calendar says where it went. Then the page refreshes.
   */
  onMove?: (item: CalendarItem, move: CalendarMove) => Promise<ActionResult | void> | ActionResult | void;
  permissions?: { canAdd?: boolean; canEdit?: boolean };
  /** In the people view, may an item be dragged into another person's column (a hand-over)? */
  handOver?: boolean;
  /** The line over the grid naming what clashes in view. */
  strip?: boolean;
  /** The views a desk offers. */
  views?: CalendarView[];
  words?: Partial<CalendarWords>;
  /** The office's clock. The week starts where PanelProvider's `weekStartsOn` says unless this says otherwise. */
  clock?: ClockSettings;
  /** The app's seat at the foot of the side and under a phone's calendar: the phone link. */
  foot?: React.ReactNode;
  /** What the app draws beside the calendar: its drawers. */
  children?: React.ReactNode;
}

export function Calendar({
  items: given,
  people,
  view,
  date,
  today,
  nowMinutes,
  query = "",
  href: hrefProp,
  basePath = "/calendar",
  kinds: kindNames = [],
  kindIcon,
  onOpen = NOTHING,
  onSlot,
  onMove,
  permissions = {},
  handOver = false,
  strip = true,
  views = CALENDAR_VIEWS,
  words,
  clock: clockProp,
  foot,
  children,
}: CalendarProps) {
  const router = useRouter();
  const toast = useToast();
  const { t, weekStartsOn } = usePanel();
  const [, startTransition] = useTransition();
  const canAdd = Boolean(permissions.canAdd && onSlot);
  const canEdit = Boolean(permissions.canEdit && onMove);
  const q = query;

  const clock = useMemo<ClockSettings>(() => ({ weekStartsOn, ...clockProp }), [weekStartsOn, clockProp]);
  const w = useMemo<CalendarWords>(() => ({ ...CALENDAR_WORDS, ...words, views: { ...CALENDAR_WORDS.views, ...words?.views } }), [words]);
  const say = useMemo(() => dateWords(t, clock), [t, clock]);
  const href = useMemo(() => hrefProp ?? ((v: CalendarView, d: string, s?: string) => calendarHref(basePath, v, d, s)), [hrefProp, basePath]);

  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [hiddenKinds, setHiddenKinds] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(Boolean(q));
  // Items moved here ahead of the app, kept only while the app's list is the
  // one they were moved on: a fresh list replaces them.
  const [moved, setMoved] = useState<{ base: CalendarItem[]; map: Record<string, CalendarItem> }>({ base: given, map: {} });

  const items = useMemo(() => {
    const ahead = moved.base === given ? moved.map : {};
    return given.map((i) => ahead[i.id] ?? i);
  }, [given, moved]);
  const ofKind = useMemo(() => items.filter((i) => !hiddenKinds.has(i.kind)), [items, hiddenKinds]);
  const shown = useMemo(() => ofKind.filter((i) => !i.people.length || i.people.some((p) => !hidden.has(p))), [ofKind, hidden]);
  const warnList = useMemo(() => warnings(items, clock), [items, clock]);
  const warned = useMemo(() => warningsByItem(warnList), [warnList]);

  const colours = useMemo(() => new Map(people.map((p) => [p.id, p.colour || BRAND])), [people]);
  const names = useMemo(() => new Map(people.map((p) => [p.id, p.name])), [people]);
  const shared = useMemo<CalendarShared>(
    () => ({
      t,
      w,
      say,
      clock,
      href,
      colourOf: (item) => item.colour || colours.get(item.people[0] ?? "") || BRAND,
      personColour: (id) => colours.get(id) ?? BRAND,
      nameOf: (id) => names.get(id) ?? "",
      firstName: (id) => names.get(id)?.split(" ")[0] ?? "",
      warned,
      kindIcon,
      onOpen,
    }),
    [t, w, say, clock, href, colours, names, warned, kindIcon, onOpen],
  );

  const slot = useCallback((s: CalendarSlot) => canAdd && onSlot?.(s), [canAdd, onSlot]);

  const move = useCallback(
    (item: CalendarItem, m: CalendarMove) => {
      if (!onMove || !isTimed(item)) return;
      const base = given;
      const whose = m.fromPerson && m.toPerson ? [...new Set(item.people.map((p) => (p === m.fromPerson ? m.toPerson! : p)))] : item.people;
      const next: CalendarItem = { ...item, start: m.start, end: m.end, people: whose };
      setMoved((cur) => ({ base, map: { ...(cur.base === base ? cur.map : {}), [item.id]: next } }));
      startTransition(async () => {
        const result = await onMove(item, m);
        if (result && !result.ok) {
          setMoved((cur) => {
            const map = { ...cur.map };
            delete map[item.id];
            return { ...cur, map };
          });
          toast(result.error || t(w.moveFailed), "error");
          return;
        }
        const when = say.when(m.start);
        const message =
          (result && result.message) ||
          (m.toPerson ? t(w.handedOver, { name: names.get(m.toPerson)?.split(" ")[0] ?? t(w.someone), when }) : item.seriesId ? t(w.movedOne, { when }) : t(w.moved, { when }));
        toast(message, "success");
        router.refresh();
      });
    },
    [onMove, given, toast, t, w, say, names, router],
  );

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>) => (id: string) =>
    set((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const togglePerson = toggle(setHidden);
  const toggleKind = toggle(setHiddenKinds);

  // What the view shows, for the side's counts and the strip.
  const [first, last] = viewSpan(view, date, clock);
  const inView = useMemo(() => {
    const lastDay = addDays(last, -1);
    return items.filter((i) => {
      const span = itemDays(i, clock);
      return span.first <= lastDay && span.last >= first;
    });
  }, [items, first, last, clock]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of inView) if (!hiddenKinds.has(i.kind)) for (const p of i.people) map.set(p, (map.get(p) ?? 0) + 1);
    return map;
  }, [inView, hiddenKinds]);
  const kinds = useMemo<KindToggle[]>(() => {
    const present = [...new Set(items.map((i) => i.kind))];
    const order = [...kindNames.map((k) => k.kind).filter((k) => present.includes(k)), ...present.filter((k) => !kindNames.some((n) => n.kind === k))];
    return order.map((kind) => ({ kind, label: kindNames.find((n) => n.kind === kind)?.label ?? kind, count: inView.filter((i) => i.kind === kind).length }));
  }, [items, kindNames, inView]);

  // The time grid's columns: the week's days, the one day, or the people on the day.
  const columns = useMemo<GridColumn[]>(() => {
    if (view === "people") {
      return people
        .filter((p) => !hidden.has(p.id))
        .map((p) => ({
          key: p.id,
          day: date,
          person: p.id,
          today: date === today,
          weekend: isWeekend(date, clock),
          head: (
            <span className="cal-head-person" style={{ "--c": colours.get(p.id) } as React.CSSProperties}>
              <span className="cal-avatar">{initials(p.name)}</span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{p.name.split(" ")[0]}</span>
                {p.subtitle ? <span className="cal-head-sub truncate">{p.subtitle}</span> : null}
              </span>
            </span>
          ),
        }));
    }
    const days = view === "week" ? weekDays(date, clock) : [date];
    return days.map((day) => ({
      key: day,
      day,
      today: day === today,
      weekend: isWeekend(day, clock),
      head: (
        <>
          <span>{say.weekday(day, true)}</span>
          <b>{Number(day.slice(8))}</b>
        </>
      ),
    }));
  }, [view, date, today, people, hidden, clock, colours, say]);

  // On a phone a sideways swipe turns the day (the month, in month view);
  // the new one slides in from the side the thumb pulled it from.
  const [pane, setPane] = useState<HTMLDivElement | null>(null);
  const onPhone = phoneView(view);
  useSwipeTurn(pane, {
    page: `${onPhone}:${date}`,
    enabled: view !== "list" && !q,
    onTurn: (dir) => router.push(href(onPhone, onPhone === "month" ? addMonths(date, dir) : addDays(date, dir)), { scroll: false }),
  });

  const mid = addDays(weekDays(date, clock)[0], 3);
  const title = q
    ? t(w.searchTitle)
    : view === "day" || view === "people"
      ? say.long(date)
      : view === "year"
        ? date.slice(0, 4)
        : view === "week"
          ? `${t(monthName(mid))} ${mid.slice(0, 4)}`
          : `${t(monthName(date))} ${date.slice(0, 4)}`;
  const away = awayFromToday(view, date, today);
  const deskViews = views.filter((v) => CALENDAR_VIEWS.includes(v));

  // The warnings in view, one line for each: a clash is one line, not one per side.
  const stripLines = useMemo(() => {
    if (!strip || q || view === "year" || view === "list") return [];
    const seen = new Set<string>();
    const shownIds = new Set(inView.filter((i) => !hiddenKinds.has(i.kind)).map((i) => i.id));
    const byId = new Map(items.map((i) => [i.id, i]));
    const lines: { warning: CalendarWarning; item: CalendarItem }[] = [];
    for (const warning of warnList) {
      const item = byId.get(warning.itemId);
      if (!item || !shownIds.has(item.id) || hidden.has(warning.person)) continue;
      const key = warning.kind === "clash" ? [warning.itemId, warning.otherId].sort().join("|") + warning.person : `${warning.kind}|${warning.itemId}|${warning.person}`;
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push({ warning, item });
    }
    return lines;
  }, [strip, q, view, items, warnList, inView, hiddenKinds, hidden]);

  return (
    <CalendarContext.Provider value={shared}>
      <div className="cal grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_284px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            {q ? null : (
              <div className="flex items-center gap-1">
                <Link href={href(view, stepDate(view, date, -1))} scroll={false} aria-label={t(w.earlier)} className="cal-round">
                  <ChevronLeft className="size-[18px]" strokeWidth={2} />
                </Link>
                <Link href={href(view, stepDate(view, date, 1))} scroll={false} aria-label={t(w.later)} className="cal-round">
                  <ChevronRight className="size-[18px]" strokeWidth={2} />
                </Link>
              </div>
            )}
            <h2 className="min-w-0 truncate text-[20px] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
            {away && !q ? (
              <Link href={href(view, today)} scroll={false} className="cal-today">
                {t(w.today)}
              </Link>
            ) : null}
            <span className="flex-1" />
            <button
              type="button"
              aria-label={t(w.search)}
              aria-expanded={searching}
              className="cal-round lg:hidden"
              onClick={() => {
                if (searching && q) router.replace(href("week", date), { scroll: false });
                setSearching(!searching);
              }}
            >
              <Search className="size-[17px]" strokeWidth={2} />
            </button>
            <div className="hidden md:block">
              <PillTabs label={w.viewsLabel} active={view} tabs={deskViews.map((v) => ({ key: v, label: w.views[v], href: href(v, date) }))} />
            </div>
            <div className="md:hidden">
              <PillTabs label={w.viewsLabel} active={phoneView(view)} tabs={PHONE_VIEWS.map((v) => ({ key: v, label: w.views[v], href: href(v, date) }))} />
            </div>
          </div>

          {searching ? (
            <div className="lg:hidden">
              <SearchField q={q} date={date} back="week" autoFocus={!q} />
            </div>
          ) : null}

          {people.length > 1 ? (
            <div className="cal-people flex gap-2 overflow-x-auto pb-1 lg:hidden" role="group" aria-label={t(w.whoShows)}>
              {people.map((p) => (
                <button key={p.id} type="button" aria-pressed={!hidden.has(p.id)} onClick={() => togglePerson(p.id)} className="cal-person" style={{ "--c": colours.get(p.id) } as React.CSSProperties}>
                  <span className="cal-avatar">{initials(p.name)}</span>
                  {p.name.split(" ")[0]}
                </button>
              ))}
              {hidden.size ? (
                <button type="button" onClick={() => setHidden(new Set())} className="cal-today">
                  {t(w.showEveryone)}
                </button>
              ) : null}
            </div>
          ) : null}

          {stripLines.length ? <WarningsStrip lines={stripLines} /> : null}

          {/* The list is the same on a desk and a phone; every other view has a desk and a phone form. */}
          {view === "list" ? (
            <ListView items={shown} date={date} today={today} nowMinutes={nowMinutes} q={q} />
          ) : (
            <>
              <div className="hidden md:block">
                {view === "month" ? (
                  <MonthGrid date={date} today={today} items={shown} canAdd={canAdd} onSlot={slot} />
                ) : view === "year" ? (
                  <YearGrid year={date.slice(0, 4)} today={today} items={shown} />
                ) : view === "people" && !columns.length ? (
                  <div className="cal-empty">{t(w.pickSomeone)}</div>
                ) : (
                  <TimeGrid
                    key={view}
                    columns={columns}
                    across={view === "week" || (view === "people" && handOver)}
                    items={view === "people" ? ofKind : shown}
                    nowMinutes={nowMinutes}
                    canAdd={canAdd}
                    canEdit={canEdit}
                    onSlot={slot}
                    onMove={move}
                  />
                )}
              </div>
              <div ref={setPane} className="md:hidden">
                {onPhone === "month" ? <PhoneMonth date={date} today={today} items={shown} /> : <WeekStrip date={date} today={today} items={shown} />}
                <Agenda day={date} items={shown} />
              </div>
            </>
          )}

          {foot ? <div className="lg:hidden">{foot}</div> : null}
        </div>

        <div className="hidden lg:sticky lg:top-4 lg:block">
          <CalendarSide
            view={view}
            date={date}
            q={q}
            people={people}
            hidden={hidden}
            counts={counts}
            onToggle={togglePerson}
            onShowAll={() => setHidden(new Set())}
            kinds={kinds}
            hiddenKinds={hiddenKinds}
            onToggleKind={toggleKind}
            onShowAllKinds={() => setHiddenKinds(new Set())}
            foot={foot}
          />
        </div>

        {children}
      </div>
    </CalendarContext.Provider>
  );
}

/** The line over the grid: what clashes in view, each a way into the item. */
function WarningsStrip({ lines }: { lines: { warning: CalendarWarning; item: CalendarItem }[] }) {
  const { t, w, say, clock, firstName, onOpen } = useCalendar();
  const sayLine = ({ warning, item }: (typeof lines)[number]) => {
    const name = firstName(warning.person) || t(w.someone);
    const when = isTimed(item) ? say.when(item.start) : say.long(itemDays(item, clock).first);
    const key = warning.kind === "clash" ? w.stripClash : warning.kind === "drive" ? w.stripDrive : w.stripAway;
    return t(key, { name, title: item.title, when });
  };
  return (
    <div className="cal-warnings" role="status" aria-label={t(w.stripLabel)}>
      <AlertTriangle className="cal-warnings-icon" strokeWidth={2.2} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {lines.slice(0, 3).map((line) => (
          <button key={`${line.warning.kind}-${line.item.id}-${line.warning.person}`} type="button" className="cal-warnings-line" onClick={() => onOpen(line.item)}>
            {sayLine(line)}
          </button>
        ))}
        {lines.length > 3 ? <span className="cal-warnings-more">{t(w.stripMore, { n: lines.length - 3 })}</span> : null}
      </div>
    </div>
  );
}

export type { CalendarItem, CalendarMove, CalendarPerson, CalendarSlot, CalendarView };
