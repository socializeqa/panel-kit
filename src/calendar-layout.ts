import type { Repeat } from "./calendar-repeat";
import { addDays, DAY_END, officeClock, officeMoment, type ClockSettings } from "./calendar-time";

// What a calendar holds and how it sits: the items of a day in columns, the
// all-day bars across a week, where a drag puts an item, and what the
// calendar warns about. Pure, so the server, the browser and the tests share
// one copy.

/** Someone whose items the calendar shows. */
export type CalendarPerson = {
  id: string;
  name: string;
  /** Their colour on the calendar; without one their items wear the brand. */
  colour?: string | null;
  /** A line under the name: their role. */
  subtitle?: string | null;
};

export type CalendarStatus = "confirmed" | "tentative" | "cancelled";

type ItemBase = {
  id: string;
  /** What it is — "meeting", "task", "post", "leave". The app names the kinds
   *  and gives each its icon; the calendar only groups and filters by them. */
  kind: string;
  title: string;
  /** Whose it is: the people's ids. */
  people: string[];
  /** Its own colour (a client's brand); else its first person's; else the brand. */
  colour?: string | null;
  /** A line under the title: who it is with. */
  subtitle?: string | null;
  location?: string | null;
  /** The drive before it: drawn above it, and warned about when it doesn't fit. */
  travelMinutes?: number;
  status?: CalendarStatus;
  /** May it be dragged and stretched? It opens on a press either way. */
  editable: boolean;
  /** Time off: the person is away. It hatches their day and warns about
   *  anything else of theirs booked inside it. */
  away?: boolean;
  /** The series a repeating item belongs to, and its rule. */
  seriesId?: string | null;
  repeat?: Repeat | null;
};

/** An item with a time: from `start` to `end`, ISO moments. */
export type TimedItem = ItemBase & { allDay?: false; start: string; end: string };
/** An item that takes whole days: `day` to `endDay` (the same day when left out), both included. */
export type AllDayItem = ItemBase & { allDay: true; day: string; endDay?: string };

export type CalendarItem = TimedItem | AllDayItem;

export function isTimed(item: CalendarItem): item is TimedItem {
  return !item.allDay;
}

/** The first and last office days an item touches. One that ends at midnight stays in its day. */
export function itemDays(item: CalendarItem, clock: ClockSettings = {}): { first: string; last: string } {
  if (!isTimed(item)) return { first: item.day, last: item.endDay && item.endDay > item.day ? item.endDay : item.day };
  const first = officeClock(item.start, clock).day;
  const endMs = new Date(item.end).getTime();
  const lastMoment = endMs > new Date(item.start).getTime() ? endMs - 1 : endMs;
  return { first, last: officeClock(new Date(lastMoment), clock).day };
}

/** Does the item touch this day? */
export function isOn(item: CalendarItem, day: string, clock: ClockSettings = {}): boolean {
  const { first, last } = itemDays(item, clock);
  return first <= day && last >= day;
}

/** The moments an item runs between, in milliseconds: an all-day item from its first midnight to the one after its last day. */
export function itemSpan(item: CalendarItem, clock: ClockSettings = {}): { from: number; to: number } {
  if (isTimed(item)) return { from: new Date(item.start).getTime(), to: new Date(item.end).getTime() };
  const { first, last } = itemDays(item, clock);
  return { from: new Date(officeMoment(first, 0, clock)).getTime(), to: new Date(officeMoment(addDays(last, 1), 0, clock)).getTime() };
}

/** The order a list reads in: by first day, the all-day ones first, then by start. */
export function byStart(clock: ClockSettings = {}) {
  return (a: CalendarItem, b: CalendarItem) =>
    itemDays(a, clock).first.localeCompare(itemDays(b, clock).first) ||
    Number(isTimed(a)) - Number(isTimed(b)) ||
    itemSpan(a, clock).from - itemSpan(b, clock).from;
}

