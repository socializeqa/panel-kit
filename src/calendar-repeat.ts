import { addDays, addMonths, DAYS, dayName, weekday, workingDays, type ClockSettings } from "./calendar-time";

// Repeating items: the days a series falls on, and how a form says the rule.
// Pure. "Every working day" follows the office's weekend (Sunday to Thursday
// in Doha); a series runs a year at the most.

export const REPEATS = ["weekdays", "daily", "weekly", "fortnightly", "monthly"] as const;
export type Repeat = (typeof REPEATS)[number];

/** The last day a series that starts on `first` may reach: a year on. */
export function seriesEnd(first: string): string {
  return addDays(first, 365);
}

const real = (day: string) => addDays(day, 0) === day;

/**
 * The days a repeating item falls on, from its first day to `until`, both
 * included, a year at the most. The first day is always one of them (the day
 * it was booked on, even a day off). A monthly one keeps its date and skips
 * the months that don't have it, the way a meeting on the 31st does.
 */
export function seriesDays(first: string, repeat: Repeat, until: string, clock: ClockSettings = {}): string[] {
  const end = until < seriesEnd(first) ? until : seriesEnd(first);
  const days = [first];
  if (repeat === "monthly") {
    const date = first.slice(8);
    for (let i = 1; ; i += 1) {
      const day = `${addMonths(first, i).slice(0, 8)}${date}`;
      if (day.slice(0, 7) > end.slice(0, 7)) break;
      if (real(day) && day <= end) days.push(day);
    }
    return days;
  }
  const working = new Set(workingDays(clock));
  const step = repeat === "weekly" ? 7 : repeat === "fortnightly" ? 14 : 1;
  for (let day = addDays(first, step); day <= end; day = addDays(day, step)) {
    if (repeat === "weekdays" && !working.has(weekday(day))) continue;
    days.push(day);
  }
  return days;
}

function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const tail = teen ? "th" : (({ 1: "st", 2: "nd", 3: "rd" }) as Record<number, string>)[n % 10] ?? "th";
  return `${n}${tail}`;
}

/** "Sunday to Thursday" when the working days run unbroken round the week, else null. */
function workingRun(clock: ClockSettings): string | null {
  const working = new Set(workingDays(clock));
  if (working.size < 2 || working.size === 7) return null;
  // The run starts on the working day after a day off, whatever day the week starts on.
  const first = [...working].find((d) => !working.has((d + 6) % 7))!;
  let last = first;
  while (working.has((last + 1) % 7)) last = (last + 1) % 7;
  const length = ((last - first + 7) % 7) + 1;
  return length === working.size ? `${DAYS[first]} to ${DAYS[last]}` : null;
}

/** "Every Wednesday", "Every month on the 14th": the rule in words, for a series that starts on `day`. */
export function repeatLabel(repeat: Repeat, day: string, clock: ClockSettings = {}): string {
  switch (repeat) {
    case "weekdays": {
      const run = workingRun(clock);
      return run ? `Every working day, ${run}` : "Every working day";
    }
    case "daily":
      return "Every day";
    case "weekly":
      return `Every ${dayName(day)}`;
    case "fortnightly":
      return `Every other ${dayName(day)}`;
    case "monthly":
      return `Every month on the ${ordinal(Number(day.slice(8)))}`;
  }
}
