"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";

// A room's views as words on a soft track, with a white pill that slides to
// the one open (Inception's calendar, tasks and front desk). Every tab is as
// wide as the widest, so the pill's slide is pure CSS. When the row is wider
// than the screen it scrolls: the hidden side fades out so the row reads as
// "there's more", and the open tab is brought into view.
//
// A tab is a link (a view that lives in the address) or, with onChange, a
// button. Switching is used many times a day, so the pill slides quickly and
// a person who asked for less motion sees it move at once.

export interface PillTab {
  key: string;
  label: string;
  /** The view's address; without one the tab is a button for onChange. */
  href?: string;
  /** A count beside the word; `alert` turns it into a filled badge. */
  count?: number;
  alert?: boolean;
}

const FADE = 24;

export function PillTabs({
  tabs,
  active,
  onChange,
  label,
  className,
}: {
  tabs: PillTab[];
  active: string;
  onChange?: (key: string) => void;
  /** What the row chooses, for a screen reader ("Whose tasks"). */
  label: string;
  className?: string;
}) {
  const t = usePanelT();
  const strip = useRef<HTMLDivElement>(null);
  const at = Math.max(0, tabs.findIndex((tab) => tab.key === active));
  // Which physical sides of the row still have tabs past them.
  const [edges, setEdges] = useState({ left: false, right: false });
  const measure = useCallback(() => {
    const box = strip.current;
    if (!box) return;
    // scrollLeft runs negative in a right-to-left row.
    const scrolled = Math.abs(box.scrollLeft);
    const room = box.scrollWidth - box.clientWidth;
    const start = scrolled > 1;
    const end = room - scrolled > 1;
    // The fade goes on the side that has more, whichever way the row reads.
    const rtl = getComputedStyle(box).direction === "rtl";
    const left = rtl ? end : start;
    const right = rtl ? start : end;
    setEdges((cur) => (cur.left === left && cur.right === right ? cur : { left, right }));
  }, []);
  useEffect(() => {
    const box = strip.current;
    if (!box) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [measure]);
  // The open tab, in view: a deep link to the last tab on a phone, or a tab
  // picked at the row's faded edge.
  useEffect(() => {
    const box = strip.current;
    const on = box?.querySelector<HTMLElement>("[data-on]");
    if (!box || !on) return;
    const a = box.getBoundingClientRect();
    const b = on.getBoundingClientRect();
    if (b.left < a.left + FADE || b.right > a.right - FADE) {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      box.scrollBy({ left: b.left + b.width / 2 - (a.left + a.width / 2), behavior: reduce ? "auto" : "smooth" });
    }
  }, [active]);

  const { left, right } = edges;
  const mask =
    left || right
      ? `linear-gradient(to right, ${left ? "transparent" : "black"}, black ${FADE}px, black calc(100% - ${FADE}px), ${right ? "transparent" : "black"})`
      : undefined;

  const item = cn(
    "relative inline-flex items-center justify-center gap-[7px] whitespace-nowrap rounded-[9px] px-4 text-[13px] font-semibold text-quiet outline-none transition-colors duration-150",
    "aria-[current=page]:text-ink aria-pressed:text-ink focus-visible:ring-2 focus-visible:ring-brand-deep/35",
  );

  return (
    <div
      ref={strip}
      onScroll={measure}
      className={cn("scrollbar-none min-w-0 max-w-full overflow-x-auto rounded-[12px]", className)}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <nav
        aria-label={t(label)}
        className="relative grid h-[38px] w-max auto-cols-fr grid-flow-col rounded-[12px] bg-ink/[0.06] p-[3px]"
      >
        {/* The pill: one tab wide, slid by its index — the right in English,
            the left in Arabic. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-[3px] start-[3px] rounded-[9px] bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.08),0_2px_8px_-2px_rgb(0_0_0/0.08)] transition-transform duration-200 ease-[var(--ease-drawer)] motion-reduce:transition-none"
          style={{
            width: `calc((100% - 6px) / ${tabs.length})`,
            transform: `translateX(calc(var(--kit-dir, 1) * 100% * ${at}))`,
          }}
        />
        {tabs.map((tab) => {
          const on = tab.key === active;
          const inner = (
            <>
              {t(tab.label)}
              {tab.count !== undefined && (tab.count > 0 || !tab.alert) ? (
                <span
                  className={cn(
                    "text-[12px] font-semibold tabular-nums",
                    tab.alert ? "min-w-[18px] rounded-full bg-brand-deep px-[5px] text-center leading-[18px] text-white" : "text-quiet",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </>
          );
          return tab.href ? (
            <Link key={tab.key} href={tab.href} scroll={false} aria-current={on ? "page" : undefined} data-on={on || undefined} className={item}>
              {inner}
            </Link>
          ) : (
            <button key={tab.key} type="button" aria-pressed={on} data-on={on || undefined} onClick={() => onChange?.(tab.key)} className={item}>
              {inner}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
