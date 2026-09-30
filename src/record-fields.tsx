"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { iconBtnClass, PANEL_SHELL } from "./classes";
import { cn } from "./cn";
import { IconTile } from "./icon-tile";
import { usePanelT } from "./panel-provider";

// A titled drawer card — an icon and a title (a subtitle, an action at the
// end), then its body. Stacking these with a gap is what gives a drawer its
// clean, separated sections. The inline field skin that goes inside is
// inlineFieldClass (classes.ts).
export function Section({
  icon,
  title,
  subtitle,
  action,
  grow = false,
  className,
  footer,
  collapsible = false,
  defaultOpen = true,
  bodyClassName,
  tone = "default",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Flex to fill the remaining height (a map that fills the drawer). */
  grow?: boolean;
  className?: string;
  /** "customer" marks the ONE card in an editor the customer sees through —
   *  brand chrome, a solid icon tile, a "Customer-facing" chip — so staff
   *  always know which surface is public before they type into it. */
  tone?: "default" | "customer";
  // An action bar at the card's foot, for a section that owns its own Save.
  footer?: React.ReactNode;
  // The header becomes a toggle that folds the body away (the footer stays,
  // so a form's Save is never hidden).
  collapsible?: boolean;
  defaultOpen?: boolean;
  // Override the body's padding and gap (a card whose body is a list).
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const t = usePanelT();
  const [open, setOpen] = useState(defaultOpen);
  const shown = !collapsible || open;
  const customer = tone === "customer";
  const head = (
    <>
      <IconTile size="md" tone={customer ? "solid" : "brand"}>
        {icon}
      </IconTile>
      <div className="min-w-0 flex-1 text-start">
        <span className="flex items-center gap-2">
          <h3 className="text-[14px] font-semibold leading-tight text-ink transition-colors group-focus-within/section:text-brand-deep">
            {t(title)}
          </h3>
          {customer ? (
            <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-deep">
              {t("Customer-facing")}
            </span>
          ) : null}
        </span>
        {subtitle ? <p className="line-clamp-2 text-[12px] leading-snug text-quiet">{t(subtitle)}</p> : null}
      </div>
    </>
  );
  return (
    <section
      className={cn(
        PANEL_SHELL,
        // The section you are working in shows it: an outline in the brand's
        // deep tone while a field inside holds focus.
        "group/section overflow-hidden transition-[border-color,box-shadow] duration-150 focus-within:border-brand-deep/70 focus-within:shadow-focus",
        customer && "border-brand-deep/30",
        grow && "flex min-h-0 flex-1 flex-col",
        className,
      )}
    >
      <header
        className={cn(
          "flex shrink-0 items-center gap-3 bg-ink/[0.015] px-4 py-3 transition-colors group-focus-within/section:bg-brand/[0.05] sm:px-5",
          customer && "bg-brand/[0.05]",
          shown && "border-b border-ink/[0.07]",
          customer && shown && "border-brand-deep/15",
        )}
      >
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="-m-1 flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 text-start transition-colors hover:bg-ink/[0.03]"
          >
            {head}
          </button>
        ) : (
          head
        )}
        {action}
        {/* The fold chevron always holds the header's end, past any action
            the section carries (Damine, 24 Aug 2026). */}
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? t("Collapse section") : t("Expand section")}
            className={cn(iconBtnClass(7, "ink"), "-m-1")}
          >
            <ChevronDown
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className={cn("shrink-0 text-ink/40 transition-transform duration-200 ease-out", open && "rotate-180")}
            />
          </button>
        ) : null}
      </header>
      {/* Folded, not unmounted: a collapsed section's fields must still post
          with the form. */}
      <div
        hidden={!shown}
        className={cn(shown ? "flex flex-col" : "hidden", bodyClassName ?? "gap-4 p-4 sm:p-5", grow && "min-h-0 flex-1 overflow-y-auto")}
      >
        {children}
      </div>
      {footer ? <div className="shrink-0 border-t border-ink/[0.06] bg-ink/[0.015] px-4 py-3 sm:px-5">{footer}</div> : null}
    </section>
  );
}
