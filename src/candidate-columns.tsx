import Link from "next/link";
import { Eye, FileText } from "lucide-react";
import { iconBtnClass } from "./classes";
import type { Column } from "./data-table";
import { FitChip } from "./fit-chip";
import type { HiringWords } from "./hiring-words";
import { Tx } from "./panel-provider";
import { StageChip } from "./stage-chip";
import { StarRating } from "./star-rating";
import { Chip } from "./status-badge";
import { tx } from "./tx";

/** What the candidates list reads off a row, whatever shape the app's row has. */
export interface CandidateRow {
  name: string;
  /** How many times they applied before with the same email: the name gets a small ×N. */
  appliedBefore?: number;
  /** The day they applied, as the app writes a day. */
  applied: string;
  role: string;
  stage: string;
  fitScore: number | null;
  rating: number | null;
  /** The CV's address, when they sent one. */
  cvHref?: string | null;
  hasPortfolio?: boolean;
}

const MUTED = <span className="text-ink/40">—</span>;

// Hidden words name an icon-only link, not aria-label: <Tx> translates text,
// and an attribute set on the server can't read the panel's language.
const named = (words: string) => (
  <span className="sr-only">
    <Tx>{words}</Tx>
  </span>
);

/**
 * The candidates list's common columns, one line a row: the name (pinned when
 * the table scrolls sideways), the day, the role, the panel's own columns, the
 * papers, the reader's fit, the office's rating, the stage, and the row's two
 * seats (the file, the CV). Server-safe: a server page builds them with the
 * words it read. `extra` columns (age, nationality, where they came from) sit
 * after the role.
 */
export function candidateColumns<T>({
  words,
  read,
  href,
  extra = [],
}: {
  words: Pick<HiringWords, "stages" | "fitWord" | "fitTone" | "fitCutoffs">;
  read: (row: T) => CandidateRow;
  /** The candidate's file. */
  href: (row: T) => string;
  extra?: Column<T>[];
}): Column<T>[] {
  return [
    {
      header: "Name",
      className: "2xl:w-[13%]",
      cell: (row) => {
        const c = read(row);
        return (
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className="truncate font-medium text-ink">{c.name}</span>
            {/* Applied before, with this email: the number of applications in all. */}
            {c.appliedBefore ? <span className="shrink-0 text-[11px] font-medium text-quiet tabular-nums">×{c.appliedBefore + 1}</span> : null}
          </span>
        );
      },
    },
    { header: "Applied", priority: "medium", className: "whitespace-nowrap tabular-nums 2xl:w-[6%]", cell: (row) => read(row).applied },
    { header: "Role", priority: "medium", className: "2xl:w-[12%]", cell: (row) => <span className="block truncate text-ink/60">{read(row).role}</span> },
    ...extra,
    {
      header: "Papers",
      priority: "medium",
      className: "2xl:w-[9%]",
      cell: (row) => {
        const c = read(row);
        if (!c.cvHref && !c.hasPortfolio) return MUTED;
        return (
          <span className="flex gap-1">
            {c.cvHref ? <Chip>CV</Chip> : null}
            {c.hasPortfolio ? <Chip>Portfolio</Chip> : null}
          </span>
        );
      },
    },
    {
      // The reader's score is how fifty people get sorted: it stays on a laptop.
      header: "Fit",
      priority: "high",
      className: "whitespace-nowrap 2xl:w-[10%]",
      cell: (row) => {
        const score = read(row).fitScore;
        return score === null ? <span className="text-ink/40">{tx(words.fitWord(null))}</span> : <FitChip score={score} words={words} />;
      },
    },
    {
      header: "Rating",
      priority: "low",
      card: false,
      className: "2xl:w-[6%]",
      cell: (row) => {
        const rating = read(row).rating;
        return rating ? <StarRating value={rating} readOnly size={12} /> : MUTED;
      },
    },
    { header: "Stage", className: "2xl:w-[9%]", cell: (row) => <StageChip stage={read(row).stage} words={words} /> },
    {
      header: "Actions",
      className: "text-end",
      cell: (row) => {
        const c = read(row);
        return (
          <div className="flex items-center justify-end gap-0.5">
            <Link href={href(row)} className={iconBtnClass(8, "ink")}>
              <Eye size={15} strokeWidth={2} aria-hidden="true" />
              {named("Open the file")}
            </Link>
            {c.cvHref ? (
              <a href={c.cvHref} target="_blank" rel="noreferrer" className={iconBtnClass(8, "ink")}>
                <FileText size={15} strokeWidth={2} aria-hidden="true" />
                {named("Open the CV")}
              </a>
            ) : (
              // No CV: the seat stays, so every row's eye sits in one line.
              <span aria-hidden="true" className="inline-block size-8" />
            )}
          </div>
        );
      },
    },
  ];
}
