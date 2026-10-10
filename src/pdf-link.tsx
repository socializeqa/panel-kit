"use client";

import type { ReactNode } from "react";
import { Download, FileText } from "lucide-react";
import { iconBtnClass } from "./classes";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";

// A link to a paper (a CV, a generated PDF) that always fetches it fresh. Some
// tablet browsers and built-in PDF viewers keep a PDF they fetched once and
// show it again without asking the server, so the route's `no-store` can't
// reach them: an edited document kept showing the old one. A token per click
// makes the address new each time, which forces a real fetch.
//
// `download` saves the file instead of opening it. The anchor's own
// `download` attribute is applied unevenly by browsers, so the link also asks
// the route for an attachment (`download=1`); a route that reads it answers
// with Content-Disposition, and that holds on every device. Without
// JavaScript the plain href still works.
export function PdfLink({
  href,
  download = false,
  menuClose = false,
  className,
  title,
  ariaLabel,
  children,
}: {
  href: string;
  download?: boolean;
  /** Inside a RowMenu: the menu closes on the click (it looks for [data-menu-close]). */
  menuClose?: boolean;
  className?: string;
  title?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      download={download ? "" : undefined}
      target={download ? undefined : "_blank"}
      rel="noopener noreferrer"
      data-menu-close={menuClose ? "" : undefined}
      title={title}
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        // A press with a modifier (a new tab, a new window) is the browser's.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        const fresh = `t=${Date.now()}${download ? "&download=1" : ""}`;
        const url = `${href}${href.includes("?") ? "&" : "?"}${fresh}`;
        if (download) {
          const a = document.createElement("a");
          a.href = url;
          // The server's Content-Disposition names the file.
          a.download = "";
          document.body.appendChild(a);
          a.click();
          a.remove();
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      }}
    >
      {children}
    </a>
  );
}

// A seat in a drawer header's strip, the same size as the strip's own seats;
// `seat` is the class the strip fuses on.
const HEADER_SEAT = cn(iconBtnClass(9, "ink"), "seat hover:text-brand-deep");

/** One more seat in a drawer header: a link that opens in a new tab (a portfolio, a website). */
export function HeaderLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  const t = usePanelT();
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={t(label)} title={t(label)} className={HEADER_SEAT}>
      {children}
    </a>
  );
}

/** A paper's two seats in a drawer header: open it in a new tab, or download it. Both fetch it fresh. */
export function PdfHeaderActions({ href, label = "PDF" }: { href: string; label?: string }) {
  const t = usePanelT();
  const open = t("Open {paper}", { paper: t(label) });
  const save = t("Download {paper}", { paper: t(label) });
  return (
    <div className="flex shrink-0 items-center gap-1">
      <PdfLink href={href} ariaLabel={open} title={open} className={HEADER_SEAT}>
        <FileText aria-hidden="true" />
      </PdfLink>
      <PdfLink href={href} download ariaLabel={save} title={save} className={HEADER_SEAT}>
        <Download aria-hidden="true" />
      </PdfLink>
    </div>
  );
}
