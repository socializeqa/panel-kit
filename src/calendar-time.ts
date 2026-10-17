// A calendar's clock is the office's, always: a meeting at 10:00 is at 10:00
// for whoever opens the calendar, wherever they are. Days are ISO
// "YYYY-MM-DD" in the office's own time and a time of day is the minutes
// since the office's midnight. Pure, for the server and the browser alike.
//
// The defaults are Doha's, where every team panel works: +03:00 all year
// (Qatar keeps no summer time), the week from Sunday, Friday and Saturday off.
// An office elsewhere hands in its own ClockSettings; one whose clock moves
// for summer gives its zone's name instead of an offset.

export interface ClockSettings {
  /** Minutes ahead of UTC, the same all year. Doha is 180. */
  offsetMinutes?: number;
  /** An IANA zone ("Europe/Bucharest"), for an office whose clock moves for
   *  summer. It wins over `offsetMinutes`, and costs an Intl lookup a read. */
  timeZone?: string;
  /** The day a week starts on: 0 Sunday … 6 Saturday. */
  weekStartsOn?: number;
  /** The days off, 0 Sunday … 6 Saturday. Working days are the rest. */
  weekend?: readonly number[];
}

export const DEFAULT_CLOCK = { offsetMinutes: 180, weekStartsOn: 0, weekend: [5, 6] } as const;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
/** The minutes in a day: a time grid's floor. */
export const DAY_END = 24 * 60;

const pad = (n: number) => String(n).padStart(2, "0");

const ZONES = new Map<string, Intl.DateTimeFormat>();

/** How far a zone's wall clock runs ahead of UTC at a moment, in minutes. */
function zoneOffset(ms: number, timeZone: string): number {
  let format = ZONES.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    ZONES.set(timeZone, format);
  }
  const part = Object.fromEntries(format.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  const wall = Date.UTC(Number(part.year), Number(part.month) - 1, Number(part.day), Number(part.hour), Number(part.minute), Number(part.second));
  return Math.round((wall - Math.floor(ms / 1000) * 1000) / MINUTE_MS);
}

const offsetAt = (ms: number, clock: ClockSettings) => (clock.timeZone ? zoneOffset(ms, clock.timeZone) : (clock.offsetMinutes ?? DEFAULT_CLOCK.offsetMinutes));

const dayOf = (utc: Date) => `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;

/** "HH:MM" → minutes since midnight. */
export function minutesOf(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

/** A moment on the office's wall clock: the day, and the minutes since midnight. */
export function officeClock(iso: string | Date, clock: ClockSettings = {}): { day: string; minutes: number } {
  const ms = new Date(iso).getTime();
  const shifted = new Date(ms + offsetAt(ms, clock) * MINUTE_MS);
  return { day: dayOf(shifted), minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}

/** The office's wall clock back to a moment, as an ISO string: a day and "HH:MM", or minutes since midnight. */
export function officeMoment(day: string, time: string | number, clock: ClockSettings = {}): string {
  const minutes = typeof time === "number" ? time : minutesOf(time);
  const [y, m, d] = day.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d) + minutes * MINUTE_MS;
  if (!clock.timeZone) return new Date(wall - offsetAt(wall, clock) * MINUTE_MS).toISOString();
  // A moving clock: guess with the offset at the wall time, then take the
  // offset at the guess, which is right on either side of a change.
  const guess = wall - zoneOffset(wall, clock.timeZone) * MINUTE_MS;
  return new Date(wall - zoneOffset(guess, clock.timeZone) * MINUTE_MS).toISOString();
}

/** Today, in the office. */
export function officeToday(clock: ClockSettings = {}): string {
  return officeClock(new Date(), clock).day;
}

/** Minutes since the office's midnight, now. */
export function officeMinutes(clock: ClockSettings = {}): number {
  return officeClock(new Date(), clock).minutes;
}

/** The moment now, in milliseconds ("waiting 12 min"), for a server render
 *  to read once instead of calling Date.now() in the middle of one. */
export function nowMs(): number {
  return Date.now();
}

export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return dayOf(new Date(Date.UTC(y, m - 1, d) + days * DAY_MS));
}

/** The first of the month `months` on from `day`'s month. */
export function addMonths(day: string, months: number): string {
  const [y, m] = day.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}-01`;
}

/** Whole days from one day to another: 1 from today to tomorrow. */
export function daysBetween(from: string, to: string): number {
  const at = (day: string) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
  return Math.round((at(to) - at(from)) / DAY_MS);
}

/** Whether a day exists: 2026-02-30 doesn't. */
export function isRealDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && addDays(day, 0) === day;
}

/** 0 for Sunday … 6 for Saturday. */
export function weekday(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const startOf = (clock: ClockSettings) => clock.weekStartsOn ?? DEFAULT_CLOCK.weekStartsOn;

/** The day the week holding `day` starts on. */
export function weekStart(day: string, clock: ClockSettings = {}): string {
  return addDays(day, -((weekday(day) - startOf(clock) + 7) % 7));
}

/** The seven days of the week holding `day`, in order. */
export function weekDays(day: string, clock: ClockSettings = {}): string[] {
  const first = weekStart(day, clock);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

export function monthStart(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

/** The six weeks a month's grid shows, from the week's first day: 42 days. */
export function monthGrid(day: string, clock: ClockSettings = {}): string[] {
  const first = weekStart(monthStart(day), clock);
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

export function isWeekend(day: string, clock: ClockSettings = {}): boolean {
  return (clock.weekend ?? DEFAULT_CLOCK.weekend).includes(weekday(day));
}

/** The working days, 0 Sunday … 6 Saturday, in the order the week runs. */
export function workingDays(clock: ClockSettings = {}): number[] {
  const off = clock.weekend ?? DEFAULT_CLOCK.weekend;
  return Array.from({ length: 7 }, (_, i) => (startOf(clock) + i) % 7).filter((d) => !off.includes(d));
}

/** Minutes as "HH:MM". */
export function hhmm(minutes: number): string {
  return `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
}

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export function monthName(day: string): string {
  return MONTHS[Number(day.slice(5, 7)) - 1];
}

/** "Wednesday", or "Wed". */
export function dayName(day: string, short = false): string {
  const name = DAYS[weekday(day)];
  return short ? name.slice(0, 3) : name;
}

/** "14 Oct 2026", or "14 Oct" without the year. */
export function shortDay(day: string, withYear = true): string {
  return `${Number(day.slice(8, 10))} ${monthName(day).slice(0, 3)}${withYear ? ` ${day.slice(0, 4)}` : ""}`;
}

/** "Wednesday 14 October". */
export function longDate(day: string): string {
  return `${dayName(day)} ${Number(day.slice(8, 10))} ${monthName(day)}`;
}
