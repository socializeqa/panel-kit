// The two readings the kit itself needs: what day it is where the panel
// works, and a clock time the way the panel writes one. A room's own date
// formats stay the app's.

const DAY_CACHE = new Map<string, Intl.DateTimeFormat>();

/** Today's calendar date in `timeZone`, as "YYYY-MM-DD" — the office's day,
 *  not the browser's. */
export function todayIso(timeZone = "Asia/Qatar", now: Date = new Date()): string {
  let day = DAY_CACHE.get(timeZone);
  if (!day) {
    // en-CA writes a date as YYYY-MM-DD.
    day = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    DAY_CACHE.set(timeZone, day);
  }
  return day.format(now);
}

/** "HH:MM" → "9:30 AM", the panel's one clock. A missing time reads as a dash. */
export function formatTime(value: string | null): string {
  const m = value ? /^(\d{1,2}):(\d{2})/.exec(value) : null;
  if (!m) return "—";
  const h = Number(m[1]);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}
