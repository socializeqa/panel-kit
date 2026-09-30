"use client";

import { useCallback, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { iconBtnClass, POPOVER_SHELL } from "./classes";
import { cn } from "./cn";
import { DecisionMenuClose } from "./decision-bar";
import { usePanelT } from "./panel-provider";

// The ⋯ menu: a quiet icon button opening a floating list in the same dress as
// every SelectMenu — portalled on a Radix Popover so no card or sticky bar
// clips it, anchored to its button's end. DecisionItem rows inside. One kebab
// per row, one red thing at most.
// A dialog can't live INSIDE this menu (closing unmounts it); a row that needs
// one sets state and renders the dialog as a sibling.
export function RowMenu({
  label = "More actions",
  className,
  icon: Icon = MoreHorizontal,
  children,
}: {
  label?: string;
  /** Replace the trigger's dress — the top bar hands in its 36px seat. */
  className?: string;
  /** The trigger's glyph — a create menu opens on a +. */
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  const t = usePanelT();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={t(label)}
        title={t(label)}
        className={cn(className ?? iconBtnClass(8, "ink"), "data-[state=open]:bg-ink/[0.06] data-[state=open]:text-ink")}
      >
        <Icon aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          role="menu"
          align="end"
          sideOffset={6}
          collisionPadding={12}
          onClick={(e) => {
            // Close one tick later: a row's action must dispatch before the
            // menu unmounts.
            const el = e.target as HTMLElement;
            if (el.closest("[data-menu-close]")) setTimeout(close, 0);
          }}
          className={cn(POPOVER_SHELL, "w-56 p-1")}
        >
          <DecisionMenuClose.Provider value={close}>{children}</DecisionMenuClose.Provider>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
