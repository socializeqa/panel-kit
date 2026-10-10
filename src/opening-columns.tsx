import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import { iconBtnClass } from "./classes";
import type { Column } from "./data-table";
import { OpeningChip } from "./opening-chip";
import { Tx } from "./panel-provider";
import { tx } from "./tx";

/** What the openings list reads off a row. */
export interface OpeningRow {
  title: string;
  /** The quiet line under the title: the department, or the summary. */
  under?: string | null;
  /** The employment type in words ("Full-time"). */
  type: string;
  applicants: number;
  /** How many of them are new. */
  waiting: number;
  /** The day it was posted, as the app writes a day. */
  posted: string;
  status: string;
  /** The status in words, when the app's differ from the stored value. */
  statusLabel?: string;
  slug: string;
}

const named = (words: string) => (
  <span className="sr-only">
    <Tx>{words}</Tx>
  </span>
);

/**
 * The openings list's columns: the role, its type, who it drew in (and how
 * many are new), when it went up, its status, and the row's seats (the
 * opening, and its live page while it is live). Server-safe.
 */
export function openingColumns<T>({
  read,
  href,
  publicUrl,
  live = "open",
}: {
  read: (row: T) => OpeningRow;
  /** The opening's drawer. */
  href: (row: T) => string;
  /** The live page's address for a slug; no seat when left out. */
  publicUrl?: (slug: string) => string;
  /** The status that puts a role on the site. */
  live?: string;
}): Column<T>[] {
  return [
    {
      header: "Role",
      className: "2xl:w-[34%]",
      cell: (row) => {
        const o = read(row);
        return (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium text-ink">{o.title}</span>
            {o.under ? <span className="truncate text-[11px] text-quiet">{o.under}</span> : null}
          </span>
        );
      },
    },
    { header: "Type", priority: "medium", className: "2xl:w-[12%]", cell: (row) => tx(read(row).type) },
    {
      header: "Applicants",
      className: "2xl:w-[16%]",
      cell: (row) => {
        const o = read(row);
        return (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="tabular-nums">{o.applicants}</span>
            <span className="truncate text-[11px] text-quiet">
              {o.waiting ? <Tx text="{n} new" vars={{ n: o.waiting }} /> : <Tx>{o.applicants ? "none new" : "nobody yet"}</Tx>}
            </span>
          </span>
        );
      },
    },
    { header: "Posted", priority: "low", className: "whitespace-nowrap 2xl:w-[10%]", cell: (row) => read(row).posted },
    {
      header: "Status",
      className: "2xl:w-[12%]",
      cell: (row) => {
        const o = read(row);
        return <OpeningChip status={o.status} label={o.statusLabel} live={live} />;
      },
    },
    {
      header: "Actions",
      className: "text-end",
      cell: (row) => {
        const o = read(row);
        return (
          <div className="flex items-center justify-end gap-0.5">
            <Link href={href(row)} className={iconBtnClass(8, "ink")}>
              <Eye size={15} strokeWidth={2} aria-hidden="true" />
              {named("Open the opening")}
            </Link>
            {publicUrl && o.status === live ? (
              <a href={publicUrl(o.slug)} target="_blank" rel="noreferrer" className={iconBtnClass(8, "ink")}>
                <ExternalLink size={15} strokeWidth={2} aria-hidden="true" />
                {named("See it on the website")}
              </a>
            ) : null}
          </div>
        );
      },
    },
  ];
}
