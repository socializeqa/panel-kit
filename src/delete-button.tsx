"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ActionResult } from "./action-result";
import { FOLD_ACTION, iconBtnClass } from "./classes";
import { cn } from "./cn";
import { Button } from "./fields";
import { HeaderFold } from "./header-fold";
import { ConfirmDialog, type Consequence } from "./modal";
import { usePanelT } from "./panel-provider";

// The shared destructive action for a record — the danger button and the
// confirm gate, so every record gets it the same way. If the action answers a
// refusal ({ ok: false }, "you can't remove the last owner"), the reason shows
// in the gate instead of throwing. On success it closes and, when given, goes
// to `afterHref` (for an action that revalidates but doesn't redirect).
export function DeleteButton({
  id,
  action,
  title,
  body,
  label = "Delete",
  confirmLabel = "Delete",
  afterHref,
  className,
  menu = false,
  iconOnly = false,
  consequences,
  reason,
}: {
  id: string;
  action: (formData: FormData) => void | Promise<void | ActionResult>;
  title: string;
  body: string;
  /** What follows — every destructive door states it. */
  consequences?: Consequence[];
  /** Ask why — the line rides in the form as `reason` and lands on the record. */
  reason?: { label: string; placeholder?: string; required?: boolean };
  label?: string;
  confirmLabel?: string;
  afterHref?: string;
  className?: string;
  /** Fold behind a drawer header's ⋯ seat instead of a danger outline button —
   *  a destructive act never sits beside Save. */
  menu?: boolean;
  /** A bin on a line of a list — the label becomes its name. */
  iconOnly?: boolean;
}) {
  const t = usePanelT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const close = () => {
    setOpen(false);
    setError(null);
  };

  return (
    <>
      {menu ? (
        // Folded away beside the header's ⋯ until asked for.
        <HeaderFold>
          {(fold, revealed) => (
            <button
              type="button"
              tabIndex={revealed ? 0 : -1}
              onClick={() => {
                fold();
                setOpen(true);
              }}
              className={cn(FOLD_ACTION, "text-danger hover:border-danger/40 hover:bg-danger-soft hover:text-danger")}
            >
              <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
              {t(label)}
            </button>
          )}
        </HeaderFold>
      ) : iconOnly ? (
        <button
          type="button"
          aria-label={t(label)}
          title={t(label)}
          onClick={() => setOpen(true)}
          className={cn(iconBtnClass(8, "danger"), className)}
        >
          <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      ) : (
        // A quiet outline — a destructive act shouldn't shout next to the
        // primary button.
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(true)}
          className={cn("border-danger/30 text-danger hover:border-danger/40 hover:bg-danger-soft hover:text-danger", className)}
        >
          {t(label)}
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onClose={close}
        pending={pending}
        error={error}
        onConfirm={(why) => {
          setError(null);
          const fd = new FormData();
          fd.set("id", id);
          if (why) fd.set("reason", why);
          // The way out travels WITH the action: deleting the record a page
          // is built on re-renders it as a 404 in the same response, and a
          // router.push queued after that never lands. The action redirects
          // server-side; the push below is the fallback for one that doesn't
          // read the field.
          if (afterHref) fd.set("after", afterHref);
          start(async () => {
            const res = await action(fd);
            if (res && !res.ok) {
              setError(res.error);
              return;
            }
            close();
            if (afterHref) router.push(afterHref);
          });
        }}
        title={title}
        body={body}
        consequences={consequences}
        reason={reason}
        confirmLabel={confirmLabel}
      />
    </>
  );
}
