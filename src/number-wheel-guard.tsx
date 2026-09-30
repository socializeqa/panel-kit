"use client";

import { useEffect } from "react";

// The mouse wheel must never change a number. The browser only spins a number
// input that is FOCUSED and under the pointer, so the guard's whole job is
// deciding exactly that case.
interface ActiveLike {
  tagName?: string;
  type?: string;
  // Method syntax on purpose: it type-checks bivariantly, so the DOM's own
  // HTMLElement.contains(Node) satisfies it without a cast.
  contains?(target: unknown): boolean;
}

export function shouldBlurNumberInput(active: ActiveLike | null | undefined, target: unknown): boolean {
  if (!active || active.tagName !== "INPUT" || active.type !== "number") return false;
  if (active === target) return true;
  return typeof active.contains === "function" && active.contains(target);
}

/**
 * One listener for the whole panel: when the wheel turns over a focused number
 * field, the field blurs and the wheel scrolls the page — a price only ever
 * changes because someone typed it (Elite Touch, dev request 20236b10).
 * Document-level on purpose: it covers every number input in the panel,
 * shared or raw, including ones written after today.
 */
export function NumberWheelGuard() {
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      const active = document.activeElement as HTMLInputElement | null;
      if (shouldBlurNumberInput(active, event.target)) active?.blur();
    };
    // Passive: nothing here calls preventDefault — blurring is what stops the spin.
    document.addEventListener("wheel", onWheel, { capture: true, passive: true });
    return () => document.removeEventListener("wheel", onWheel, { capture: true });
  }, []);
  return null;
}
