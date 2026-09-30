"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { usePanel, type ResolvedPanel } from "./panel-provider";
import { usePanelPathname } from "./use-panel-pathname";

const KEY = "kit-prev-panel-url";

/**
 * Remembers the previous in-panel URL — path AND query — for a browser that
 * can't list its own history (see backTarget). document.referrer can't
 * answer this: a client-side navigation never updates it. Mounted once in the
 * Shell, like the wheel guard.
 */
export function NavMemory() {
  const pathname = usePanelPathname();
  const current = useRef<string | null>(null);

  useEffect(() => {
    if (current.current) sessionStorage.setItem(KEY, current.current);
    current.current = pathname + window.location.search;
  }, [pathname]);

  return null;
}

/** The full URL the person was on before this page, if this session knows. */
export function previousPanelUrl(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Where the header's Back door leads: a panel page behind this one, `steps` entries back. */
export interface BackTarget {
  url: string;
  steps: number;
}

type Host = ResolvedPanel["host"];

const under = (path: string, base: string) =>
  base === "/" || path === base || path.startsWith(`${base}/`);

// A panel page is any page under the panel's base but its doors in (sign in,
// set a password). Elite Touch's panel owns a whole host; Señorritas' lives
// under /admin beside the website.
function isPanelPage(u: URL, host: Host): boolean {
  if (u.origin !== window.location.origin || !under(u.pathname, host.base)) return false;
  const inner = host.base === "/" ? u.pathname : u.pathname.slice(host.base.length) || "/";
  return !host.doors.some((door) => under(inner, door) || under(u.pathname, door));
}

// Read straight off the tab's own history list (the Navigation API), never off
// a remembered "last page": after a Back, the page just left sits AHEAD in
// history, and a door naming it would lead somewhere else. Entries on the same
// path as this one (a list's page 2 over its page 1) are one place and are
// walked past together, so the door names the page you came from.
function readBack(host: Host): string {
  const nav = window.navigation;
  const here = nav?.currentEntry;
  if (!nav || !here?.url) return "";
  const path = new URL(here.url).pathname;
  const entries = nav.entries();
  for (let i = here.index - 1; i >= 0; i--) {
    const url = entries[i]?.url;
    const at = url ? new URL(url) : null;
    if (!at || !isPanelPage(at, host)) return "";
    if (at.pathname !== path) return `${here.index - i}|${at.pathname}${at.search}`;
  }
  return "";
}

// Next pushes history from inside React's commit, and the Navigation API fires
// this event right there; answering on the next microtask keeps the update out
// of the commit ("useInsertionEffect must not schedule updates").
function subscribeHistory(onChange: () => void) {
  const nav = window.navigation;
  const later = () => queueMicrotask(onChange);
  nav?.addEventListener("currententrychange", later);
  return () => nav?.removeEventListener("currententrychange", later);
}

function parseBack(key: string): BackTarget | null {
  if (!key) return null;
  const bar = key.indexOf("|");
  return { steps: Number(key.slice(0, bar)), url: key.slice(bar + 1) };
}

/** Whether this browser lists its own history — without it, nothing here can say what Back leads to. */
export const canReadHistory = () => typeof window !== "undefined" && !!window.navigation?.currentEntry;

/** Read now, for a click: the panel page behind this one in the tab's history. */
export function backTarget(host: Host): BackTarget | null {
  return parseBack(readBack(host));
}

/** The same, as React state — null on the server, in a fresh tab, or where the browser can't list its history. */
export function useBackTarget(): BackTarget | null {
  const { host } = usePanel();
  const read = useCallback(() => readBack(host), [host]);
  return parseBack(useSyncExternalStore(subscribeHistory, read, () => ""));
}
