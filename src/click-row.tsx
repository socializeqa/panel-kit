"use client";

import { useRouter } from "next/navigation";

// A table row that opens its record when pressed anywhere on it. The first
// cell's link stays for the keyboard and screen readers; this is the pointer's
// way in. A stretched link used to do it, but the first cell is pinned for
// sideways scrolling, which made it the link's frame, so only that one cell
// opened the record (X Capital's candidates, 4 Oct 2026: pressing a name did
// nothing). A press on the row's own controls, a text selection, or a press
// with a modifier (a new tab) is left alone.
const OWN = "a, button, input, select, textarea, label, summary, [role='button'], [role='menuitem'], [data-row-own]";

export function ClickRow({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr
      className={className}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest(OWN)) return;
        if (window.getSelection()?.toString()) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey) {
          window.open(href, "_blank", "noopener");
          return;
        }
        router.push(href, { scroll: false });
      }}
      onAuxClick={(e) => {
        // The middle button opens a new tab, as it would on a link.
        if (e.button === 1 && !(e.target as HTMLElement).closest(OWN)) window.open(href, "_blank", "noopener");
      }}
    >
      {children}
    </tr>
  );
}
