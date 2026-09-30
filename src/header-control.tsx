"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { CTRL_BTN, CTRL_LABEL, MENU_ITEM, MENU_LABEL, MENU_PANEL } from "./classes";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";
import { Eyebrow } from "./record";
import { useDismiss } from "./use-dismiss";

// The one button language of the top bar's controls — the list pages' search,
// filter and sort (ListControls) and a page's own header menus — so every
// header dropdown looks and behaves the same. Their classes (CTRL_BTN,
// MENU_PANEL, MENU_ITEM) live in classes.ts.

// The dot that marks a control as narrowing the view.
export function ActiveDot() {
  return <span className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-brand-deep ring-2 ring-ground" />;
}

export interface HeaderMenuOption {
  value: string;
  label: string;
}

// A single-select dropdown in the header style: a labelled icon seat that
// opens a radio list with an "All" reset at the top. onSet receives "" when
// the person picks All, so the caller decides what clearing means.
export function HeaderMenu({
  icon,
  label,
  ariaLabel,
  sectionLabel,
  options,
  current,
  onSet,
  allLabel = "All",
}: {
  icon: ReactNode;
  label: string;
  ariaLabel?: string;
  sectionLabel: string;
  options: HeaderMenuOption[];
  current: string;
  onSet: (value: string) => void;
  allLabel?: string;
}) {
  const t = usePanelT();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);

  return (
    <div ref={ref} className="contents">
      <button
        type="button"
        aria-label={t(ariaLabel ?? label)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t(label)}
        onClick={() => setOpen((o) => !o)}
        className={CTRL_BTN}
      >
        {icon}
        <span className={CTRL_LABEL}>{t(label)}</span>
        {current && <ActiveDot />}
      </button>
      {open && (
        <div role="menu" className={MENU_PANEL}>
          <Eyebrow size="sm" className={MENU_LABEL}>
            {t(sectionLabel)}
          </Eyebrow>
          {[{ value: "", label: allLabel }, ...options].map((o) => {
            const active = current === o.value;
            return (
              <button
                key={o.value || "__all"}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onSet(o.value);
                  close();
                }}
                className={cn(MENU_ITEM, active ? "font-medium text-ink" : "text-ink/70")}
              >
                {t(o.label)}
                {active && <Check className="size-4 text-brand-deep" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
