import Link from "next/link";
import { Eye } from "lucide-react";
import { DEFAULT_CLOCK, dayName, hhmm, officeClock, shortDay, type ClockSettings } from "./calendar-time";
import { iconBtnClass } from "./classes";
import type { Column } from "./data-table";
import { Tx } from "./panel-provider";
import { Chip } from "./status-badge";

/** What the interviews list reads off a row, whatever shape the app's row has. */
export interface InterviewRow {
  /** ISO moments. */
  startsAt: string;
  endsAt: string;
  name: string;
  role: string;
  withWhom?: string | null;
  where?: string | null;
  confirmed: boolean;
  /** It is over and the file still waits on it: the office owes an answer. */
  over?: boolean;
}

const MUTED = <span className="text-ink/40">—</span>;

/** Where an interview stands, as a chip: answer owed once it is over, else their yes or the wait for it. */
export function InterviewChip({ confirmed, over = false }: { confirmed: boolean; over?: boolean }) {
  if (over)
    return (
      <Chip dot="bg-info">
        <Tx>How did it go?</Tx>
      </Chip>
    );
  return confirmed ? (
    <Chip dot="bg-ok">
      <Tx>Confirmed</Tx>
    </Chip>
  ) : (
    <Chip dot="bg-warn">
      <Tx>Waiting for their yes</Tx>
    </Chip>
  );
}

/**
 * The interviews list's columns, one line a row: the candidate (pinned when
 * the table scrolls sideways), the day and the hours on the office's clock,
 * the role, who sits in it, where, how it stands, and the file. Server-safe,
 * like candidateColumns.
 */
export function interviewColumns<T>({
  read,
  href,
  clock = DEFAULT_CLOCK,
}: {
  read: (row: T) => InterviewRow;
  /** The candidate's file. */
  href: (row: T) => string;
  clock?: ClockSettings;
}): Column<T>[] {
  return [
    { header: "Candidate", className: "2xl:w-[16%]", cell: (row) => <span className="block truncate font-medium text-ink">{read(row).name}</span> },
    {
      header: "When",
      className: "whitespace-nowrap tabular-nums 2xl:w-[16%]",
      cell: (row) => {
        const r = read(row);
        const at = officeClock(r.startsAt, clock);
        const end = officeClock(r.endsAt, clock);
        return (
          <span>
            <Tx>{dayName(at.day, true)}</Tx> {shortDay(at.day, false)}
            <span className="ms-2 text-ink/60" dir="ltr">
              {hhmm(at.minutes)}–{hhmm(end.minutes)}
            </span>
          </span>
        );
      },
    },
    { header: "Role", priority: "medium", className: "2xl:w-[14%]", cell: (row) => <span className="block truncate text-ink/60">{read(row).role}</span> },
    { header: "With", priority: "medium", className: "2xl:w-[14%]", cell: (row) => <span className="block truncate">{read(row).withWhom || MUTED}</span> },
    { header: "Where", priority: "low", card: false, className: "2xl:w-[18%]", cell: (row) => <span className="block truncate text-ink/60">{read(row).where || MUTED}</span> },
    {
      header: "Standing",
      className: "whitespace-nowrap 2xl:w-[12%]",
      cell: (row) => {
        const r = read(row);
        return <InterviewChip confirmed={r.confirmed} over={r.over} />;
      },
    },
    {
      header: "Actions",
      className: "text-end",
      cell: (row) => (
        <Link href={href(row)} className={iconBtnClass(8, "ink")}>
          <Eye size={15} strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">
            <Tx>Open the file</Tx>
          </span>
        </Link>
      ),
    },
  ];
}
