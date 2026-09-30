"use client";

import { Moon, SunMedium } from "lucide-react";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";

/**
 * The panel's light switch — Socialize's icon-only two-stop slider, built to
 * sit in the rail's foot. The thumb glides under the mood you're in.
 *
 * Controlled, so the kit needs no theme library: the app owns the choice
 * (next-themes, a cookie) and hands it to PanelProvider `lights`; the Shell
 * seats this switch only then. Dark mode is opt-in per app.
 */
export function LightsToggle({ dark, onChange, className }: { dark: boolean; onChange: (dark: boolean) => void; className?: string }) {
  const t = usePanelT();
  return (
    <button
      type="button"
      onClick={() => onChange(!dark)}
      aria-label={dark ? t("Turn the lights on") : t("Turn the lights off")}
      aria-pressed={dark}
      className={cn(
        "group relative block h-8 w-16 shrink-0 rounded-lg bg-on-rail/[0.06] p-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rail-accent",
        className,
      )}
    >
      {/* The thumb moves on transform alone, and --kit-dir turns it round in
          Arabic. Socialize's glided for 300ms; the house ceiling is under. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 start-1 w-[calc(50%-4px)] rounded-md bg-rail-accent transition-transform duration-200 ease-out motion-reduce:transition-none",
          dark ? "translate-x-[calc(100%*var(--kit-dir))]" : "translate-x-0",
        )}
      />
      <span className="relative grid h-full grid-cols-2 place-items-center">
        <SunMedium
          aria-hidden
          strokeWidth={1.75}
          className={cn("size-4 transition-colors", dark ? "text-on-rail/40 group-hover:text-on-rail/70" : "text-rail")}
        />
        <Moon
          aria-hidden
          strokeWidth={1.75}
          className={cn("size-4 transition-colors", dark ? "text-rail" : "text-on-rail/40 group-hover:text-on-rail/70")}
        />
      </span>
    </button>
  );
}
