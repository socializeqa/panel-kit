"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { CTRL_BTN } from "./classes";
import { cn } from "./cn";
import { usePanel } from "./panel-provider";
import { usePanelPathname } from "./use-panel-pathname";

// The top bar's create action: the right words for the list on screen, and
// only for a person allowed to create there. X Capital's settings-driven
// button — one entry per list (PanelProvider `create`), where Elite Touch and
// Señorritas each hard-wired a table of their own lists into the kit. An entry
// with an href links to its create page; one without opens `?r=new` on the
// list itself, keeping the list's filters (a room that opens its drawers on
// the list, as Señorritas' do).
export function NewRecordButton() {
  const pathname = usePanelPathname();
  const params = useSearchParams();
  const { create, can, t } = usePanel();
  const entry = create[pathname];
  if (!entry || entry.hidden || (entry.cap && !can(entry.cap))) return null;

  let href = entry.href;
  if (!href) {
    const next = new URLSearchParams(params.toString());
    next.set("r", "new");
    href = `${pathname}?${next.toString()}`;
  }
  const label = t(entry.label);
  // The one brand seat of the header strip — icon only, the words in the
  // tooltip, first in line because creating is the page's primary act.
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      title={label}
      className={cn(
        CTRL_BTN,
        "border-brand-deep bg-brand text-brand-ink hover:border-brand-deep hover:bg-[color-mix(in_oklab,var(--brand)_88%,black)] hover:text-brand-ink",
      )}
    >
      <Plus className="size-[18px]" strokeWidth={2.2} />
    </Link>
  );
}
