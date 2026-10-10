"use client";

import { useEffect, useRef } from "react";
import { lockAxis, SLOP, velocityOf, type Sample } from "./gesture";

// One thumb drag along one axis, for the kit's gestures: the drawer that
// slides away, the sheet that drops, the calendar that turns its days. Touch
// only: a mouse keeps clicking and selecting text as it always did.
//
// Touch events, not pointer events. A drawer's form scrolls in boxes of its
// own, and any scroll box hands a sideways pointer drag to the browser (a
// pointercancel) before the drawer hears it. A touchmove is still ours to
// keep at the moment the drag picks its axis — under the browser's own slop —
// so the drag claims a sideways move and leaves an upward one to the scroll.

export interface DragHandlers {
  axis: "x" | "y";
  /** Off while the thing can't be dragged (a closed drawer). */
  enabled?: boolean;
  /** The drag so far along the axis, px from where it took hold. */
  onMove: (delta: number) => void;
  /** Let go: how far, and how fast at the end (px per ms), signed. */
  onEnd: (delta: number, velocity: number) => void;
}

// A drag never starts on something that wants the touch itself: a field, a
// slider, a signature pad or map that opts out with data-no-swipe.
const OWN_TOUCH = "input, textarea, select, [contenteditable='true'], [data-no-swipe]";

/** Something between the touch and the dragged element scrolls along the
 *  drag's axis (a wide table, a strip of tabs): that one takes the touch. */
function scrollsAlong(from: Element, root: Element, axis: "x" | "y"): boolean {
  for (let el: Element | null = from; el && el !== root; el = el.parentElement) {
    const style = getComputedStyle(el);
    const overflow = axis === "x" ? style.overflowX : style.overflowY;
    if (!/(auto|scroll)/.test(overflow)) continue;
    const room = axis === "x" ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
    if (room > 1) return true;
  }
  return false;
}

/** `el` is the dragged element itself, held in state by its owner (a callback
 *  ref): a portal mounts it a beat after its owner, and the listeners follow. */
export function useDrag(el: HTMLElement | null, handlers: DragHandlers): void {
  // The latest handlers, read at event time, so the listeners bind once.
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });
  const enabled = handlers.enabled ?? true;

  useEffect(() => {
    if (!el || !enabled) return;
    let finger: number | null = null;
    let state: "idle" | "pending" | "dragging" = "idle";
    let startX = 0;
    let startY = 0;
    let delta = 0;
    let samples: Sample[] = [];

    const reset = () => {
      state = "idle";
      finger = null;
      samples = [];
      delta = 0;
    };
    const ours = (list: TouchList) => Array.from(list).find((t) => t.identifier === finger);

    const start = (e: TouchEvent) => {
      // One finger owns a drag; a second one landing mid-drag is ignored.
      if (state !== "idle" || e.touches.length !== 1) return;
      const touch = e.touches[0]!;
      const target = e.target as Element;
      if (target.closest(OWN_TOUCH) || scrollsAlong(target, el, latest.current.axis)) return;
      state = "pending";
      finger = touch.identifier;
      startX = touch.clientX;
      startY = touch.clientY;
    };
    const move = (e: TouchEvent) => {
      if (state === "idle") return;
      const touch = ours(e.touches);
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const { axis } = latest.current;
      if (state === "pending") {
        const picked = lockAxis(dx, dy);
        if (!picked) return;
        // The other way is the page's scroll: let it have the touch.
        if (picked !== axis) return reset();
        state = "dragging";
      }
      // Ours now: the page doesn't scroll or bounce under the drag.
      if (e.cancelable) e.preventDefault();
      const along = axis === "x" ? dx : dy;
      // Measured from where it took hold, so the thing doesn't jump the slop.
      delta = along - Math.sign(along) * SLOP;
      samples.push({ at: e.timeStamp, value: delta });
      if (samples.length > 12) samples.shift();
      latest.current.onMove(delta);
    };
    const end = (e: TouchEvent) => {
      if (state === "idle" || !ours(e.changedTouches)) return;
      if (state === "dragging") latest.current.onEnd(delta, velocityOf(samples));
      reset();
    };
    // The system took the touch (a call came in, the app switcher): the drag
    // goes back where it started.
    const cancel = (e: TouchEvent) => {
      if (state === "idle" || !ours(e.changedTouches)) return;
      if (state === "dragging") latest.current.onEnd(0, 0);
      reset();
    };

    el.addEventListener("touchstart", start, { passive: true });
    // Not passive: it has to be able to keep a sideways move from the page.
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", cancel);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", cancel);
    };
  }, [el, enabled]);
}