/** An item placed in its day: its minutes, and its column among the items it overlaps. */
export type Placed = { item: TimedItem; from: number; to: number; lane: number; lanes: number };

/**
 * The timed items of one day, each given a column: items that overlap share
 * the width in as many columns as the busiest moment needs, and an item that
 * overlaps none takes the whole width. One that runs past midnight is cut at
 * the day's end and starts at midnight the next.
 */
export function placeDay(items: CalendarItem[], day: string, clock: ClockSettings = {}): Placed[] {
  const rows = items
    .filter((item): item is TimedItem => isTimed(item) && isOn(item, day, clock))
    .map((item) => {
      const start = officeClock(item.start, clock);
      const end = officeClock(item.end, clock);
      const from = start.day < day ? 0 : start.minutes;
      const to = end.day > day ? DAY_END : end.minutes;
      return { item, from, to: Math.max(to, from + 15) };
    })
    .sort((a, b) => a.from - b.from || b.to - a.to);

  const placed: Placed[] = [];
  let group: Placed[] = [];
  let groupEnd = -1;
  const close = () => {
    const lanes = Math.max(1, ...group.map((p) => p.lane + 1));
    for (const p of group) p.lanes = lanes;
    placed.push(...group);
    group = [];
  };
  for (const row of rows) {
    if (row.from >= groupEnd && group.length) close();
    const taken = new Set(group.filter((p) => p.to > row.from).map((p) => p.lane));
    let lane = 0;
    while (taken.has(lane)) lane += 1;
    group.push({ ...row, lane, lanes: 1 });
    groupEnd = Math.max(groupEnd, row.to);
  }
  if (group.length) close();
  return placed;
}

/** A column of a calendar: a day (the week, the day), or a person on one day (people side by side). */
export type CalendarColumn = { day: string; person?: string };

/** An all-day bar across the columns: where it starts, how many it spans, and its row. */
export type AllDayBar = { item: AllDayItem; col: number; span: number; row: number };

/**
 * The all-day lane over a time grid: each all-day item as a bar across the
 * columns it covers, stacked in as few rows as keep them apart. In the people
 * view a bar sits in the columns of its own people; one for two people who
 * aren't side by side is two bars.
 */
export function placeAllDay(items: CalendarItem[], columns: CalendarColumn[], clock: ClockSettings = {}): { bars: AllDayBar[]; rows: number } {
  const pieces: Omit<AllDayBar, "row">[] = [];
  for (const item of items) {
    if (isTimed(item)) continue;
    const { first, last } = itemDays(item, clock);
    const covers = columns.map((c) => c.day >= first && c.day <= last && (!c.person || item.people.includes(c.person)));
    for (let col = 0; col < columns.length; col += 1) {
      if (!covers[col] || covers[col - 1]) continue;
      let span = 1;
      while (covers[col + span]) span += 1;
      pieces.push({ item, col, span });
    }
  }
  pieces.sort((a, b) => a.col - b.col || b.span - a.span);
  const ends: number[] = [];
  const bars = pieces.map((piece) => {
    let row = ends.findIndex((end) => end <= piece.col);
    if (row < 0) row = ends.length;
    ends[row] = piece.col + piece.span;
    return { ...piece, row };
  });
  return { bars, rows: ends.length };
}

/** What the calendar warns about, for one person on one item; `otherId` is the item it runs into. */
export type CalendarWarning = { kind: "clash" | "drive" | "away"; itemId: string; otherId: string; person: string };

/**
 * What the calendar warns about, per person: two timed items at once (a
 * clash, on both), an item whose drive starts before the person's previous
 * item has ended (no time to drive), and anything of theirs booked while they
 * are away. Cancelled items never count, and time off never clashes with
 * time off.
 */
