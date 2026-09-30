"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { CTRL_BTN } from "./classes";
import { cn } from "./cn";
import { roomFor } from "./nav";
import { backTarget, canReadHistory, previousPanelUrl } from "./nav-memory";
import { usePanel } from "./panel-provider";
import { usePanelPathname } from "./use-panel-pathname";

// The drawer's close, in the top bar, on a record opened as a full page (a
// refresh or a pasted link to /<room>/<id>). It returns to wherever the
// record was opened from — its filtered list (Elite Touch, 18 Aug 2026:
// re-picking the filter after every job), or the dashboard row that opened
// it (12 Sep: back to the dashboard, not to a bare list). Going back through
// history keeps the filters and the scroll; the bare link to the room stays
// for a fresh tab. Renders nothing off a record page. An app seats it in
// PanelProvider `tools`.
export function CollapseButton() {
  const pathname = usePanelPathname();
  const router = useRouter();
  const { nav, host, t } = usePanel();
  const room = roomFor(nav, pathname, host.home);
  // A record page is one segment under its room, and not the room's create page.
  const rest = room ? pathname.slice(room.href.length).split("/").filter(Boolean) : [];
  if (!room || rest.length !== 1 || rest[0] === "new") return null;

  return (
    <Link
      href={room.href}
      onClick={(e) => {
        if (canReadHistory()) {
          const back = backTarget(host);
          if (back) {
            e.preventDefault();
            window.history.go(-back.steps);
          }
          return;
        }
        // A browser that can't list its history: the remembered last page.
        const prev = previousPanelUrl();
        if (prev && prev.split("?")[0] !== pathname) {
          e.preventDefault();
          router.back();
        }
      }}
      aria-label={t("Close")}
      title={t("Close")}
      className={cn(CTRL_BTN, "hidden w-9 justify-center px-0 lg:flex")}
    >
      <X aria-hidden="true" />
    </Link>
  );
}
