"use client";

import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { CTRL_BTN, CTRL_LABEL, MENU_LABEL, MENU_PANEL } from "./classes";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";
import { Eyebrow } from "./record";
import { useDismiss } from "./use-dismiss";

// The top bar's bell: what came in since the person last looked, with a count
// on the seat and the newest lines under it. It wears the header menus' dress
// (HeaderMenu): the same seat, the same dropped panel growing from it. What
// counts as new, where the lines come from and how they arrive live is the
// panel's own (Lucce: new requests and sign-ups, live through Supabase), so
// it hands the bell the lines, the count and what to do on open and on
// "Mark all as read". It goes in PanelProvider's `tools` seat.

export interface BellItem {
  id: string;
  title: string;
  sub?: string;
  /** When, already in the panel's words ("26 Oct, 14:05"). */
  when: string;
  href: string;
  unread: boolean;
  icon?: ReactNode;
}

export function NotificationBell({
  count,
  items,
  onOpen,
  onMarkAllRead,
  label = "Notifications",
  emptyLabel = "Nothing new",
}: {
  /** How many are new; the seat shows it, 9+ past nine. */
  count: number;
  items: BellItem[];
  /** Called as the panel opens, to read the newest lines. */
  onOpen?: () => void;
  /** Left out, the panel has no Mark all as read. */
  onMarkAllRead?: () => void | Promise<void>;
  label?: string;
  emptyLabel?: string;
}) {
  const t = usePanelT();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);
  const shown = count > 9 ? "9+" : String(count);

  return (
    <div ref={ref} className="contents">
      <button
        type="button"
        aria-label={count ? t("{label}, {count} new", { label: t(label), count: String(count) }) : t(label)}
        aria-haspopup="true"
        aria-expanded={open}
        title={t(label)}
        onClick={() => {
          if (!open) onOpen?.();
          setOpen((o) => !o);
        }}
        className={CTRL_BTN}
      >
        <Bell aria-hidden="true" />
        <span className={CTRL_LABEL}>{t(label)}</span>
        {count ? (
          <span aria-hidden="true" className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-deep px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-ground tabular-nums">
            {shown}
          </span>
        ) : null}
      </button>
      {open ? (
        <div role="dialog" aria-label={t(label)} className={cn(MENU_PANEL, "w-[min(22rem,calc(100vw-2rem))]")}>
          <div className="flex items-center justify-between gap-2">
            <Eyebrow size="sm" className={MENU_LABEL}>
              {t(label)}
            </Eyebrow>
            {onMarkAllRead && count ? (
              <button type="button" onClick={() => void onMarkAllRead()} className="rounded-control px-2.5 py-1 text-[12px] font-medium text-brand-deep transition-colors hover:bg-ink/[0.04]">
                {t("Mark all as read")}
              </button>
            ) : null}
          </div>
          {items.length ? (
            <ul className="flex max-h-[min(24rem,60vh)] flex-col overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} onClick={close} className="flex items-start gap-2.5 rounded-control px-2.5 py-2 text-start transition-colors hover:bg-ink/[0.04]">
                    <span aria-hidden="true" className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", item.unread ? "bg-brand-deep" : "bg-transparent")} />
                    {item.icon ? <span className="mt-0.5 shrink-0 text-ink/50 [&_svg]:size-4">{item.icon}</span> : null}
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className={cn("truncate text-[13px]", item.unread ? "font-medium text-ink" : "text-ink/75")}>{item.title}</span>
                      {item.sub ? <span className="truncate text-[12px] text-ink/50">{item.sub}</span> : null}
                    </span>
                    <span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-ink/45">{item.when}</span>
                    {item.unread ? <span className="sr-only">{t("New")}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2.5 py-6 text-center text-[13px] text-ink/50">{t(emptyLabel)}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
