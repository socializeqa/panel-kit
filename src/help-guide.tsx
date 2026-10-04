"use client";

import { useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Info, Printer } from "lucide-react";
import { CTRL_BTN, PANEL_SHELL } from "./classes";
import { cn } from "./cn";
import { IconTile, IndexTile } from "./icon-tile";
import { usePanel } from "./panel-provider";

// The panel's own "how to use", for the people who run the business (X
// Capital, 4 Oct 2026: Damine wanted a guide in the panel and a README "so we
// know how it works"). The app writes the words as plain data, a section per
// room; the kit draws them the same way in every panel, shows each person only
// what their role can do, and prints them as the PDF a new hire is sent.
//
// A section tied to a room (`room: "/hiring"`) takes that room's name and icon
// from the rail and shows only to someone who can open it. Its anchor is the
// room's path without the slash ("hiring"), which is where the top bar's "?"
// on that room lands (PanelProvider `help`).

export type HelpShot = {
  /** A picture of the panel, from the app's public folder. */
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type HelpPart = {
  title: string;
  /** Shown only to someone who holds this capability. */
  cap?: string;
  lead?: string;
  /** What to do, in order. */
  steps?: string[];
  /** What to know, in no order. */
  points?: string[];
  shot?: HelpShot;
  /** One good-to-know line, set apart. */
  tip?: string;
};

export type HelpSection = {
  /** The anchor. A room's section is its path without the slash. */
  id: string;
  /** A room's own name when left out. */
  title?: string;
  /** A room's own icon when left out. */
  Icon?: ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
  /** The room this section explains: its name, icon and who may see it. */
  room?: string;
  /** For a section with no room: shown only to someone who holds it. */
  cap?: string;
  lead: string;
  parts: HelpPart[];
};

/**
 * A picture this much wider than tall is a list's rows: under the words and
 * across the part, until the card is wide enough (a 3072 px desk) to hold it
 * beside them at its own size like the others.
 */
const WIDE = 2;

/** A list this long, with nothing beside it, is split in two halves, one per column. */
const SPLIT = 4;

// Each line of a list opens on a 24 px slot (the number, the dot, the mark),
// so steps, points and the tip share one left edge.
const LINE = "flex items-start gap-3 text-[13px] leading-relaxed";

/** Steps, numbered from `from` + 1, so a list split over two columns keeps counting. */
function Steps({ steps, from = 0 }: { steps: string[]; from?: number }) {
  const { t } = usePanel();
  return (
    <ol start={from + 1} className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <li key={step} className={cn(LINE, "text-ink/85")}>
          <IndexTile className="size-6 rounded-md text-[11px]">{from + i + 1}</IndexTile>
          <span className="pt-0.5">{t(step)}</span>
        </li>
      ))}
    </ol>
  );
}

function Points({ points }: { points: string[] }) {
  const { t } = usePanel();
  return (
    <ul className="flex flex-col gap-2">
      {points.map((point) => (
        <li key={point} className={cn(LINE, "text-ink/80")}>
          <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center">
            <span className="size-1.5 rounded-full bg-brand-deep/60" />
          </span>
          <span className="pt-0.5">{t(point)}</span>
        </li>
      ))}
    </ul>
  );
}

function Tip({ tip, className }: { tip: string; className?: string }) {
  const { t } = usePanel();
  return (
    <p className={cn(LINE, "rounded-lg bg-ink/[0.03] py-2 pe-3 text-ink/70", className)}>
      <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center text-brand-deep">
        <Info size={15} strokeWidth={2} />
      </span>
      <span className="pt-0.5">{t(tip)}</span>
    </p>
  );
}

function Shot({ shot, className }: { shot: HelpShot; className?: string }) {
  const { t } = usePanel();
  return (
    // Never larger than it was taken, so the panel's type in it reads at the
    // panel's own size; smaller only when the column is narrower. A plain
    // image: the app's picture as it is, with no image service between.
    <figure style={{ maxWidth: shot.width }} className={cn("w-full overflow-hidden rounded-xl border border-ink/10 bg-ground", className)}>
      <img src={shot.src} alt={t(shot.alt)} width={shot.width} height={shot.height} loading="lazy" decoding="async" className="block h-auto w-full" />
    </figure>
  );
}

