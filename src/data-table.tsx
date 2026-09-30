import Link from "next/link";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { iconBtnClass, PANEL_SHELL } from "./classes";
import { cn } from "./cn";
import { EmptyState } from "./empty-state";
import { Tx } from "./panel-provider";
import { Eyebrow } from "./record";
import { tx } from "./tx";

// The one list. Server-safe: a server page hands it rows and column renderers
// straight from its query. Its words go through tx()/<Tx>, so a panel that
// speaks Arabic reads its headers and pager in Arabic with no work per list.

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /**
   * Which columns survive when the table runs out of room (SAP Fiori's
   * "importance"): `low` leaves first, then `medium`. The identity column and
   * Actions always stay. Default `high` — a column leaves only when a room
   * says it may.
   */
  priority?: "high" | "medium" | "low";
  /** false leaves the column out of the phone card — a detail the row's
   *  drawer repeats — so a phone shows more than one record at a time
   *  (Señorritas). The table keeps every column either way. */
  card?: boolean;
  /** In the phone rows layout the header isn't drawn, so a bare figure says
   *  nothing. true puts the header before the value there ("Visits 1"). */
  inlineLabel?: boolean;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  // The href for a page, with the current filters and search kept.
  hrefForPage: (page: number) => string;
}

// A row opens its record on the same page (a drawer), so every link here
// keeps the scroll where it is — the list stays put underneath.
export function DataTable<T>({
  rows,
  columns,
  rowHref,
  rowClassName,
  emptyLabel,
  emptyIcon,
  emptyDescription,
  emptyAction,
  fill = false,
  pagination,
  phoneLayout = "cards",
}: {
  rows: T[];
  columns: Column<T>[];
  rowHref?: (row: T) => string;
  // Extra classes for a row in BOTH layouts — how a list settles finished
  // rows ("opacity-55") without every cell restyling itself.
  rowClassName?: (row: T) => string | undefined;
  // The empty state's title when there are no rows.
  emptyLabel: string;
  emptyIcon?: LucideIcon;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  // Stretch the card to its parent's height; the body scrolls inside and the
  // header stays pinned. For the full-height list pages.
  fill?: boolean;
  // A footer with the record range and previous / next.
  pagination?: TablePagination;
  // How a phone shows the list: "cards" is Elite Touch's stacked card; "rows"
  // is two tight lines a row — the title, then the card columns on one line —
  // for a screen where the staff need seven records, not two (Señorritas'
  // host stand, Damine, 23 Sep 2026).
  phoneLayout?: "cards" | "rows";
}) {
  if (rows.length === 0) {
    return (
      <EmptyState icon={emptyIcon} title={emptyLabel} description={emptyDescription} action={emptyAction} fill={fill} />
    );
  }

  // A phone (the table's own width under 640px) gets the stacked layout. A
  // tablet and up get the table: `table-fixed` with truncating cells squeezes
  // every column onto one line, then relaxes on a genuinely wide desk. The
  // first column is the record's name; a column named "Actions" holds the
  // row's controls (never truncated, fixed width, so no icon clips).
  const titleColumn = columns[0];
  if (!titleColumn) return null;
  const actionsColumn = columns.find((c) => c.header === "Actions");
  const detailColumns = columns.filter((c, i) => i !== 0 && c.header !== "Actions");
  const cardColumns = detailColumns.filter((c) => c.card !== false);

  // A column never renders under its floor: identity 220, a detail 140,
  // Actions 88. The table carries their sum as a min-width, so `table-fixed`
  // scrolls the row instead of squeezing a cell to 26px. Columns a room marked
  // droppable are left out — they are hidden at the widths where it matters.
  const kept = detailColumns.filter((c) => (c.priority ?? "high") === "high");
  const minTableWidth = 220 + (actionsColumn ? 88 : 0) + kept.length * 140;
  const dropClass = (c: Column<T>) =>
    c.priority === "low" ? "hidden @[1150px]:table-cell" : c.priority === "medium" ? "hidden @[950px]:table-cell" : undefined;

  return (
    <div
      className={cn(
        // @container: switch table and cards on the table's OWN width (the
        // content area less the rail), not the viewport's.
        PANEL_SHELL,
        "@container flex flex-col overflow-hidden",
        fill && "h-full min-h-0",
      )}
    >
      <div className={cn("overflow-y-auto @[640px]:hidden", phoneLayout === "cards" && "p-2.5", fill && "min-h-0 flex-1")}>
        {phoneLayout === "rows" ? (
          <ul className="divide-y divide-ink/[0.06]">
            {rows.map((row, ri) => (
              // The actions sit on the name's line, so the details below have
              // the whole width.
              <li key={ri} className={cn("px-3.5 py-2.5", rowClassName?.(row))}>
                <div className="flex items-center gap-3">
                  {rowHref ? (
                    <Link
                      href={rowHref(row)}
                      scroll={false}
                      className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink transition-colors hover:text-brand-deep"
                    >
                      {tx(titleColumn.cell(row))}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">{tx(titleColumn.cell(row))}</span>
                  )}
                  {actionsColumn && <div className="shrink-0">{actionsColumn.cell(row)}</div>}
                </div>
                {cardColumns.length > 0 && (
                  <div className="mt-1 flex min-w-0 items-center gap-x-2 overflow-hidden whitespace-nowrap text-[12px] leading-5 text-ink/70">
                    {cardColumns.map((col, ci) => (
                      <span
                        key={ci}
                        className={cn("flex items-center gap-x-2", ci === cardColumns.length - 1 ? "min-w-0" : "shrink-0")}
                      >
                        {ci > 0 && (
                          <span aria-hidden className="text-ink/25">
                            ·
                          </span>
                        )}
                        <span className={ci === cardColumns.length - 1 ? "min-w-0 truncate" : undefined}>
                          {col.inlineLabel && <span className="text-quiet">{tx(col.header)} </span>}
                          {tx(col.cell(row))}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((row, ri) => (
              <li
                key={ri}
                className={cn(
                  // A card has room a table cell does not, so the cells'
                  // `truncate` is lifted here: the line wraps instead of being
                  // cut (Damine, 26 Aug 2026: "no squeezes").
                  PANEL_SHELL,
                  "border-ink/[0.08] p-4",
                  "[&_.truncate]:overflow-visible [&_.truncate]:whitespace-normal",
                  rowClassName?.(row),
                )}
              >
                <div className="flex items-start justify-between gap-3 border-b border-ink/[0.06] pb-2.5">
                  {rowHref ? (
                    <Link
                      href={rowHref(row)}
                      scroll={false}
                      className="min-w-0 flex-1 text-[15px] font-semibold text-ink transition-colors hover:text-brand-deep"
                    >
                      {tx(titleColumn.cell(row))}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 text-[15px] font-semibold text-ink">{tx(titleColumn.cell(row))}</span>
                  )}
                  {actionsColumn && <div className="-mt-1 shrink-0">{actionsColumn.cell(row)}</div>}
                </div>
                {cardColumns.length > 0 && (
                  <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 @[420px]:grid-cols-2 @[680px]:grid-cols-3">
                    {cardColumns.map((col, ci) => (
                      <div key={ci} className="flex min-w-0 flex-col gap-1">
                        <dt>
                          <Eyebrow>{col.header}</Eyebrow>
                        </dt>
                        <dd className="min-w-0 break-words text-[13px] leading-snug text-ink/80">{tx(col.cell(row))}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className={cn("hidden overflow-x-auto @[640px]:block", fill && "min-h-0 @[640px]:flex-1 @[640px]:overflow-y-auto")}
        // A fill-mode table advertises its body so the RowsCalibrator can
        // measure how many rows fit this screen. Only in fill mode — a
        // natural-height table would just measure itself.
        {...(fill ? { "data-table-body": "" } : {})}
      >
        {/* Stretch to the card ONLY when the page is full: h-full hands the
            leftover height to the rows, so the dead band under the last row
            goes. Always stretching made a near-empty list one giant centred
            row, so a short page keeps its natural height. */}
        <table
          style={{ minWidth: `${minTableWidth}px` }}
          className={cn(
            "w-full table-fixed border-collapse text-start text-[13px]",
            fill && pagination && rows.length >= pagination.pageSize && "h-full",
          )}
        >
          <thead className="sticky top-0 z-10 border-b border-ink/[0.07] bg-ground">
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={cn(
                    "h-9 truncate px-3 py-0 text-start font-semibold",
                    // Actions pin to the end edge, so a row's controls stay
                    // in reach when a wide table scrolls sideways; z-20 keeps
                    // the header's corner above the body's.
                    c.header === "Actions" && "sticky end-0 z-20 w-[108px] border-s border-ink/[0.07] bg-ground",
                    // The identity column pins to the other edge: a row
                    // scrolled sideways never loses who it is.
                    i === 0 && "sticky start-0 z-20 bg-ground",
                    dropClass(c),
                    c.className,
                  )}
                >
                  <Eyebrow>{c.header}</Eyebrow>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              // relative: hosts the first cell's stretched link, so the whole
              // row opens the record. Other interactive cells sit above it.
              <tr
                key={ri}
                className={cn(
                  // The rail's grammar for "this one": a soft brand wash and a
                  // 2px edge on the leading side (--kit-dir finds it in Arabic).
                  "group/row relative border-t border-ink/[0.06] transition-colors first:border-t-0 hover:bg-brand/[0.035] [&>td:first-child]:shadow-[inset_2px_0_0_0_transparent] hover:[&>td:first-child]:shadow-[inset_calc(2px*var(--kit-dir))_0_0_0_var(--brand-deep)]",
                  rowClassName?.(row),
                )}
              >
                {columns.map((c, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "px-3 py-1.5 align-middle text-ink/80",
                      // An opaque body behind the pinned Actions, so scrolled
                      // cells don't bleed through. Quiet until the row is under
                      // the pointer — the eye reads the data, not the icons.
                      c.header === "Actions" &&
                        "sticky end-0 z-10 border-s border-ink/[0.07] bg-surface opacity-55 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100",
                      ci === 0 && "sticky start-0 z-[5] bg-surface",
                      dropClass(c),
                      c.className,
                    )}
                  >
                    {c.header === "Actions" ? (
                      c.cell(row)
                    ) : (
                      <div className="truncate">
                        {ci === 0 && rowHref ? (
                          <Link
                            href={rowHref(row)}
                            scroll={false}
                            className="font-medium text-ink transition-colors hover:text-brand-deep after:absolute after:inset-0 after:content-['']"
                          >
                            {tx(c.cell(row))}
                          </Link>
                        ) : (
                          tx(c.cell(row))
                        )}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && <TableFooter {...pagination} />}
    </div>
  );
}

function TableFooter({ page, pageSize, total, hrefForPage }: TablePagination) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-t border-ink/[0.07] bg-ground px-4 text-[12px] text-quiet">
      <span className="tabular-nums">
        <Tx text="{start}–{end} of {total}" vars={{ start, end, total }} />
      </span>
      <div className="flex items-center gap-1.5">
        <PagerButton href={hrefForPage(page - 1)} disabled={page <= 1} label="Previous page">
          <ChevronLeft className="size-4 rtl:-scale-x-100" />
        </PagerButton>
        <span className="px-1 tabular-nums">
          <Tx text="Page {page} of {pages}" vars={{ page, pages }} />
        </span>
        <PagerButton href={hrefForPage(page + 1)} disabled={page >= pages} label="Next page">
          <ChevronRight className="size-4 rtl:-scale-x-100" />
        </PagerButton>
      </div>
    </div>
  );
}

// Named by hidden words rather than aria-label: <Tx> translates text, and an
// attribute set on the server can't read the panel's language.
function PagerButton({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  const name = (
    <span className="sr-only">
      <Tx>{label}</Tx>
    </span>
  );
  if (disabled) {
    return (
      // pointer-events-none keeps the shared hover tint off a dead end.
      <span aria-disabled="true" className={cn(iconBtnClass(7, "ink"), "pointer-events-none text-ink/25")}>
        {children}
        {name}
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} className={iconBtnClass(7, "ink")}>
      {children}
      {name}
    </Link>
  );
}
