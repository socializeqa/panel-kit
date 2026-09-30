"use client";

import { useEffect, useRef } from "react";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";

const MIN_H = 56;
const MAX_H = 800;
const BORDER = 2; // fieldBox draws 1px top + bottom; scrollHeight leaves it out.

// One remembered height per field, keyed by the field's id or name (or an
// explicit storageKey when the automatic one would be wrong — a row whose
// name carries a per-row id would litter storage with dead keys).
function storageKeyFor(explicit: string | undefined, area: HTMLTextAreaElement | undefined) {
  const key = explicit ?? area?.id ?? area?.name;
  return key ? `panel-writing-h:${key}` : null;
}

/**
 * The panel's one writing-area behaviour (Elite Touch, 24 Aug 2026):
 *
 * - Every box STARTS at the minimum height and grows on its own to fit the
 *   paragraph as text arrives — typed, pasted, or written in by a model.
 * - A small grip inside the field's bottom corner drags a bigger (or smaller)
 *   floor; the chosen floor is remembered (localStorage) and restored the
 *   next time the form opens. Content still wins: the box never shrinks
 *   below what's written in it.
 * - ALL textareas inside move together, so a fused NoteBox pair stays one
 *   height.
 *
 * The grip changes colour on hover and nothing else (Elite Touch eased it on
 * `transition-all` with a hover grow — the house moves only transform and
 * opacity, and never on a hover a phone would fire by tapping).
 */
export function GrabResize({
  storageKey,
  className,
  children,
}: {
  /** Override the remembered-height key (defaults to the first textarea's id or name). */
  storageKey?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const t = usePanelT();
  const boxRef = useRef<HTMLDivElement>(null);
  // The floor the person chose by dragging; content grows past it freely.
  const floor = useRef(MIN_H);
  const drag = useRef<{ startY: number; startFloor: number; contentMax: number; moved: boolean } | null>(null);
  // What the text was at the last fit. Measuring forces a reflow, so fit()
  // does nothing unless the text changed — without this gate every keystroke
  // re-measured EVERY writing box on the page.
  const lastFit = useRef<string | null>(null);

  const areasOf = () => Array.from(boxRef.current?.querySelectorAll("textarea") ?? []);

  const contentHeightOf = (area: HTMLTextAreaElement) => {
    const prev = area.style.height;
    area.style.height = "0";
    const h = area.scrollHeight + BORDER;
    area.style.height = prev;
    return h;
  };

  // height = max(chosen floor, tallest paragraph), clamped — applied to every
  // area so pairs stay level. Skips when nothing changed, or when the box is
  // folded away (a hidden textarea measures 0; the cache stays clear so the
  // first visible render fits for real).
  const fit = () => {
    const areas = areasOf();
    const first = areas[0];
    if (!first) return;
    if (!first.offsetParent) {
      lastFit.current = null;
      return;
    }
    const text = areas.map((a) => a.value).join("\u0000");
    if (text === lastFit.current) return;
    lastFit.current = text;
    const target = Math.min(MAX_H, Math.max(floor.current, ...areas.map(contentHeightOf)));
    for (const area of areas) area.style.height = `${target}px`;
  };

  useEffect(() => {
    const areas = areasOf();
    const key = storageKeyFor(storageKey, areas[0]);
    if (key) {
      try {
        const saved = Number(localStorage.getItem(key));
        if (saved >= MIN_H && saved <= MAX_H) floor.current = saved;
      } catch {
        // Storage unavailable (private mode): resizing still works, just unremembered.
      }
    }
    fit();
    // Typing into an uncontrolled field re-renders nothing — listen directly.
    const onInput = () => fit();
    for (const area of areas) area.addEventListener("input", onInput);
    return () => {
      for (const area of areas) area.removeEventListener("input", onInput);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // A controlled field filled in code fires no input event — it re-renders
  // us instead, so try a fit after every render. The text gate makes this
  // one string read per box when nothing changed.
  useEffect(() => {
    fit();
  });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const areas = areasOf();
    const first = areas[0];
    if (!first) return;
    drag.current = {
      startY: e.clientY,
      startFloor: first.offsetHeight,
      // Measure the paragraph once at grab time, not on every move.
      contentMax: Math.max(...areas.map(contentHeightOf)),
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current.moved = true;
    floor.current = Math.min(MAX_H, Math.max(MIN_H, drag.current.startFloor + (e.clientY - drag.current.startY)));
    const target = Math.min(MAX_H, Math.max(floor.current, drag.current.contentMax));
    for (const area of areasOf()) area.style.height = `${target}px`;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const moved = drag.current?.moved;
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!moved) return;
    const key = storageKeyFor(storageKey, areasOf()[0]);
    if (!key) return;
    try {
      localStorage.setItem(key, String(floor.current));
    } catch {
      // Best effort only.
    }
  };

  return (
    // `[&_textarea]:block` kills the inline descender gap under a textarea —
    // without it the wrapper runs a few px taller than the field and the grip
    // lands on the border instead of inside the box.
    <div ref={boxRef} className={cn("relative min-w-0 [&_textarea]:block", className)}>
      {children}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={t("Drag to resize the writing area")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="group/grab absolute bottom-px end-px grid size-6 cursor-ns-resize touch-none place-items-center"
      >
        {/* The classic diagonal corner grip, hugging the inside of the box. */}
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className="size-3 text-brand-deep/60 transition-colors group-hover/grab:text-brand-deep rtl:-scale-x-100"
        >
          <path d="M10.5 4.5l-6 6M10.5 8.5l-2 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="pointer-events-none absolute bottom-full end-1 mb-1 translate-y-0.5 whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-medium text-surface opacity-0 transition-[translate,opacity] duration-150 ease-out group-hover/grab:opacity-100 fine:group-hover/grab:translate-y-0">
          {t("Drag to resize")}
        </span>
      </div>
    </div>
  );
}
