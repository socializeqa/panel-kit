"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Car, MapPin, Repeat } from "lucide-react";
import { initials } from "./initials";
import { useCalendar } from "./calendar-context";
import { byStart, isOn, isTimed, itemDays, type CalendarItem, type CalendarWarning } from "./calendar-layout";
import { addDays, hhmm, officeClock, officeMoment } from "./calendar-time";

/** A warning as a card says it. */
function useWarningText() {
  const { t, w, firstName } = useCalendar();
  return (warning: CalendarWarning) => {
    const name = firstName(warning.person) || t(w.someone);
    if (warning.kind === "clash") return t(w.clash, { name });
    if (warning.kind === "away") return t(w.awayThen, { name });
    return t(w.noDrive);
  };
}

/** An item as a card: its times, its name and place, what it warns about and who is in it. */
export function ItemCard({ item }: { item: CalendarItem }) {
  const { t, w, clock, colourOf, personColour, nameOf, warned, kindIcon, onOpen } = useCalendar();
  const sayWarning = useWarningText();
  const start = isTimed(item) ? officeClock(item.start, clock).minutes : 0;
  const end = isTimed(item) ? officeClock(item.end, clock).minutes : 0;
  const warning = warned.get(item.id)?.[0];
  const travel = item.travelMinutes ?? 0;
  const Icon = kindIcon?.(item.kind);
  const place = [item.location, item.subtitle].filter(Boolean).join(" · ");
  return (
    <div>
      {travel > 0 && isTimed(item) ? (
        <p className="cal-agenda-travel">
          <Car className="size-3.5" strokeWidth={2} /> {t(w.leaveBy, { time: hhmm(Math.max(0, start - travel)), n: travel })}
        </p>
      ) : null}
      <button type="button" className="cal-agenda" data-status={item.status} data-away={item.away || undefined} style={{ "--c": colourOf(item) } as React.CSSProperties} onClick={() => onOpen(item)}>
        <span className="cal-agenda-time">
          {isTimed(item) ? (
            <>
              <b>{hhmm(start)}</b>
              <span>{hhmm(end)}</span>
            </>
          ) : (
            <b>{t(item.away ? w.away : w.allDay)}</b>
          )}
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="flex items-center gap-1.5 truncate text-[15px] font-semibold text-ink">
            {Icon ? <Icon className="size-3.5 shrink-0 text-quiet" strokeWidth={2.2} aria-hidden /> : null}
            {item.seriesId ? <Repeat className="size-3.5 shrink-0 text-quiet" strokeWidth={2.2} aria-label={t(w.repeats)} /> : null}
            <span className="truncate">{item.title}</span>
          </span>
          {place ? (
            <span className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-quiet">
              {item.location ? <MapPin className="size-3.5 shrink-0" strokeWidth={2} /> : null}
              <span className="truncate">{place}</span>
            </span>
          ) : null}
          {warning ? (
            <span className="mt-1 flex items-center gap-1 text-[12px] font-medium text-warn">
              <AlertTriangle className="size-3.5" strokeWidth={2.2} />
              {sayWarning(warning)}
            </span>
          ) : null}
        </span>
        <span className="flex -space-x-1.5">
          {item.people.slice(0, 3).map((p) => (
            <span key={p} className="cal-avatar cal-avatar-sm" style={{ "--c": personColour(p) } as React.CSSProperties}>
              {initials(nameOf(p) || "?")}
            </span>
          ))}
        </span>
      </button>
    </div>
  );
}

/** One day's items as cards, in order: the phone's calendar. */
export function Agenda({ day, items }: { day: string; items: CalendarItem[] }) {
  const { t, w, say, clock } = useCalendar();
  const list = items.filter((i) => isOn(i, day, clock)).sort(byStart(clock));
  return (
    <div className="mt-4 flex flex-col gap-2.5">
      <p className="px-1 text-[13px] font-semibold text-quiet">{say.long(day)}</p>
      {list.length ? list.map((item) => <ItemCard key={item.id} item={item} />) : <div className="cal-empty">{t(w.freeDay)}</div>}
    </div>
  );
}

function DayGroups({ items, today, scrollToToday }: { items: CalendarItem[]; today: string; scrollToToday?: boolean }) {
  const { t, w, say, clock } = useCalendar();
  const todayRef = useRef<HTMLElement>(null);
  // A list reads each item once, on the day it starts.
  const groups = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const day = itemDays(item, clock).first;
    groups.set(day, [...(groups.get(day) ?? []), item]);
  }
  // The first day from today on, so the list opens where the office is.
  const anchor = scrollToToday ? [...groups.keys()].find((d) => d >= today) : undefined;
  useEffect(() => {
    if (anchor && anchor !== [...groups.keys()][0]) todayRef.current?.scrollIntoView({ block: "start" });
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const lead = (day: string) => (day === today ? w.today : day === addDays(today, 1) ? w.tomorrow : day === addDays(today, -1) ? w.yesterday : null);
  return (
    <div className="flex flex-col gap-6">
      {[...groups].map(([day, list]) => {
        const word = lead(day);
        return (
          <section key={day} ref={day === anchor ? todayRef : undefined} className="cal-list-day" data-past={day < today || undefined}>
            <h3 className="cal-list-head">
              {word ? <b>{t(word)}</b> : null}
              <span>{`${say.long(day)}${day.slice(0, 4) !== today.slice(0, 4) ? ` ${day.slice(0, 4)}` : ""}`}</span>
            </h3>
            <div className="flex flex-col gap-2.5">
              {list.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * The list: a month's items day by day, or what a search found, the ones
 * still to come first and the ones before after them.
 */
export function ListView({ items, date, today, nowMinutes, q }: { items: CalendarItem[]; date: string; today: string; nowMinutes: number; q: string }) {
  const { t, w, say, clock } = useCalendar();
  const sorted = [...items].sort(byStart(clock));
  if (q) {
    const now = officeMoment(today, nowMinutes, clock);
    const ended = (item: CalendarItem) => (isTimed(item) ? item.end < now : itemDays(item, clock).last < today);
    const ahead = sorted.filter((i) => !ended(i));
    const before = sorted.filter(ended).reverse();
    return (
      <div className="flex flex-col gap-8">
        <p className="text-[14px] text-quiet">{items.length ? t(items.length === 1 ? w.foundOne : w.found, { n: items.length, q }) : t(w.notFound, { q })}</p>
        {ahead.length ? (
          <div className="flex flex-col gap-3">
            <h2 className="cal-list-section">{t(w.comingUp)}</h2>
            <DayGroups items={ahead} today={today} />
          </div>
        ) : null}
        {before.length ? (
          <div className="flex flex-col gap-3">
            <h2 className="cal-list-section">{t(w.before)}</h2>
            <DayGroups items={before} today={today} />
          </div>
        ) : null}
      </div>
    );
  }
  const month = date.slice(0, 7);
  const inMonth = sorted.filter((i) => itemDays(i, clock).first.startsWith(month));
  return inMonth.length ? <DayGroups items={inMonth} today={today} scrollToToday /> : <div className="cal-empty">{t(w.freeMonth, { month: say.month(date) })}</div>;
}
