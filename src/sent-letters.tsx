"use client";

import { History } from "lucide-react";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";
import { Section } from "./record-fields";

/** A letter already sent, as the story says it, with what became of it once the mail service has heard. */
export interface SentLetter {
  id: string;
  /** The line itself: "Emailed: Interview invitation". */
  line: string;
  /** When, as the app writes a day. */
  at: string;
  /** Who sent it, or the system's own name for a letter that went by itself. */
  by: string;
  /** Its fate in words ("Delivered", "Bounced"), once known. */
  fate?: string | null;
  /** A fate that went wrong (bounced, marked as spam) reads in the danger tone. */
  trouble?: boolean;
}

// What went to a candidate already, newest first, so the same letter is not
// sent twice and a bounce is seen. The fate comes worded from the app (it
// hears it from its mail service); the kit only shows it.
export function SentLetters({ sent, title = "Already sent" }: { sent: SentLetter[]; title?: string }) {
  const t = usePanelT();
  if (!sent.length) return null;
  return (
    <Section plain title={title} subtitle={sent.length === 1 ? t("1 email") : t("{n} emails", { n: sent.length })}>
      <ul className="flex flex-col">
        {sent.map((s) => (
          <li key={s.id} className="flex items-baseline justify-between gap-4 border-t border-ink/[0.07] py-2.5 first:border-t-0 first:pt-0 last:pb-0">
            <span className="flex min-w-0 items-baseline gap-2 text-[13px] text-ink">
              <History size={13} strokeWidth={2} aria-hidden="true" className="shrink-0 translate-y-0.5 text-ink/40" />
              <span className="truncate">{t(s.line)}</span>
            </span>
            <span className="shrink-0 text-[12px] text-quiet">
              {s.at} · {s.by}
              {s.fate ? <span className={cn(s.trouble && "text-danger")}> · {t(s.fate)}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