/**
 * One part of a section, on the guide's one grid (Damine, 4 Oct 2026: "not
 * professionally aligned"): its title across the top, then two columns, five
 * to seven, that start on the same line, and everything in the second column
 * starts on the same edge, part after part:
 *
 * - a picture stands there beside the words (a list's wide picture goes under
 *   them, across both, until the card is desk-wide);
 * - with no picture, what to know stands there beside the steps;
 * - a long list with nothing beside it is split, its second half there.
 *
 * On a narrow card everything simply follows down one column.
 */
function HelpArticle({ part }: { part: HelpPart }) {
  const { t } = usePanel();
  const { shot, steps = [], points = [], tip } = part;
  const wide = Boolean(shot && shot.width / shot.height > WIDE);
  const both = "@5xl:col-span-2";

  const words = (
    <div className="flex min-w-0 flex-col gap-3">
      {steps.length ? <Steps steps={steps} /> : null}
      {points.length ? <Points points={points} /> : null}
      {tip ? <Tip tip={tip} /> : null}
    </div>
  );

  let body: ReactNode;
  if (shot && !wide) {
    body = (
      <>
        {words}
        <Shot shot={shot} />
      </>
    );
  } else if (shot) {
    // Across the card under a narrower one; in two columns on a desk-wide one.
    const desk = "@min-[100rem]:col-span-1";
    body = (
      <>
        <div className={cn("min-w-0", both, desk)}>{words}</div>
        <Shot shot={shot} className={cn(both, desk)} />
      </>
    );
  } else if (steps.length && (points.length || tip)) {
    body = (
      <>
        <Steps steps={steps} />
        <div className="flex min-w-0 flex-col gap-3">
          {points.length ? <Points points={points} /> : null}
          {tip ? <Tip tip={tip} /> : null}
        </div>
      </>
    );
  } else {
    // One list: in two halves when it is long, so it fills the card's width
    // on the same two columns as every other part.
    const list = steps.length ? steps : points;
    const half = list.length >= SPLIT ? Math.ceil(list.length / 2) : list.length;
    const draw = (items: string[], from: number) => (steps.length ? <Steps steps={items} from={from} /> : <Points points={items} />);
    body = (
      <>
        {list.length ? draw(list.slice(0, half), 0) : null}
        {half < list.length ? draw(list.slice(half), half) : null}
        {tip ? <Tip tip={tip} className={both} /> : null}
      </>
    );
  }

  return (
    <article className="grid gap-x-12 gap-y-3 px-5 py-6 sm:px-7 @5xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] @5xl:items-start print:break-inside-avoid">
      <header className={cn("mb-1 flex min-w-0 flex-col gap-1.5", both)}>
        <h3 className="text-[14px] font-semibold text-ink">{t(part.title)}</h3>
        {part.lead ? <p className="max-w-3xl text-[13px] leading-relaxed text-ink/70">{t(part.lead)}</p> : null}
      </header>
      {body}
    </article>
  );
}

/** A room's anchor in the guide: "/hiring" and "/hiring/42" are "hiring". */
export function helpAnchor(roomHref: string): string {
  return roomHref.split("/").filter(Boolean)[0] ?? "";
}

/** Save or print the guide; the page prints without the panel around it. */
export function HelpPrintSeat() {
  const { t } = usePanel();
  const label = t("Print or save as PDF");
  return (
    <button type="button" onClick={() => window.print()} aria-label={label} title={label} className={CTRL_BTN}>
      <Printer aria-hidden="true" />
    </button>
  );
}

/**
 * The height of the panel's scrolling area, as it changes: the space the
 * contents card fills (the shell's main, under the top bar, whatever height
 * the bar takes on this page).
 */