export function warnings(items: CalendarItem[], clock: ClockSettings = {}): CalendarWarning[] {
  const byPerson = new Map<string, CalendarItem[]>();
  for (const item of items) {
    if (item.status === "cancelled") continue;
    for (const p of item.people) byPerson.set(p, [...(byPerson.get(p) ?? []), item]);
  }
  const found: CalendarWarning[] = [];
  for (const [person, list] of byPerson) {
    const timed = list.filter((i): i is TimedItem => isTimed(i) && !i.away).sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 0; i < timed.length; i += 1) {
      for (let j = i + 1; j < timed.length; j += 1) {
        const a = timed[i];
        const b = timed[j];
        const aEnd = new Date(a.end).getTime();
        const bStart = new Date(b.start).getTime();
        if (bStart < aEnd) {
          found.push({ kind: "clash", itemId: b.id, otherId: a.id, person }, { kind: "clash", itemId: a.id, otherId: b.id, person });
        } else if ((b.travelMinutes ?? 0) > 0 && bStart - (b.travelMinutes ?? 0) * 60_000 < aEnd) {
          found.push({ kind: "drive", itemId: b.id, otherId: a.id, person });
        }
      }
    }
    const away = list.filter((i) => i.away);
    if (!away.length) continue;
    for (const item of list) {
      if (item.away) continue;
      const span = itemSpan(item, clock);
      for (const off of away) {
        const out = itemSpan(off, clock);
        if (span.from < out.to && out.from < span.to) found.push({ kind: "away", itemId: item.id, otherId: off.id, person });
      }
    }
  }
  return found;
}

/** The warnings, keyed by the item they sit on, for drawing. */
export function warningsByItem(list: CalendarWarning[]): Map<string, CalendarWarning[]> {
  const map = new Map<string, CalendarWarning[]>();
  for (const w of list) map.set(w.itemId, [...(map.get(w.itemId) ?? []), w]);
  return map;
}

/** A drag on the time grid, as the pointer left it. */
export type GridDrag = {
  kind: "move" | "resize";
  /** Where the item sat when it was picked up: its column and its minutes in that day. */
  col: number;
  from: number;
  to: number;
  /** How far the pointer has travelled, in pixels. */
  dx: number;
  dy: number;
  /** A column's width and an hour's height, in pixels. */
  colWidth: number;
  hour: number;
  cols: number;
  /** May the move change column (another day of the week, another person)? */
  across: boolean;
  /** The columns run right to left (Arabic). */
  rtl?: boolean;
};

/** Drags move, stretch and draw by quarter hours. */
export const SNAP = 15;

/** Where a drag puts an item: snapped to the quarter hour, inside the day, inside the columns. */
export function dropAt(d: GridDrag): { col: number; from: number; to: number } {
  const minutes = Math.round(((d.dy / d.hour) * 60) / SNAP) * SNAP;
  if (d.kind === "resize") return { col: d.col, from: d.from, to: Math.min(DAY_END, Math.max(d.from + SNAP, d.to + minutes)) };
  const length = d.to - d.from;
  const step = Math.round((d.rtl ? -d.dx : d.dx) / (d.colWidth || 1));
  const col = d.across ? Math.min(d.cols - 1, Math.max(0, d.col + step)) : d.col;
  const from = Math.min(DAY_END - length, Math.max(0, d.from + minutes));
  return { col, from, to: from + length };
}

/** What a move asks of the app: the new times and, between people's columns, whose it becomes. */
export type CalendarMove = { start: string; end: string; fromPerson?: string; toPerson?: string };

/** A drop as a move: the target column's day at the dropped minutes, and a hand-over when the person changed. */
export function moveOf(columns: CalendarColumn[], pickedCol: number, drop: { col: number; from: number; to: number }, clock: ClockSettings = {}): CalendarMove {
  const target = columns[drop.col];
  const source = columns[pickedCol];
  const move: CalendarMove = { start: officeMoment(target.day, drop.from, clock), end: officeMoment(target.day, drop.to, clock) };
  if (source.person && target.person && source.person !== target.person) {
    move.fromPerson = source.person;
    move.toPerson = target.person;
  }
  return move;
}
