"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// The one guard on unsaved work in the panel (Damine, 28 Aug 2026, after a
// panel user's "the quotation keeps closing and we lose everything, there is no autosave").
//
// The drawer has always asked before its OWN close (the X, Esc, a click on the
// overlay). Nothing asked before a NAVIGATION — and every record editor here
// IS a route, so a two-finger swipe on a trackpad, the mouse's back button,
// the sidebar, or one of the record's own links (the request number and the
// customer name sit at the top of every quote) walked out of a half-typed
// quote with no prompt at all. The browser-level half of the guard lived in
// RecordForm, so the 22 forms built on it were safe from F5 while the money
// editors that hand-roll their own form — quotes, invoices, contracts — were
// not. Two half-brains, four exits, two of them open.
//
// So all four exits live here, and the two hosts call it: Drawer (every record
// editor in every room — the @drawer intercepts and the hard-load twin both
// mount it) and RecordForm's page mode (the Settings forms, which sit on no
// drawer). Nothing else needs to know.
//
// Back/forward is the awkward one: there is no web API that can block it.
// The Navigation API's own docs say "cancellation of traverse navigations is
// not yet implemented" (read 28 Aug 2026), and beforeunload does not fire on a
// same-document history move. The only lever left is to park a duplicate
// history entry while there is unsaved work: the first press back lands on a
// copy of the page we are already on, so nothing changes on screen, and we ask
// from there. `history.state` is reused verbatim, so Next's router only ever
// sees state it wrote itself.

/** Only one guard parks an entry at a time — a nested drawer opened over a
 *  dirty one must not stack a second buffer behind the first. */
let bufferOwner: symbol | null = null;

export interface UnsavedGuard {
  /** Hand back the parked entry without navigating, and say how many extra
   *  steps the host must take if it is about to walk back itself. Returns 1
   *  while an entry is parked, 0 otherwise. */
  release: () => number;
}

export function useUnsavedGuard({
  when,
  ask,
  history: guardHistory = true,
}: {
  /** Is there unsaved work right now. */
  when: boolean;
  /** Show the host's own "Discard changes?" — call `discard` to let the
   *  held-back navigation through. Doing nothing keeps the user where they are. */
  ask: (discard: () => void) => void;
  /** False for a host that owns no route of its own (a controlled drawer
   *  opened from inside another), where back is not one of its exits. */
  history?: boolean;
}): UnsavedGuard {
  const router = useRouter();
  // Read through refs so the listeners below bind once and still see the
  // live answer — rebinding them on every keystroke would drop events.
  const askRef = useRef(ask);
  const whenRef = useRef(when);
  useEffect(() => {
    askRef.current = ask;
    whenRef.current = when;
  });

  const owns = useRef(false);
  const idRef = useRef<symbol | null>(null);
  if (idRef.current === null) idRef.current = Symbol("unsaved-guard");

  const release = useCallback(() => {
    const parked = owns.current ? 1 : 0;
    owns.current = false;
    return parked;
  }, []);

  // 1. The browser's own warning — refresh, tab close, a typed URL. This is
  //    the only exit we cannot dress in our own dialog.
  useEffect(() => {
    if (!when) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [when]);

  // 2. Links — the sidebar, and the record's own context links. Capture phase,
  //    so we get there before Next's router does.
  useEffect(() => {
    if (!when) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      // Ctrl/⌘/shift-click opens a new tab and leaves this one alone.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = e.target instanceof Element ? e.target : null;
      const a = el?.closest("a[href]") as HTMLAnchorElement | null;
      if (!a || a.hasAttribute("download")) return;
      if (a.target && a.target !== "_self") return;
      const url = new URL(a.href, location.href);
      // Off-site (and the PDF routes, which leave the app): beforeunload has it.
      if (url.origin !== location.origin) return;
      const there = url.pathname + url.search;
      // A hash or a link back to where we already are changes nothing.
      if (there === location.pathname + location.search) return;
      e.preventDefault();
      e.stopPropagation();
      askRef.current(() => {
        // Let the parked entry stand: it holds this record's own URL, so back
        // from wherever we land returns here, which is what the user expects.
        release();
        router.push(there + url.hash);
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [when, router, release]);

  // 3. Back and forward — the trackpad swipe, the mouse's back button, Alt+←.
  useEffect(() => {
    if (!when || !guardHistory) return;
    const id = idRef.current!;
    if (bufferOwner && bufferOwner !== id) return;
    bufferOwner = id;

    const park = () => {
      history.pushState(history.state, "", location.href);
      owns.current = true;
    };
    park();

    const onPop = () => {
      if (!owns.current) return;
      // The press we just heard spent the parked entry.
      owns.current = false;
      // Saved in the meantime — there is nothing left to protect, so let the
      // trip the user actually asked for finish.
      if (!whenRef.current) {
        history.back();
        return;
      }
      park(); // stay where we are while we ask
      askRef.current(() => {
        owns.current = false;
        // Step over the entry we just re-parked AND the one they meant to
        // leave, in a single move so no second popstate races us.
        history.go(-2);
      });
    };
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      if (bufferOwner === id) bufferOwner = null;
      // Going clean (a save that keeps the editor open) — hand the entry back
      // so the next press back is not swallowed. A host that is navigating
      // away has already called release(), so there is nothing here to undo.
      if (owns.current) {
        owns.current = false;
        history.back();
      }
    };
  }, [when, guardHistory]);

  return { release };
}
