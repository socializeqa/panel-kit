"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ROWS_COOKIE, ROWS_EVENT, rowsFromCookie } from "./page-size";
import { usePanel } from "./panel-provider";
import { usePanelPathname } from "./use-panel-pathname";

// Measures how many natural-height rows the visible fill-mode table can show
// (or, on a phone, how many of its cards) without scrolling (the scroll body's own height ÷ a real row's height) and
// remembers it in a cookie every list reads for its page size. Measures once
// the list's box has settled, and again whenever that box resizes; tells the
// list once when the answer changes, then settles — the measure is the same
// for a given box, so it can't oscillate. Because it reads the body itself it
// self-corrects: a stale cookie from another layout is re-measured on the
// next load.
//
// A list paged on the server re-renders (router.refresh) — Elite Touch's way;
// one paged in the browser hears ROWS_EVENT through useAdaptiveRows —
// Señorritas'. PanelProvider `paging` says which.
export function RowsCalibrator() {
  const pathname = usePanelPathname();
  const router = useRouter();
  const { paging } = usePanel();
  useEffect(() => {
    let timer: number | undefined;
    // The visible fill-mode list with something in it: the desk table's body,
    // or on a phone the card list (the other one is hidden, zero high).
    const listBody = (): HTMLElement | undefined =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-table-body], [data-card-body]")).find(
        (el) => el.clientHeight > 0 && el.querySelector("tbody tr, :scope > ul > li") !== null,
      );
    // A phone shows cards, not the table: count how many whole cards fit the
    // card list's own height (the median card, with the gap between them).
    const fitCards = (list: HTMLElement): number | null => {
      const ul = list.querySelector<HTMLElement>(":scope > ul");
      if (!ul) return null;
      const heights = Array.from(ul.children)
        .map((li) => li.getBoundingClientRect().height)
        .filter((h) => h > 0)
        .sort((a, b) => a - b);
      const cardH = heights[Math.floor(heights.length / 2)] ?? 0;
      if (cardH < 20) return null;
      const box = getComputedStyle(list);
      const gap = parseFloat(getComputedStyle(ul).rowGap) || 0;
      const room = list.clientHeight - (parseFloat(box.paddingTop) || 0) - (parseFloat(box.paddingBottom) || 0);
      return Math.min(60, Math.max(1, Math.floor((room + gap) / (cardH + gap))));
    };
    const remember = (ideal: number) => {
      if (rowsFromCookie(document.cookie) !== ideal) {
        document.cookie = `${ROWS_COOKIE}=${ideal}; path=/; max-age=31536000; samesite=lax`;
        window.dispatchEvent(new Event(ROWS_EVENT));
        if (paging === "server") router.refresh();
      }
    };
    // Measures the visible list; returns the box it measured, or null when no
    // list with rows is on the page.
    const calibrate = (): HTMLElement | null => {
      const body = listBody();
      if (!body) return null;
      if (body.hasAttribute("data-card-body")) {
        const cards = fitCards(body);
        if (cards === null) return null;
        remember(cards);
        return body;
      }
      // The median row height, not the first row's: rows aren't uniform, so
      // sampling one either overestimates how many fit or overflows the card.
      //
      // Measure NATURAL rows. A full page stretches the table to the card and
      // hands the slack to the rows — measuring those fed the stretch back in
      // as a row's cost. Drop the stretch for the read, and put the style
      // attribute back byte for byte.
      const table = body.querySelector("table");
      const style = table?.getAttribute("style") ?? null;
      if (table) table.style.height = "auto";
      const heights = Array.from(body.querySelectorAll("tbody tr"))
        .map((r) => r.getBoundingClientRect().height)
        .filter((h) => h > 0)
        .sort((a, b) => a - b);
      if (table) {
        if (style === null) table.removeAttribute("style");
        else table.setAttribute("style", style);
      }
      const rowH = heights[Math.floor(heights.length / 2)] ?? 0;
      if (rowH < 20) return null;
      // In fill mode the body is `min-h-0 flex-1 overflow-y-auto`, so its
      // clientHeight IS the space the table has — the flex chain has already
      // taken out the top bar, the page header and the pager.
      const headH = body.querySelector("thead")?.getBoundingClientRect().height ?? 0;
      remember(Math.min(60, Math.max(8, Math.floor((body.clientHeight - headH) / rowH))));
      return body;
    };
    // The list's box is watched, not measured the moment its rows arrive: it
    // settles a beat later (the room's buttons reach the top bar after the
    // list and can wrap it onto a second line on a phone), and a resize or a
    // turned phone swaps the table for the cards. A burst of changes folds
    // into one measure. A drawer over the list leaves its box alone.
    const sized = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const body = calibrate();
        if (body) sized.observe(body);
      }, 150);
    });
    // A list often loads behind a loader, so it is not in the page when this
    // first runs: watch the page until one with rows appears.
    const arrived = new MutationObserver(() => {
      const body = listBody();
      if (!body) return;
      arrived.disconnect();
      sized.observe(body);
    });
    const body = listBody();
    if (body) sized.observe(body);
    else arrived.observe(document.body, { childList: true, subtree: true });
    return () => {
      arrived.disconnect();
      sized.disconnect();
      window.clearTimeout(timer);
    };
    // Per list: the layout persists across rooms, and each has its own rows.
  }, [pathname, paging, router]);
  return null;
}

function subscribeRows(onChange: () => void) {
  window.addEventListener(ROWS_EVENT, onChange);
  return () => window.removeEventListener(ROWS_EVENT, onChange);
}

/** This screen's measured rows per page — undefined until the calibrator has measured. */
export function useAdaptiveRows(): number | undefined {
  return useSyncExternalStore(subscribeRows, () => rowsFromCookie(document.cookie), () => undefined);
}
