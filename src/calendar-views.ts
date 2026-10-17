import { addDays, addMonths, isRealDay, monthGrid, weekStart, type ClockSettings } from "./calendar-time";

// A calendar's views and its address. The view, the day and a search live in
// the address, so a link opens the same calendar and the page that reads it
// loads only what the view shows. Pure, for the page and the browser.

export type CalendarView = "day" | "week" | "month" | "year" | "people" | "list";

export const CALENDAR_VIEWS: CalendarView[] = ["day", "week", "month", "year", "people", "list"];

/** The views a phone offers: the week and the people fold into the day's cards, the year into the month. */
export const PHONE_VIEWS: CalendarView[] = ["day", "month", "list"];

/** What a phone shows for each view. */
export function phoneView(view: CalendarView): CalendarView {
  return view === "week" || view === "people" ? "day" : view === "year" ? "month" : view;
}

/** The calendar's address for a view and a day, and a search in the list. */
export function calendarHref(base: string, view: CalendarView, date: string, q?: string): string {
  return `${base}?view=${view}&date=${date}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
}

/**
 * The address read back: a search opens the list, a view the calendar doesn't
 * have falls back to `fallback`, and a day that isn't one to today. A search
 * is trimmed to 60 characters.
 */
export function readCalendarAddress(
  params: { view?: string; date?: string; q?: string },
  today: string,
  fallback: CalendarView = "week",
): { view: CalendarView; date: string; q: string } {
  const q = (params.q ?? "").trim().slice(0, 60);
  const view = q ? "list" : CALENDAR_VIEWS.includes(params.view as CalendarView) ? (params.view as CalendarView) : fallback;
  const date = params.date && isRealDay(params.date) ? params.date : today;
  return { view, date, q };
}

/** The days a view shows: its first day, and the day after its last. */
export function viewSpan(view: CalendarView, date: string, clock: ClockSettings = {}): [string, string] {
  switch (view) {
    case "day":
    case "people":
      return [date, addDays(date, 1)];
    case "week":
      return [weekStart(date, clock), addDays(weekStart(date, clock), 7)];
    case "month":
    case "list": {
      const first = monthGrid(date, clock)[0];
      return [first, addDays(first, 42)];
    }
    case "year":
      return [`${date.slice(0, 4)}-01-01`, `${Number(date.slice(0, 4)) + 1}-01-01`];
  }
}

/**
 * The days a page loads for a view: what it shows, always the week around the
 * day (a phone's strip shows it in every view), and a day either side for
 * items that cross midnight. The second day is not included.
 */
export function viewWindow(view: CalendarView, date: string, clock: ClockSettings = {}): [string, string] {
  const [first, last] = viewSpan(view, date, clock);
  const week = weekStart(date, clock);
  const weekEnd = addDays(week, 7);
  return [addDays(first < week ? first : week, -1), addDays(last > weekEnd ? last : weekEnd, 1)];
}

/** The day the arrows step to: a day, a week, a month or a year on. */
export function stepDate(view: CalendarView, date: string, dir: 1 | -1): string {
  if (view === "month" || view === "list") return addMonths(date, dir);
  if (view === "year") return addMonths(date, 12 * dir);
  return addDays(date, view === "week" ? 7 * dir : dir);
}

/** Is the view somewhere other than today, so "Today" is worth offering? */
export function awayFromToday(view: CalendarView, date: string, today: string): boolean {
  if (view === "year") return date.slice(0, 4) !== today.slice(0, 4);
  if (view === "month" || view === "list") return date.slice(0, 7) !== today.slice(0, 7);
  return date !== today;
}
