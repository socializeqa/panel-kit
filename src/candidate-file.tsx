"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  FolderOpen,
  Hourglass,
  Languages,
  Mail,
  MailOpen,
  MessageCircle,
  Phone,
  ScanText,
  Send,
  StickyNote,
  UserPlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ActionResult } from "./action-result";
import { buttonClass, ROOM_COLUMN } from "./classes";
import { cn } from "./cn";
import { DeleteButton } from "./delete-button";
import { useDrawerDirty } from "./drawer";
import { DrawerTabs, type DrawerTab } from "./drawer-tabs";
import { EventTrail, type TrailEvent, type TrailGlyphs } from "./event-trail";
import { Button } from "./fields";
import { FitChip } from "./fit-chip";
import { Hint } from "./hint";
import { cutoffsOf, stageOf, walkOf, type HiringWords } from "./hiring-words";
import { NoteBox } from "./note-box";
import { usePanelT } from "./panel-provider";
import { HeaderLink, PdfHeaderActions } from "./pdf-link";
import { Section } from "./record-fields";
import { Segmented } from "./segmented";
import { StageChip } from "./stage-chip";
import { StageMover } from "./stage-mover";
import { StageWalk } from "./stage-walk";
import { StarRating } from "./star-rating";
import { useToast } from "./toast";

/** The candidate as the file reads them. Anything a panel asks beyond these comes in as `facts`. */
export interface FileCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** A WhatsApp number when it differs from the phone. */
  whatsapp?: string | null;
  stage: string;
  rating: number | null;
  /** The AI reader's score out of 100, null until it has read the file. */
  fitScore: number | null;
  /** The reader's why, in a sentence or two. */
  fitVerdict?: string | null;
  /** Their answers to the opening's questions, each with the question as asked. */
  answers?: { prompt: string; answer: string }[];
  /** A note they wrote with the application. */
  coverNote?: string | null;
  /** The one notes box an older file had, kept as its first note. */
  earlierNote?: string | null;
}

/** One of the office's notes on a candidate: who wrote it and when, as the app writes a day. */
export interface FileNote {
  id: string;
  body: string;
  by?: string | null;
  when: string;
}

/** One fact on the details grid; the value may be anything (a flag and a name, a chip). */
export interface FileFact {
  label: string;
  value: React.ReactNode;
}

/** The papers they sent: the CV's address, and a portfolio as a file or a link. */
export interface FilePapers {
  cv?: string | null;
  /** `file`: a document they attached (it opens as a paper); otherwise a link they gave. */
  portfolio?: { href: string; label: string; file?: boolean } | null;
}

/** The language their letters go out in, and the ones it can switch to. */
export interface FileLanguage {
  value: string;
  options: { value: string; label: string }[];
  /** Switching saves at once; left out, the language only shows. */
  onChange?: (value: string) => Promise<ActionResult>;
}

// The story's glyphs for the families a hiring story keeps. A line of another
// family gets the trail's plain glyph, or its own `icon`.
const STORY_GLYPHS: TrailGlyphs = [
  [/^applied/, UserPlus],
  [/^stage/, ArrowRight],
  [/^email|^letter/, Send],
  [/^note/, StickyNote],
  [/^read/, ScanText],
  [/^language/, Languages],
];

const glyph = (Icon: LucideIcon) => <Icon size={15} strokeWidth={2} aria-hidden="true" />;
const PAPER_LINK = "inline-flex min-w-0 items-center gap-1.5 underline-offset-4 transition-colors duration-150 hover:text-brand-deep hover:underline";
// A hairline between the notes and between the answers, none above the first.
const LINE = "border-t border-ink/[0.07] py-3 first:border-t-0 first:pt-0";

