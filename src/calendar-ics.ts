import { isTimed, type CalendarItem, type CalendarPerson } from "./calendar-layout";
import { addDays } from "./calendar-time";

// A calendar as an iCalendar file (RFC 5545), for the calendar on a person's
// phone: an iPhone, a Mac or Google Calendar subscribes to the link and reads
// it again every so often. Times go out in UTC, so every phone shows them in
// its own zone and the office never needs a time-zone block; all-day items go
// out as dates. Pure.

/** An item as the feed sends it: when it last changed, and the words for its description. */
export type FeedEvent = CalendarItem & {
  updatedAt: string;
  /** Who it is with: a company, a guest. */
  with?: (string | null | undefined)[];
  /** What it is for, at the end of the description. */
  notes?: string | null;
};

/** "2026-10-14T07:00:00.000Z" → "20261014T070000Z". */
function stamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** A TEXT value: backslash, semicolon, comma and line breaks escaped (RFC 5545 3.3.11). */
function text(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

const encoder = new TextEncoder();

/**
 * A content line folded at 75 octets (RFC 5545 3.1): each further piece on its
 * own line starting with a space. Cut between characters, never inside one, so
 * Arabic and accents survive.
 */
function fold(line: string): string {
  const pieces: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = pieces.length ? 74 : 75;
    if (size + bytes > limit) {
      pieces.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  pieces.push(current);
  return pieces.join("\r\n ");
}

const STATUS = { confirmed: "CONFIRMED", tentative: "TENTATIVE", cancelled: "CANCELLED" } as const;

export function calendarFile({
  name,
  prodId,
  uidDomain,
  tzName = "Asia/Qatar",
  linkFor,
  events,
  people = [],
  now,
}: {
  /** The calendar's name on the phone. */
  name: string;
  /** Who made the file, as RFC 5545 asks: "-//Company//Office calendar//EN". */
  prodId: string;
  /** The domain every event's UID ends in, so a phone knows an event again. */
  uidDomain: string;
  /** The zone the phone is told the calendar keeps (X-WR-TIMEZONE). */
  tzName?: string;
  /** The way back to an event in the panel. */
  linkFor?: (event: FeedEvent) => string | null;
  events: FeedEvent[];
  /** To name each event's people in its description. */
  people?: CalendarPerson[];
  now: Date;
}): string {
  const names = new Map(people.map((p) => [p.id, p.name]));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${prodId}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `NAME:${text(name)}`,
    `X-WR-CALNAME:${text(name)}`,
    `X-WR-TIMEZONE:${tzName}`,
    // Ask the phone to look again every hour (RFC 7986, and the older name).
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const e of events) {
    const withWho = (e.with ?? []).filter(Boolean).join(", ");
    const who = e.people.map((id) => names.get(id)).filter(Boolean).join(", ");
    const description = [
      withWho ? `With ${withWho}` : null,
      who ? `People: ${who}` : null,
      e.travelMinutes ? `${e.travelMinutes} min drive before` : null,
      e.notes ? `\n${e.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    const when = isTimed(e)
      ? [`DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end)}`]
      : // A date's end is the day after the last one (RFC 5545 3.6.1).
        [`DTSTART;VALUE=DATE:${e.day.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDays(e.endDay && e.endDay > e.day ? e.endDay : e.day, 1).replace(/-/g, "")}`];
    const link = linkFor?.(e);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@${uidDomain}`,
      `DTSTAMP:${stamp(now.toISOString())}`,
      `LAST-MODIFIED:${stamp(e.updatedAt)}`,
      ...when,
      `SUMMARY:${text(e.title)}`,
      ...(e.location ? [`LOCATION:${text(e.location)}`] : []),
      ...(description ? [`DESCRIPTION:${text(description)}`] : []),
      ...(e.status ? [`STATUS:${STATUS[e.status]}`] : []),
      ...(link ? [`URL:${link}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
