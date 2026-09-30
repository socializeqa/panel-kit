import type { LucideIcon } from "lucide-react";

/**
 * The panel's rooms. The app hands its list to PanelProvider; the rail draws
 * it, and the header and the drawer read it to name the room a page belongs
 * to. Elite Touch's shape (lib/admin/nav.ts), with the matching rule
 * Señorritas settled on: the longest room that owns a path wins, so a nested
 * room resolves to itself.
 */
export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** The capability a person needs to see this room (Elite Touch's areas). */
  cap?: string;
  /** A live count beside the room — bookings waiting for a reply. */
  count?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Whether a room is the one open. The home page is lit only on itself. */
export function isItemActive(href: string, pathname: string, home = "/"): boolean {
  if (href === home) return pathname === home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The room a panel path lives in: "/reservations/r-12" is Reservations,
 * "/settings/integrations/resend" is Integrations. The longest rail entry
 * that owns the path wins.
 */
export function roomFor(groups: NavGroup[], pathname: string, home = "/"): NavItem | null {
  let best: NavItem | null = null;
  for (const group of groups) {
    for (const item of group.items) {
      if (!isItemActive(item.href, pathname, home)) continue;
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best;
}

/** A path in its short form: with `fold` "/admin", "/admin/quotes" and
 *  "/quotes" both read "/quotes". */
export function foldPath(pathname: string, fold?: string): string {
  if (!fold) return pathname;
  if (pathname === fold) return "/";
  return pathname.startsWith(`${fold}/`) ? pathname.slice(fold.length) : pathname;
}
