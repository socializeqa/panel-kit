"use client";

import { usePathname } from "next/navigation";
import { foldPath } from "./nav";
import { usePanel } from "./panel-provider";

/**
 * The page the panel is on, in its short form. Elite Touch's panel lives on
 * admin.elitetouch.qa, where the address says "/quotes", while an older link
 * can still arrive as "/admin/quotes" (a bell notification written before the
 * move, a bookmark); with `host.fold` set, the rail, the filters and the
 * drawers read both as the same room. Without it, this is the pathname.
 */
export function usePanelPathname(): string {
  return foldPath(usePathname(), usePanel().host.fold);
}
