import { addDays, dayName, daysBetween, hhmm, minutesOf, shortDay } from "./calendar-time";

// When something is due: which group of a task list it sits in, how late it
// is, and the words on its pill. Pure. Days are the office's ("YYYY-MM-DD",
// see calendar-time); a task with a day and no time is due by the end of
// that day, one with a time ("HH:MM") is late once the time has gone.

export type DueGroup = "late" | "today" | "tomorrow" | "week" | "later" | "someday";

/** The groups in the order a list shows them: late ones first, then by how soon. */
export const DUE_GROUPS: DueGroup[] = ["late", "today", "tomorrow", "week", "later", "someday"];

export const DUE_GROUP_NAMES: Record<DueGroup, string> = { late: "Late", today: "Today", tomorrow: "Tomorrow", week: "This week", later: "Later", someday: "No date" };

/** The time it is due at, and the office's minutes now, for a task due at a time of day. */
export type DueAt = { time?: string | null; nowMinutes?: number };

/** Whether the due moment has gone by. */
export function isLate(day: string | null, today: string, at: DueAt = {}): boolean {
  if (!day) return false;
  return day < today || (day === today && Boolean(at.time) && at.nowMinutes !== undefined && minutesOf(at.time!) < at.nowMinutes);
}

/** Whole days late: 0 when it isn't, or when only today's hour has gone. */
export function lateDays(day: string | null, today: string): number {
  return day && day < today ? daysBetween(day, today) : 0;
}

/** The list's group for something still open. "This week" runs to seven days from today. */
export function dueGroup(day: string | null, today: string, at: DueAt = {}): DueGroup {
  if (!day) return "someday";
  if (isLate(day, today, at)) return "late";
  if (day === today) return "today";
  if (day === addDays(today, 1)) return "tomorrow";
  return daysBetween(today, day) <= 7 ? "week" : "later";
}

export type DueTone = "late" | "today" | "soon" | "later";

/** "1 day late", "17:00", "Tomorrow", "Thu 15 Oct": the words on a pill, and its tone. */
export function dueText(day: string | null, today: string, at: DueAt = {}): { text: string; tone: DueTone } | null {
  if (!day) return null;
  const time = at.time ? hhmm(minutesOf(at.time)) : null;
  if (isLate(day, today, at)) {
    const late = lateDays(day, today);
    return { text: late === 0 ? `Late, was ${time}` : `${late} day${late > 1 ? "s" : ""} late`, tone: "late" };
  }
  if (day === today) return { text: time ?? "Today", tone: "today" };
  if (day === addDays(today, 1)) return { text: time ? `Tomorrow ${time}` : "Tomorrow", tone: "soon" };
  const year = day.slice(0, 4) !== today.slice(0, 4) ? ` ${day.slice(0, 4)}` : "";
  return { text: `${dayName(day, true)} ${shortDay(day, false)}${year}`, tone: daysBetween(today, day) <= 7 ? "soon" : "later" };
}
