"use client";

import { createContext, useState } from "react";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";

// Lets a menu row close the popover itself — a row that calls a server action
// directly (a click and a transition, not a form submit) closes once the work
// resolves, so the menu shuts cleanly instead of lingering.
export const DecisionMenuClose = createContext<() => void>(() => {});

// One row inside a menu (RowMenu). Wrap a <button>'s content, or pass `danger`
// for a destructive path. `confirm` makes the row two-step: the first click
// arms it (the words swap to the confirm text), the second fires — a dialog
// can't live inside a menu that closes on an outside click, but a destructive
// act still must not fire on one stray click.
// (Elite Touch's file also carries its journeys' turn vocabulary; the kit
// takes only the menu row every ⋯ menu is built from.)
export function DecisionItem({
  children,
  onClick,
  danger = false,
  disabled = false,
  confirm,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  confirm?: string;
}) {
  const t = usePanelT();
  const [armed, setArmed] = useState(false);
  const needsArming = !!confirm && !armed;
  return (
    <button
      type={onClick || needsArming ? "button" : "submit"}
      onClick={(e) => {
        if (needsArming) {
          e.preventDefault();
          setArmed(true);
          return;
        }
        onClick?.();
      }}
      disabled={disabled}
      data-menu-close={needsArming ? undefined : ""}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-start text-[13px] font-medium transition-colors disabled:opacity-40",
        danger ? "text-danger hover:bg-danger-soft" : "text-ink/75 hover:bg-ink/[0.04] hover:text-ink",
        armed && "bg-danger-soft",
      )}
    >
      {armed && confirm ? t(confirm) : children}
    </button>
  );
}
