"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { X } from "lucide-react";
import { iconBtnClass, PANEL_SHELL } from "./classes";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";

// The panel-wide feedback channel. Mounted once around the Shell, so any
// client component can announce an outcome ("Stage updated", "Could not
// save") without owning its own status UI. The viewport is a live region, so
// a screen reader hears what a sighted person sees.
//
// "info" (Señorritas) is news rather than an outcome — a booking that arrived
// on its own over the live feed — so it wears the info dot, not success.
type Variant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: Variant;
  leaving: boolean;
}

type ToastFn = (message: string, variant?: Variant) => void;

const ToastContext = createContext<ToastFn | null>(null);

// A no-op outside the provider, so a shared piece can call it wherever it is
// rendered.
export function useToast(): ToastFn {
  return useContext(ToastContext) ?? (() => {});
}

// How long the fade out takes, and the safety net if transitionend never
// comes (a tab in the background runs no transitions).
const LEAVE_MS = 150;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const t = usePanelT();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((item) => item.id !== id));
  }, []);

  // A toast fades out before it leaves the list; appearing and vanishing with
  // no transition reads as a glitch.
  const dismiss = useCallback(
    (id: number) => {
      setToasts((list) => list.map((item) => (item.id === id ? { ...item, leaving: true } : item)));
      window.setTimeout(remove, LEAVE_MS + 50, id);
    },
    [remove],
  );

  const toast = useCallback<ToastFn>(
    (message, variant = "success") => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, message, variant, leaving: false }]);
      // Errors linger a little longer; both clear on their own, so the stack
      // never asks for housekeeping.
      window.setTimeout(dismiss, variant === "error" ? 6500 : 4000, id);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* z-[80]: above drawers (z-50/60) and confirm dialogs (z-70). */}
      <div
        role="status"
        aria-live="polite"
        className="kit pointer-events-none fixed bottom-4 end-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col items-end gap-2"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            onTransitionEnd={(e) => {
              if (item.leaving && e.propertyName === "opacity") remove(item.id);
            }}
            className={cn(
              PANEL_SHELL,
              // A transition, not a keyframe: toasts arrive in bursts, and a
              // transition picks up from wherever the last one left off. It
              // rises 6px from its @starting-style; with less motion asked
              // for, it only fades.
              "pointer-events-auto flex w-full items-start gap-2.5 px-3.5 py-2.5 shadow-menu transition-[opacity,translate] duration-200 ease-out starting:opacity-0 motion-safe:starting:translate-y-1.5",
              item.leaving && "opacity-0 duration-150",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-[7px] size-1.5 shrink-0 rounded-full",
                item.variant === "error" ? "bg-danger" : item.variant === "info" ? "bg-info" : "bg-ok",
              )}
            />
            <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink">{t(item.message)}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label={t("Dismiss")}
              className={cn(iconBtnClass(7, "ink"), "shrink-0")}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
