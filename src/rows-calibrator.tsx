"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ROWS_COOKIE, ROWS_EVENT, rowsFromCookie } from "./page-size";
import { usePanel } from "./panel-provider";
import { usePanelPathname } from "./use-panel-pathname";

// Measures how many natural-height rows the visible fill-mode table can show
// (or, on a phone, how many of its cards) without scrolling (the scroll body's own height ÷ a real row's height) and
// remembers it in a cookie every list reads for its page size. Runs after
// paint and on resize; tells the list once when the answer changes, then
// settles — the measure is the same for a given viewport, so it can't
// oscillate. Because it reads the body itself it self-corrects: a stale
// cookie from another layout is re-measured on the next load.
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
    // True once a table was measured on this page — the observer stops then,
    // so a drawer opening over the list can't trigger a re-measure.
    let measured = false;
    // A phone shows cards, not the table: count how many whole cards fit the
    // card list's own height (the median card, with the gap between them).
    const fitCards = (): number | null => {
      const list = Array.from(document.querySelectorAll<HTMLElement>("[data-card-body]")).find((el) => el.clientHeight > 0);
      const ul = list?.querySelector<HTMLElement>(":scope > ul");
      if (!list || !ul) return null;
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
    const calibrate = (): boolean => {
      const body = Array.from(document.querySelectorAll<HTMLElement>("[data-table-body]")).find((el) => el.clientHeight > 0);
      if (!body) {
        const cards = fitCards();
        if (cards === null) return false;
        remember(cards);
        return true;
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
      if (rowH < 20) return false;
      // In fill mode the body is `min-h-0 flex-1 overflow-y-auto`, so its
      // clientHeight IS the space the table has — the flex chain has already
      // taken out the top bar, the page header and the pager.
      const headH = body.querySelector("thead")?.getBoundingClientRect().height ?? 0;
      remember(Math.min(60, Math.max(8, Math.floor((body.clientHeight - headH) / rowH))));
      return true;
    };
    // A list often loads behind a loader, so the table is not in the page
    // when this first runs. Try now, then watch until a table with rows
    // appears, and measure that once.
    const observer = new MutationObserver(() => {
      if (measured) return;
      if (calibrate()) {
        measured = true;
        observer.disconnect();
      }
    });
    if (calibrate()) measured = true;
    else observer.observe(document.body, { childList: true, subtree: true });
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void calibrate(), 400);
    };
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
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
