import { resolvePage, type PageInfo } from "./list-config";

// Per-device rows per page. The RowsCalibrator measures how many
// natural-height rows the fill-mode table shows without scrolling on THIS
// screen and stores it in this cookie; every list then pages exactly one
// screenful — no blank band on a tall monitor, no inner scroll on a laptop.
// Clamped, so a mangled cookie can never page the world (or nothing).
export const ROWS_COOKIE = "admin-rows";
// Said on the window when the measure changes, for a list that pages in the
// browser (useAdaptiveRows).
export const ROWS_EVENT = "kit:rows";

/** The measured rows from a cookie's value, clamped to 8–60; undefined before the first measure. */
export function rowsFromValue(value: string | null | undefined): number | undefined {
  const v = Number(value ?? NaN);
  return Number.isFinite(v) && value !== "" ? Math.min(60, Math.max(8, Math.floor(v))) : undefined;
}

/** The same, read out of a whole `document.cookie` string. */
export function rowsFromCookie(cookie: string): number | undefined {
  return rowsFromValue(/(?:^|; )admin-rows=(\d+)/.exec(cookie)?.[1]);
}

/** The ?page param resolved against this screen's measured rows. */
export function resolvePageAdaptive(raw: string | null | undefined, rows: number | undefined): PageInfo {
  return resolvePage(raw, rows);
}
