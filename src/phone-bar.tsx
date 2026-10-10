"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import { cn } from "./cn";
import { Sheet } from "./modal";
import { isItemActive, type NavGroup, type NavItem } from "./nav";
import { usePanel } from "./panel-provider";
import { usePanelPathname } from "./use-panel-pathname";

// The phone's bottom bar, the way a phone app is laid out: the rooms a thumb
// reaches most (PanelProvider `tabs`), the + in the middle for the quick
// actions (`quick`), and More, which opens the whole rail. It sits under the
// content as the column's last row, so a list's calibrator measures the room
// that is really left, and it pads itself clear of an iPhone's home bar.
//
// No motion on a tab: it is pressed tens of times a day, so it answers with
// the press alone (a hair of scale) and the room changes at once.

const TAB = "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-1.5 pt-2 text-[11px] font-medium leading-none outline-none";
const PRESS = "motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out active:scale-[0.96]";

export function PhoneBar({ onMore }: { onMore: () => void }) {
  const { nav, tabs, quick, can, t, host } = usePanel();
  const pathname = usePanelPathname();
  const [sheet, setSheet] = useState(false);

  const items = barRooms(nav, tabs, can);
  const actions = quick.filter((a) => !a.cap || can(a.cap));
  if (!items.length) return null;

  // More reads lit in any room the bar doesn't name.
  const inBar = items.some((i) => isItemActive(i.href, pathname, host.home));
  const half = Math.ceil(items.length / 2);
  const tab = (item: NavItem) => {
    const active = isItemActive(item.href, pathname, host.home);
    return (
      <li key={item.href} className="flex min-w-0 flex-1">
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(TAB, active ? "text-brand-deep" : "text-quiet", "focus-visible:text-ink")}
        >
          <span className={cn("relative grid h-7 w-12 place-items-center rounded-full", PRESS, active && "bg-brand-soft")}>
            <item.Icon size={20} strokeWidth={active ? 2.1 : 1.8} aria-hidden="true" />
            {item.count ? (
              <span className="absolute -top-1 end-1 min-w-4 rounded-full bg-brand-deep px-1 text-center text-[10px] font-semibold leading-4 text-white tabular-nums">
                {item.count > 99 ? "99+" : item.count}
              </span>
            ) : null}
          </span>
          <span className="max-w-full truncate px-0.5">{t(item.label)}</span>
        </Link>
      </li>
    );
  };

  return (
    <>
      <nav
        aria-label={t("Main rooms")}
        className="shrink-0 border-t border-ink/10 bg-ground/95 pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden"
      >
        <ul className="flex items-stretch px-1">
          {items.slice(0, half).map(tab)}
          {actions.length ? (
            <li className="flex flex-1 items-center justify-center">
              <button
                type="button"
                onClick={() => setSheet(true)}
                aria-label={t("Start something")}
                aria-haspopup="dialog"
                className={cn(
                  "grid size-12 place-items-center rounded-full bg-brand text-brand-ink shadow-kit-lift outline-none focus-visible:ring-2 focus-visible:ring-brand-deep/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ground",
                  PRESS,
                )}
              >
                <Plus size={24} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </li>
          ) : null}
          {items.slice(half).map(tab)}
          <li className="flex min-w-0 flex-1">
            <button type="button" onClick={onMore} className={cn(TAB, inBar ? "text-quiet" : "text-brand-deep", "focus-visible:text-ink")}>
              <span className={cn("grid h-7 w-12 place-items-center rounded-full", PRESS, !inBar && "bg-brand-soft")}>
                <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span>{t("More")}</span>
            </button>
          </li>
        </ul>
      </nav>

      {actions.length ? (
        <Sheet open={sheet} onOpenChange={setSheet} title="Start something">
          <ul className="flex flex-col gap-1 px-3 pb-1">
            {actions.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  onClick={() => setSheet(false)}
                  className="flex items-center gap-3.5 rounded-2xl px-2.5 py-2.5 text-[15px] font-medium text-ink outline-none transition-colors active:bg-ink/[0.05] focus-visible:bg-ink/[0.05]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-deep">
                    <a.Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  {t(a.label)}
                </Link>
              </li>
            ))}
          </ul>
        </Sheet>
      ) : null}
    </>
  );
}

/** The bar's rooms as this person sees them: the `tabs` they may open, in
 *  order. With none, the shell keeps its menu button instead of the bar. */
export function barRooms(nav: NavGroup[], tabs: string[], can: (cap: string) => boolean): NavItem[] {
  const rooms = new Map<string, NavItem>();
  for (const group of nav) for (const item of group.items) if (!item.cap || can(item.cap)) rooms.set(item.href, item);
  return tabs.map((href) => rooms.get(href)).filter((item): item is NavItem => !!item);
}
