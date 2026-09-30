"use client";

import { ArrowLeft } from "lucide-react";
import { CTRL_BTN } from "./classes";
import { cn } from "./cn";
import { foldPath, roomFor } from "./nav";
import { useBackTarget } from "./nav-memory";
import { usePanel } from "./panel-provider";
import { usePanelPathname } from "./use-panel-pathname";

// Back to the page you came from, as you left it (Elite Touch's owner, 12 Sep
// 2026: "use the Back function to return to the previous window or the
// Dashboard, preserving the filter and the list"). It walks the browser's own
// history, so the page returns with its filters, its page and its scroll —
// never rebuilt from a bare link. Page 2 of a list counts as the list. It
// shows only when a panel page really is behind this one.
export function BackDoor({ className }: { className?: string }) {
  const pathname = usePanelPathname();
  const back = useBackTarget();
  const { nav, host, t } = usePanel();
  if (!back || pathname === host.home) return null;
  const room = roomFor(nav, foldPath(back.url.split("?")[0] ?? "", host.fold), host.home);
  const label = room ? t("Back to {room}", { room: t(room.label) }) : t("Back to the last page");
  return (
    <button
      type="button"
      onClick={() => window.history.go(-back.steps)}
      data-back-door
      aria-label={label}
      title={label}
      className={cn(CTRL_BTN, "shrink-0", className)}
    >
      <ArrowLeft aria-hidden="true" className="rtl:-scale-x-100" />
    </button>
  );
}
