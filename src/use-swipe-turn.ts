"use client";

import { useLayoutEffect, useRef } from "react";
import { commits } from "./gesture";
import { useDrag } from "./use-drag";

// Swipe sideways to turn the page — a calendar's day or month on a phone.
// The page follows the thumb; a flick or a drag past a quarter of the width
// turns it: the old page leaves the way the thumb pushed it, and when the new
// one arrives (its `page` key changes) it comes in from the other side, the
// way a book's next page does. A short drag settles back.
//
// "Next" is a swipe toward the start of the line: leftward in English,
// rightward in Arabic.

const SHIFT = 0.25;

const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const lineOf = (el: HTMLElement) => (getComputedStyle(el).direction === "rtl" ? -1 : 1);
function settle(el: HTMLElement) {
  el.style.transition = "transform 200ms var(--ease-drawer), opacity 200ms var(--ease-drawer)";
  el.style.transform = "";
  el.style.opacity = "";
}

export function useSwipeTurn(
  el: HTMLElement | null,
  {
    page,
    onTurn,
    enabled = true,
  }: {
    /** What is showing; when it changes after a turn, the new page slides in. */
    page: string;
    /** 1 for the next page, -1 for the one before. */
    onTurn: (dir: 1 | -1) => void;
    enabled?: boolean;
  },
): void {
  const pending = useRef<1 | -1 | null>(null);
  const fallback = useRef<number | undefined>(undefined);

  useDrag(el, {
    axis: "x",
    enabled,
    onMove: (delta) => {
      if (!el || still()) return;
      el.style.transition = "none";
      el.style.transform = `translateX(${delta}px)`;
    },
    onEnd: (delta, velocity) => {
      if (!el) return;
      const width = el.offsetWidth;
      if (!delta || !commits(Math.abs(delta), velocity * Math.sign(delta), width, SHIFT)) return settle(el);
      const dir: 1 | -1 = delta * lineOf(el) < 0 ? 1 : -1;
      pending.current = dir;
      el.style.transition = "transform 160ms var(--ease-drawer), opacity 160ms var(--ease-drawer)";
      el.style.transform = still() ? "" : `translateX(${Math.sign(delta) * width * SHIFT}px)`;
      el.style.opacity = "0";
      onTurn(dir);
      // A turn that never lands (offline, a slow server) gives the page back.
      window.clearTimeout(fallback.current);
      fallback.current = window.setTimeout(() => {
        pending.current = null;
        settle(el);
      }, 1200);
    },
  });

  // The new page arrived: in from the side the thumb pulled it from.
  useLayoutEffect(() => {
    if (!el || pending.current === null) return;
    const dir = pending.current;
    pending.current = null;
    window.clearTimeout(fallback.current);
    el.style.transition = "none";
    el.style.transform = still() ? "" : `translateX(${dir * lineOf(el) * el.offsetWidth * SHIFT}px)`;
    el.style.opacity = "0";
    // Commit the start before easing to rest.
    void el.offsetWidth;
    settle(el);
  }, [page, el]);
}
