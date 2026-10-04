"use client";

import type { ComponentType } from "react";
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

export function HelpGuide({ sections, intro }: { sections: HelpSection[]; intro?: string }) {
  const { nav, can, t } = usePanel();
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
      <nav aria-label={t("Contents")} className="sticky top-0 hidden w-60 shrink-0 lg:block print:hidden">
        <div className={cn(PANEL_SHELL, "flex flex-col gap-0.5 p-2")}>
          <p className="px-3 pb-1.5 pt-2 text-[12px] font-semibold text-ink/50">{t("Contents")}</p>
          {shown.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-ink/70 transition-colors duration-150 hover:bg-ink/[0.04] hover:text-ink"
            >
              {section.Icon ? <section.Icon size={16} strokeWidth={1.9} aria-hidden /> : null}
              <span className="truncate">{t(section.title)}</span>
            </a>
          ))}
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
                <article
                  key={part.title}
                  className={cn(
                    "px-5 py-6 sm:px-7 print:break-inside-avoid",
                    part.shot && "@5xl:grid @5xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @5xl:items-start @5xl:gap-10",
                  )}
                >
                  {/* Steps, points and the tip share one left edge: each line
                      opens on a 24 px slot (the number, the dot, the mark). */}
                  <div className="flex min-w-0 max-w-3xl flex-col gap-3">
                    <h3 className="text-[14px] font-semibold text-ink">{t(part.title)}</h3>
                    {part.lead ? <p className="text-[13px] leading-relaxed text-ink/70">{t(part.lead)}</p> : null}
                    {part.steps?.length ? (
                      <ol className="flex flex-col gap-2">
                        {part.steps.map((step, i) => (
                          <li key={step} className="flex items-start gap-3 text-[13px] leading-relaxed text-ink/85">
                            <IndexTile className="size-6 rounded-md text-[11px]">{i + 1}</IndexTile>
                            <span className="pt-0.5">{t(step)}</span>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                    {part.points?.length ? (
                      <ul className="flex flex-col gap-2">
                        {part.points.map((point) => (
                          <li key={point} className="flex items-start gap-3 text-[13px] leading-relaxed text-ink/80">
                            <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center">
                              <span className="size-1.5 rounded-full bg-brand-deep/60" />
                            </span>
                            <span className="pt-0.5">{t(point)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {part.tip ? (
                      <p className="flex items-start gap-3 rounded-lg bg-ink/[0.03] py-2 pe-3 text-[13px] leading-relaxed text-ink/70">
                        <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center text-brand-deep">
                          <Info size={15} strokeWidth={2} />
                        </span>
                        <span className="pt-0.5">{t(part.tip)}</span>
                      </p>
                    ) : null}
                  </div>
                  {part.shot ? (
                    <figure className="mt-5 overflow-hidden rounded-xl border border-ink/10 bg-ground @5xl:mt-0">
                      {/* The panel as it looks, at its own size; the page
                          shrinks it to the column. A plain image: the app's
                          picture as it is, with no image service between. */}
                      <img
                        src={part.shot.src}
                        alt={t(part.shot.alt)}
                        width={part.shot.width}
                        height={part.shot.height}
                        loading="lazy"
                        decoding="async"
                        className="block h-auto w-full"
                      />
                    </figure>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
