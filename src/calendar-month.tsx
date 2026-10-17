"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "./calendar-context";
import type { CalendarSlot } from "./calendar-grid";
import { byStart, isTimed, itemDays, type CalendarItem } from "./calendar-layout";
import { addDays, hhmm, isWeekend, monthGrid, officeClock, weekDays, type ClockSettings } from "./calendar-time";

/**
 * The items by the days they show on: a timed one on the day it starts, an
 * all-day one on every day it covers.
 */
export function itemsByDay(items: CalendarItem[], clock: ClockSettings): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  const put = (day: string, item: CalendarItem) => map.set(day, [...(map.get(day) ?? []), item]);
  for (const item of [...items].sort(byStart(clock))) {
    if (isTimed(item)) {
      put(officeClock(item.start, clock).day, item);
      continue;
    }
    const { first, last } = itemDays(item, clock);
    for (let day = first; day <= last; day = addDays(day, 1)) put(day, item);
  }
  return map;
}

/** The month: six weeks of days, each with its first items and how many more. */
export function MonthGrid({ date, today, items, canAdd, onSlot }: { date: string; today: string; items: CalendarItem[]; canAdd: boolean; onSlot: (slot: CalendarSlot) => void }) {
  const { t, w, say, clock, href, colourOf, warned, kindIcon, onOpen } = useCalendar();
  const days = monthGrid(date, clock);
  const month = date.slice(0, 7);
  const list = useMemo(() => itemsByDay(items, clock), [items, clock]);
  return (
    <div className="cal-card">
      <div className="cal-month-heads">
        {days.slice(0, 7).map((d) => (
          <span key={d}>{say.weekday(d, true)}</span>
        ))}
      </div>
      <div className="cal-month">
        {days.map((day) => {
          const own = list.get(day) ?? [];
          return (
            <div
              key={day}
              className="cal-month-day"
              data-out={!day.startsWith(month) || undefined}
              data-weekend={isWeekend(day, clock) || undefined}
              onClick={(e) => canAdd && e.target === e.currentTarget && onSlot({ day, from: 9 * 60 })}
            >
              <Link href={href("day", day)} scroll={false} className="cal-month-num" data-today={day === today || undefined}>
                {Number(day.slice(8))}
              </Link>
              {own.slice(0, 3).map((item) => {
                const Icon = kindIcon?.(item.kind);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="cal-chip"
                    data-status={item.status}
                    data-away={item.away || undefined}
                    data-warning={warned.get(item.id)?.[0]?.kind}
                    style={{ "--c": colourOf(item) } as React.CSSProperties}
                    onClick={() => onOpen(item)}
                  >
                    {Icon ? <Icon className="cal-kind-icon" strokeWidth={2.2} aria-hidden /> : <i />}
                    {isTimed(item) ? <span>{hhmm(officeClock(item.start, clock).minutes)}</span> : null} {item.title}
                  </button>
                );
              })}
              {own.length > 3 ? (
                <Link href={href("day", day)} scroll={false} className="cal-more">
                  {t(w.more, { n: own.length - 3 })}
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** How full a day is, for the year's shading: none, one, two, three or four, five and more. */
function level(count: number): number {
  return count >= 5 ? 4 : count >= 3 ? 3 : count;
}

/**
 * The year: twelve small months, each day shaded by how much it holds, so the
 * busy weeks show at a glance. Time off and cancelled items don't count. A
 * day opens the day; a month's name opens the month.
 */
export function YearGrid({ year, today, items }: { year: string; today: string; items: CalendarItem[] }) {
  const { t, w, say, clock, href } = useCalendar();
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    const busy = items.filter((i) => i.status !== "cancelled" && !i.away);
    for (const [day, list] of itemsByDay(busy, clock)) map.set(day, list.length);
    return map;
  }, [items, clock]);
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}-01`);
  const countText = (n: number) => (n === 1 ? t(w.countOne) : t(w.countMany, { n }));
  return (
    <div className="cal-card cal-year">
      <div className="cal-year-months">
        {months.map((first) => (
          <section key={first} className="cal-ym" aria-label={say.month(first)}>
            <Link href={href("month", first)} scroll={false} className="cal-ym-name">
              {say.month(first)}
            </Link>
            <div className="cal-ym-grid">
              {monthGrid(first, clock)
                .slice(0, 7)
                .map((d) => (
                  <span key={d} className="cal-ym-head">
                    {say.weekday(d, true).slice(0, 1)}
                  </span>
                ))}
              {monthGrid(first, clock).map((day) => {
                if (!day.startsWith(first.slice(0, 7))) return <span key={day} />;
                const count = counts.get(day) ?? 0;
                return (
                  <Link
                    key={day}
                    href={href("day", day)}
                    scroll={false}
                    className="cal-ym-day"
                    data-level={level(count) || undefined}
                    data-today={day === today || undefined}
                    data-weekend={isWeekend(day, clock) || undefined}
                    aria-label={t(w.dayCount, { date: say.long(day), count: count ? countText(count) : t(w.countNone) })}
                    title={count ? countText(count) : undefined}
                  >
                    {Number(day.slice(8))}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="cal-year-key" aria-hidden>
        {t(w.free)}
        {[0, 1, 2, 3, 4].map((l) => (
          <i key={l} data-level={l || undefined} />
        ))}
        {t(w.busy)}
      </div>
    </div>
  );
}

/** The phone's week: seven days in a strip, a dot under a day with something on it. */
export function WeekStrip({ date, today, items }: { date: string; today: string; items: CalendarItem[] }) {
  const { t, w, say, clock, href } = useCalendar();
  const busy = useMemo(() => new Set(itemsByDay(items, clock).keys()), [items, clock]);
  return (
    <div className="cal-strip">
      <Link href={href("day", addDays(date, -7))} scroll={false} aria-label={t(w.earlierWeek)} className="cal-strip-step">
        <ChevronLeft className="size-4" />
      </Link>
      {weekDays(date, clock).map((day) => (
        <Link key={day} href={href("day", day)} scroll={false} className="cal-strip-day" aria-current={day === date ? "date" : undefined} data-today={day === today || undefined}>
          <span>{say.weekday(day, true).slice(0, 1)}</span>
          <b>{Number(day.slice(8))}</b>
          <i data-on={busy.has(day) || undefined} />
        </Link>
      ))}
      <Link href={href("day", addDays(date, 7))} scroll={false} aria-label={t(w.laterWeek)} className="cal-strip-step">
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

/** The phone's month: the days as numbers, a dot for each colour booked that day. */
export function PhoneMonth({ date, today, items }: { date: string; today: string; items: CalendarItem[] }) {
  const { say, clock, href, colourOf } = useCalendar();
  const month = date.slice(0, 7);
  const days = monthGrid(date, clock);
  const dots = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const [day, list] of itemsByDay(items, clock)) map.set(day, [...new Set(list.map(colourOf))]);
    return map;
  }, [items, clock, colourOf]);
  return (
    <div className="cal-card p-3">
      <div className="cal-pm">
        {days.slice(0, 7).map((d) => (
          <span key={d} className="cal-pm-head">
            {say.weekday(d, true).slice(0, 1)}
          </span>
        ))}
        {days.map((day) => (
          <Link key={day} href={href("month", day)} scroll={false} className="cal-pm-day" data-out={!day.startsWith(month) || undefined} aria-current={day === date ? "date" : undefined} data-today={day === today || undefined}>
            <b>{Number(day.slice(8))}</b>
            <span>
              {(dots.get(day) ?? []).slice(0, 3).map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
