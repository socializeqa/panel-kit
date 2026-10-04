"use client";

import type { ComponentType } from "react";
import { Printer } from "lucide-react";
import { CTRL_BTN, PANEL_SHELL } from "./classes";
import { cn } from "./cn";
import { Hint } from "./hint";
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
    <div className="mx-auto flex w-full max-w-5xl gap-8 pb-10 print:block print:max-w-none print:pb-0">
      {/* The contents: a column that stays put on a wide screen, a row of
          words above the guide on a narrow one, gone on paper. */}
      <nav aria-label={t("Contents")} className="hidden w-52 shrink-0 lg:block print:hidden">
        <div className="sticky top-0 flex flex-col gap-0.5 pt-1">
          <p className="px-2.5 pb-1.5 text-[12px] font-semibold text-ink/50">{t("Contents")}</p>
          {shown.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-ink/70 transition-colors duration-150 hover:bg-ink/[0.04] hover:text-ink"
            >
              {section.Icon ? <section.Icon size={15} strokeWidth={1.9} aria-hidden /> : null}
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

        {intro ? <p className="max-w-2xl text-[14px] leading-relaxed text-ink/70">{t(intro)}</p> : null}

        {shown.map((section) => (
          <section key={section.id} id={section.id} className={cn(PANEL_SHELL, "overflow-hidden print:break-before-page print:shadow-none")}>
            <header className="flex items-start gap-3.5 border-b border-ink/[0.07] bg-ink/[0.015] px-5 py-4 sm:px-6">
              {section.Icon ? (
                <IconTile size="md" tone="brand">
                  <section.Icon aria-hidden />
                </IconTile>
              ) : null}
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold leading-tight text-ink">{t(section.title)}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-quiet">{t(section.lead)}</p>
              </div>
            </header>
            <div className="divide-y divide-ink/[0.06]">
              {section.parts.map((part) => (
                <article key={part.title} className="flex flex-col gap-3 px-5 py-5 sm:px-6 print:break-inside-avoid">
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
                    <ul className="flex flex-col gap-1.5">
                      {part.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-[13px] leading-relaxed text-ink/80">
                          <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-deep/60" />
                          <span>{t(point)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {part.shot ? (
                    <figure className="overflow-hidden rounded-xl border border-ink/10 bg-ground">
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
                  {part.tip ? <Hint tone="info">{t(part.tip)}</Hint> : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