function useScrollRoom() {
  const ref = useRef<HTMLElement>(null);
  const [room, setRoom] = useState<number | null>(null);
  useLayoutEffect(() => {
    const scroller = ref.current?.closest<HTMLElement>("#main-content");
    if (!scroller) return;
    const measure = () => setRoom(Math.floor(scroller.getBoundingClientRect().height));
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(scroller);
    return () => watch.disconnect();
  }, []);
  return { ref, room };
}

export function HelpGuide({ sections, intro }: { sections: HelpSection[]; intro?: string }) {
  const { nav, can, t } = usePanel();
  const { ref: contentsRef, room } = useScrollRoom();
  const rooms = nav.flatMap((group) => group.items);

  // Each section as this person sees it: a room's name and icon, and only
  // the parts their role can use. A section left with no parts goes.
  const shown = sections
    .map((section) => {
      const room = section.room ? rooms.find((item) => item.href === section.room) : undefined;
      const cap = room?.cap ?? section.cap;
      if (section.room && !room) return null;
      if (cap && !can(cap)) return null;
      const parts = section.parts.filter((part) => !part.cap || can(part.cap));
      if (!parts.length) return null;
      return { ...section, title: section.title ?? room?.label ?? section.id, Icon: section.Icon ?? room?.Icon, parts };
    })
    .filter((section) => section !== null);

  return (
    // The guide takes the whole width of the page (Damine, 4 Oct 2026: "must
    // be full width"). On a wide screen the contents stand in their own card
    // beside it, their top on the first section's top; each part puts its
    // picture beside its steps once the card is wide enough to hold both.
    <div className="flex w-full items-start gap-6 pb-10 print:block print:pb-0">
      {/* The contents card stands the full height of the screen and stays as
          the guide scrolls (Damine, 4 Oct 2026: "full height ... and centered
          vertically"): the same gap above and below it as the page's own, its
          word at the head and the rooms in the middle, like the rail's menu.
          The page's 20 px gap at both ends is the shell's content padding. */}
      <nav ref={contentsRef} aria-label={t("Contents")} className="sticky top-5 hidden w-60 shrink-0 lg:block print:hidden">
        <div style={room ? { height: room - 40 } : undefined} className={cn(PANEL_SHELL, "flex flex-col p-2")}>
          <p className="shrink-0 px-3 pb-1.5 pt-2 text-[12px] font-semibold text-ink/50">{t("Contents")}</p>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="my-auto flex flex-col gap-0.5">
              {shown.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-ink/70 transition-colors duration-150 hover:bg-ink/[0.04] hover:text-ink"
                >
                  {section.Icon ? <section.Icon size={16} strokeWidth={1.9} aria-hidden /> : null}
                  <span className="truncate">{t(section.title)}</span>
                </a>
              ))}
            </div>
          </div>
          {/* The head's twin, unseen, so the rooms sit in the card's true middle. */}
          <p aria-hidden className="invisible shrink-0 px-3 pb-1.5 pt-2 text-[12px] font-semibold">{t("Contents")}</p>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <nav aria-label={t("Contents")} className="flex flex-wrap gap-1.5 lg:hidden print:hidden">
          {shown.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-ink/10 bg-surface px-3 py-1 text-[12px] text-ink/70 transition-colors duration-150 hover:border-ink/25 hover:text-ink"
            >
              {t(section.title)}
            </a>
          ))}
        </nav>

        {intro ? <p className="max-w-3xl text-[14px] leading-relaxed text-ink/70">{t(intro)}</p> : null}

        {shown.map((section) => (
          <section key={section.id} id={section.id} className={cn(PANEL_SHELL, "@container overflow-hidden print:break-before-page print:shadow-none")}>
            <header className="flex items-center gap-4 border-b border-ink/[0.07] bg-ink/[0.015] px-5 py-5 sm:px-7">
              {section.Icon ? (
                <IconTile size="lg" tone="brand">
                  <section.Icon aria-hidden />
                </IconTile>
              ) : null}
              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold leading-tight text-ink">{t(section.title)}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-quiet">{t(section.lead)}</p>
              </div>
            </header>
            <div className="divide-y divide-ink/[0.06]">
              {section.parts.map((part) => (
                <HelpArticle key={part.title} part={part} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