/** One fact on the grid: a small label, the value under it on one line. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  const t = usePanelT();
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-quiet">{t(label)}</dt>
      <dd className="mt-0.5 flex min-w-0 items-center gap-2 text-[14px] font-medium text-ink">{children}</dd>
    </div>
  );
}

function Quiet({ children }: { children: string }) {
  const t = usePanelT();
  return <span className="text-[12px] font-medium text-quiet">{t(children)}</span>;
}

// One candidate, read top to bottom in one calm column: where they stand with
// the next step, every fact on one grid with the doors to reach them full
// width, the AI reader's score and why, their answers, and the office's read.
// Each card wears a small grey title and nothing else, so the page reads as
// one. Their letters and their story are rooms of their own under the header;
// delete folds behind it. Nothing here waits for a Save: a move, a rating, a
// note and the letters' language each keep themselves the moment they are
// made, through the app's callbacks.
export function CandidateFile({
  words,
  candidate: c,
  sub,
  facts = [],
  papers,
  notes = [],
  story = [],
  letters,
  headerActions,
  language,
  canManage,
  onMove,
  onRate,
  onAddNote,
  remove,
}: {
  words: HiringWords;
  candidate: FileCandidate;
  /** The line under the name: "Office Manager · applied 4 Oct". */
  sub?: string;
  /** The panel's own facts, after Email and Phone: nationality, age, where they came from. */
  facts?: FileFact[];
  /** Their CV and portfolio: a fact each on the grid, and seats in the header. */
  papers?: FilePapers;
  /** The office's notes, oldest first. */
  notes?: FileNote[];
  /** Their story, newest first. */
  story?: TrailEvent[];
  /** The letters room (a LetterComposer); no room when left out. */
  letters?: React.ReactNode;
  /** More seats in the header, before delete. */
  headerActions?: React.ReactNode;
  language?: FileLanguage;
  /** May move, rate, note and switch the language. */
  canManage: boolean;
  onMove: (to: string, reason?: string) => Promise<ActionResult>;
  /** 0 clears the rating. */
  onRate: (stars: number) => Promise<ActionResult>;
  onAddNote: (body: string) => Promise<ActionResult>;
  /** Delete, when this person may and this file may go (a panel keeps a hire's file). */
  remove?: { action: (formData: FormData) => void | Promise<void | ActionResult>; afterHref?: string };
}) {
  const t = usePanelT();
  const router = useRouter();
  const toast = useToast();
  const { markClean } = useDrawerDirty();
  const [rating, setRating] = useState(c.rating ?? 0);
  const [note, setNote] = useState("");
  const [saving, startSave] = useTransition();
  const [locale, setLocale] = useState(language?.value ?? "");
  const [switching, startSwitch] = useTransition();
  const stage = stageOf(words, c.stage).value;
  const { steps, exit } = walkOf(words);
  const whatsapp = (c.whatsapp || c.phone).replace(/\D/g, "");
  const portfolio = papers?.portfolio ?? null;
  const [possible, strong] = cutoffsOf(words);

  // The rating keeps itself on the star; pressing the one already lit clears it.
  const rate = (n: number) => {
    const next = n === rating ? 0 : n;
    const was = rating;
    setRating(next);
    startSave(async () => {
      const res = await onRate(next);
      if (!res.ok) {
        setRating(was);
        toast(res.error, "error");
        return;
      }
      router.refresh();
    });
  };

  const keepNote = () =>
    startSave(async () => {
      const res = await onAddNote(note.trim());
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      setNote("");
      // The note box was the only unsaved work in the file, and it is kept now.
      markClean();
      router.refresh();
    });

  const switchLanguage = (next: string) => {
    const change = language?.onChange;
    if (!change) return;
    const was = locale;
    setLocale(next);
    startSwitch(async () => {
      const res = await change(next);
      if (!res.ok) {
        setLocale(was);
        toast(res.error, "error");
        return;
      }
      router.refresh();
    });
  };

  const door = (href: string, label: string, Icon: LucideIcon) => (
    <a
      key={label}
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className={cn(buttonClass({ variant: "ghost", size: "md" }), "w-full justify-center")}
    >
      <Icon size={15} strokeWidth={2} aria-hidden="true" /> {t(label)}
    </a>
  );

  const languageSeat = language?.options.length ? (
    // Many languages are wider than a phone: there the switch slides sideways.
    <span className="flex min-w-0 max-w-full items-center gap-2.5">
      <span className="shrink-0 whitespace-nowrap text-[11px] text-quiet">{t("Letters in")}</span>
      {canManage && language.onChange ? (
        <span className="min-w-0 overflow-x-auto [scrollbar-width:none]">
          <Segmented value={locale} onChange={(next) => !switching && next !== locale && switchLanguage(next)} options={language.options} />
        </span>
      ) : (
        <span className="text-[12px] font-medium text-ink">{t(language.options.find((o) => o.value === locale)?.label ?? locale)}</span>
      )}
    </span>
  ) : undefined;

  const file = (
    <div className={ROOM_COLUMN}>
      <Section plain title="Where they stand" subtitle={canManage ? "Press a stage to move them" : undefined}>
        {canManage ? (
          <StageMover words={words} stage={stage} name={c.name} onMove={onMove} />
        ) : (
          <StageWalk steps={steps} current={stage} exit={exit} />
        )}
      </Section>

      <Section plain title="Details" action={languageSeat}>
        {/* Three facts a row on one grid; a hairline between the rows, none above the first. */}
        <dl className="grid gap-x-6 sm:grid-cols-3 [&>div]:border-t [&>div]:border-ink/[0.07] [&>div]:py-3 [&>div:first-child]:border-t-0 [&>div:first-child]:pt-0 sm:[&>div:nth-child(-n+3)]:border-t-0 sm:[&>div:nth-child(-n+3)]:pt-0">
          <Fact label="Email">
            <span dir="ltr" className="truncate">
              {c.email}
            </span>
          </Fact>
          <Fact label="Phone">
            <span dir="ltr" className="truncate">
              {c.phone}
            </span>
          </Fact>
          {facts.map((f) => (
            <Fact key={f.label} label={f.label}>
              {f.value ?? <Quiet>Not given</Quiet>}
            </Fact>
          ))}
          {papers ? (
            <Fact label="CV">
              {papers.cv ? (
                <a href={papers.cv} target="_blank" rel="noreferrer" className={PAPER_LINK}>
                  <FileText size={14} strokeWidth={2} aria-hidden="true" /> {t("Open the CV")}
                </a>
              ) : (
                <Quiet>None attached</Quiet>
              )}
            </Fact>
          ) : null}
          {papers ? (
            <Fact label="Portfolio">
              {portfolio ? (
                <a href={portfolio.href} target="_blank" rel="noreferrer" className={PAPER_LINK}>
                  {portfolio.file ? (
                    <FolderOpen size={14} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
                  )}
                  <span className="truncate">{t(portfolio.label)}</span>
                </a>
              ) : (
                <Quiet>None</Quiet>
              )}
            </Fact>
          ) : null}
        </dl>
        <div className="grid grid-cols-3 gap-2 border-t border-ink/[0.07] pt-4">
          {door(`mailto:${c.email}`, "Email", Mail)}
          {door(`tel:${c.phone.replace(/\s/g, "")}`, "Call", Phone)}
          {door(`https://wa.me/${whatsapp}`, "WhatsApp", MessageCircle)}
        </div>
      </Section>

      <Section plain title="The AI reader" subtitle={c.fitScore === null ? "It has not read this one" : "Read from the CV and the answers"}>
        {c.fitScore === null ? (
          <p className="text-[13px] text-quiet">{t("No score yet.")}</p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <p className="shrink-0 text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
                {c.fitScore}
                <span className="ms-0.5 text-[13px] font-medium tracking-normal text-quiet">/100</span>
              </p>
              {/* The bar, with a hairline at the two cut-offs where "possible" and "strong" begin. */}
              <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ink/[0.07]">
                <span className="absolute inset-y-0 start-0 rounded-full bg-ink" style={{ width: `${Math.min(100, Math.max(0, c.fitScore))}%` }} />
                <span className="absolute inset-y-0 w-px bg-surface" style={{ insetInlineStart: `${possible}%` }} />
                <span className="absolute inset-y-0 w-px bg-surface" style={{ insetInlineStart: `${strong}%` }} />
              </div>
              <FitChip score={c.fitScore} words={words} withScore={false} />
            </div>
            {c.fitVerdict ? <p className="text-pretty text-[13px] leading-relaxed text-ink/80">{c.fitVerdict}</p> : null}
          </>
        )}
      </Section>

      {c.answers?.length || c.coverNote ? (
        <Section plain title="Their answers">
          {c.answers?.length ? (
            <div className="flex flex-col">
              {c.answers.map((a, i) => (
                <div key={i} className={cn(LINE, "flex items-baseline justify-between gap-6 last:pb-0")}>
                  <span className="min-w-0 text-[13px] text-ink/70">{a.prompt}</span>
                  <span className="max-w-[55%] shrink-0 whitespace-pre-line text-end text-[14px] font-semibold text-ink">{a.answer || "—"}</span>
                </div>
              ))}
            </div>
          ) : null}
          {c.coverNote ? (
            <div className={cn(c.answers?.length && "border-t border-ink/[0.07] pt-3")}>
              <p className="text-[11px] font-medium text-quiet">{t("A note from them")}</p>
              <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink/80">{c.coverNote}</p>
            </div>
          ) : null}
        </Section>
      ) : null}

      <Section plain title="Our read" subtitle="Only the team sees this">
        <StarRating value={rating} readOnly={!canManage || saving} onChange={canManage ? rate : undefined} />
        {c.earlierNote || notes.length ? (
          <ul className="flex flex-col">
            {c.earlierNote ? (
              <li className={LINE}>
                <p className="text-[11px] font-medium text-quiet">{t("An earlier note")}</p>
                <p className="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-ink">{c.earlierNote}</p>
              </li>
            ) : null}
            {notes.map((n) => (
              <li key={n.id} className={LINE}>
                <p className="text-[11px] font-medium text-quiet">
                  {n.by ?? t("The office")} · {n.when}
                </p>
                <p className="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-ink">{n.body}</p>
              </li>
            ))}
          </ul>
        ) : null}
        {canManage ? (
          <div className="flex flex-col gap-2">
            <NoteBox
              id={`note-${c.id}`}
              name="note"
              rows={3}
              value={note}
              placeholder={t("How the interview went, what was agreed, when they can start")}
              onChange={setNote}
            />
            <div className="flex items-center justify-between gap-3">
              <Hint>A reason given when moving them lands in their story, dated.</Hint>
              <Button type="button" size="sm" onClick={keepNote} disabled={saving || !note.trim()}>
                {t("Add note")}
              </Button>
            </div>
          </div>
        ) : null}
      </Section>
    </div>
  );

  const tabs: DrawerTab[] = [
    { key: "file", label: "Candidate", icon: glyph(UserRound), content: file },
    ...(letters ? [{ key: "letters", label: "Letters", icon: glyph(MailOpen), content: letters }] : []),
    {
      key: "story",
      label: "Story",
      icon: glyph(Hourglass),
      count: story.length,
      content: (
        <div className={ROOM_COLUMN}>
          {story.length ? (
            <EventTrail eyebrow="Their story" events={story} glyphs={STORY_GLYPHS} />
          ) : (
            <p className="text-[13px] text-quiet">{t("Nothing has happened on this file yet.")}</p>
          )}
        </div>
      ),
    },
  ];

  return (
    <DrawerTabs
      under
      title={c.name}
      sub={sub}
      badge={<StageChip stage={stage} words={words} />}
      actions={
        <>
          {papers?.cv ? <PdfHeaderActions href={papers.cv} label="CV" /> : null}
          {portfolio ? (
            <HeaderLink href={portfolio.href} label="Open the portfolio">
              <FolderOpen aria-hidden="true" />
            </HeaderLink>
          ) : null}
          {headerActions}
          {remove ? (
            <DeleteButton
              menu
              id={c.id}
              action={remove.action}
              afterHref={remove.afterHref}
              label="Delete candidate"
              title={t("Delete {name}?", { name: c.name })}
              body="They leave the list, and what they sent, their papers and our notes on them are erased for good. Use it when someone asks to be forgotten, or for a duplicate. Let them go instead to keep the file."
              reason={{ label: "Why?", placeholder: "Applied twice, spam, asked to be removed", required: false }}
              confirmLabel="Delete candidate"
            />
          ) : null}
        </>
      }
      initial="file"
      tabs={tabs}
    />
  );
}
