// What a list can be filtered and sorted by. The app writes one ListConfig per
// list and hands the set to PanelProvider, keyed by the list's path; the
// header's controls draw from it, and the list page validates its params
// against the same object with resolveSort and resolvePage.
//
// Elite Touch's types (lib/admin/list-config.ts) with Señorritas' additions:
// a choice with several answers, a number range, a list with a fallback
// answer, and a list ordered by a named choice instead of a column.

export interface Option {
  value: string;
  label: string;
}

export interface SortOption extends Option {
  // What kind of value the column holds, so the direction control speaks its
  // language: dates say newest/oldest, amounts highest/lowest, text A to Z,
  // and `order` is the order the public sees (a menu, a website's promotions).
  type?: "date" | "amount" | "text" | "order";
  /** The direction's two words, when the column's type doesn't say it. */
  words?: { desc: string; asc: string };
  /** The capability a person needs to sort by this — Elite Touch withholds
   *  its money columns from someone who can't see amounts. */
  cap?: string;
}

export interface ListConfig {
  statuses: Option[];
  sorts: SortOption[];
  defaultSort: string;
  // What the ?status param actually filters on this list — shown in the filter
  // menu header and on the active-filter chip ("Stage: Confirmed").
  statusLabel?: string;
  // Hint for the list search input; every list page applies ?q.
  searchHint?: string;
  // A second, independent filter dimension (its own header button + chip).
  extraFilter?: { param: string; label: string; options: Option[] };
  // Richer filtering than one status menu can hold. When present, the header
  // opens a drawer of these sections instead of the single Filter menu.
  filters?: FilterSection[];
}

/**
 * One filter dimension in the drawer.
 *
 * A `choice` writes its param directly. A `dateRange` writes `<param>_from` /
 * `<param>_to`, a `numberRange` `<param>_min` / `<param>_max` — the contract
 * the list pages read. A choice declared with no options is filled by the
 * page from its data (ListOptions), and dropped when the data has none.
 */
export type FilterSection =
  | {
      kind: "choice";
      param: string;
      label: string;
      groups: { label?: string; options: Option[] }[];
      /** One quiet line under the pills saying what the choice means. */
      hint?: string;
      /** Take the full row whatever the option count. */
      wide?: boolean;
      /** The answer the list uses when the URL names none — shown lit. */
      fallback?: string;
      /** Several answers at once — the param carries them comma-joined. */
      multiple?: boolean;
    }
  | {
      kind: "dateRange";
      param: string;
      label: string;
      /** false = the two dates only, no quick-range bar (the list has its own windows). */
      quick?: boolean;
    }
  | {
      kind: "numberRange";
      param: string;
      label: string;
      /** The word after each number — "years". */
      unit: string;
      min?: number;
      max?: number;
    };

// Validate the sort params against the config, so only known columns reach
// the query. Defaults to the list's own column, descending.
export function resolveSort(config: ListConfig, sort?: string | null, dir?: string | null) {
  const column = config.sorts.some((s) => s.value === sort) ? (sort as string) : config.defaultSort;
  return { column, ascending: dir === "asc" };
}

// Rows per page for a device the RowsCalibrator hasn't measured yet. Once it
// has, every list shows exactly one screenful (page-size.ts).
export const PAGE_SIZE = 20;

export interface PageInfo {
  page: number;
  pageSize: number;
  from: number; // inclusive start index
  to: number; // inclusive end index
}

// Parse the ?page param into a 1-based page plus the range it maps to.
// Anything missing or invalid falls back to page 1.
export function resolvePage(raw?: string | null, pageSize = PAGE_SIZE): PageInfo {
  const n = Number(raw);
  const page = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  return {
    page,
    pageSize,
    from: (page - 1) * pageSize,
    to: page * pageSize - 1,
  };
}

// The href for a given page that keeps the current filter / sort / search
// params. ?page is left out for page 1, so the first page stays clean.
export function pageHrefBuilder(
  basePath: string,
  params: Record<string, string | null | undefined>,
): (page: number) => string {
  return (page: number) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || !value) continue;
      sp.set(key, value);
    }
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
}
