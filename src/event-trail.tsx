import { ClipboardList, type LucideIcon } from "lucide-react";
import { FootLog, LogRow, LogWhen, LogWho, type LogTone } from "./foot-log";
import { tx } from "./tx";

// A record's story in the kit's log grammar (FootLog): one line per thing that
// happened, a glyph for its family, who and when on the rail at the end. Every
// record that keeps a story (a candidate, a job, a booking) wears this shape,
// so a move looks the same wherever it is shown. The words and the day come
// from the app already written; the kit formats no dates of its own.
// No "use client": a server page can hand its trail straight in.

export interface TrailEvent {
  id: string;
  /** The family the line belongs to ("stage", "email"), which picks its glyph. */
  kind: string;
  /** What happened, said out loud: "Moved to Interview". */
  summary: string;
  /** When, as the app writes a day: "4 Oct 2026". */
  when: string;
  /** Who did it: a person, the customer, or the system's own name. */
  by: string;
  /** The customer's own moves read in the ok tone, so they stand out of a staff-heavy story. */
  byKind?: "staff" | "customer" | "system";
  /** A glyph for this one line, over the one its kind would get. */
  icon?: React.ReactNode;
}

/** A glyph for each family of line: the first pattern that matches a line's kind wins. */
export type TrailGlyphs = [RegExp, LucideIcon][];

function glyphFor(kind: string, glyphs: TrailGlyphs): React.ReactNode {
  const Icon = glyphs.find(([pattern]) => pattern.test(kind))?.[1] ?? ClipboardList;
  return <Icon size={13} strokeWidth={2} aria-hidden="true" />;
}

const tone = (e: TrailEvent): LogTone => (e.byKind === "customer" ? "customer" : "quiet");

export function EventTrail({
  eyebrow,
  events,
  glyphs = [],
  preview,
  className,
}: {
  eyebrow: string;
  /** Newest first: the trail folds away the oldest lines, never the latest. */
  events: TrailEvent[];
  glyphs?: TrailGlyphs;
  /** How many lines show before "show all"; FootLog's own four when left out. */
  preview?: number;
  className?: string;
}) {
  if (!events.length) return null;
  return (
    <FootLog
      eyebrow={eyebrow}
      preview={preview}
      className={className}
      rows={events.map((e) => (
        <LogRow
          key={e.id}
          icon={e.icon ?? glyphFor(e.kind, glyphs)}
          tone={tone(e)}
          right={
            <>
              <LogWho tone={e.byKind ?? "staff"}>{e.by}</LogWho>
              <LogWhen>{e.when}</LogWhen>
            </>
          }
        >
          <span className="truncate text-[12px] text-ink/80">{tx(e.summary)}</span>
        </LogRow>
      ))}
    />
  );
}
