"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, SquarePen, Trash2 } from "lucide-react";
import type { ActionResult } from "./action-result";
import { iconBtnClass } from "./classes";
import { ConfirmDialog } from "./modal";
import { usePanelT } from "./panel-provider";

// A row's View / Edit / Delete, for a list whose records open as a full page.
// View and Edit both open the record (which is the editable form); Delete asks
// at the gate, then runs the room's action. A list whose records open in a
// drawer uses SeatStrip and RowMenu instead.
export function RowActions({
  viewHref,
  editHref,
  id,
  deleteAction,
  deleteLabel = "Delete",
  deleteIcon,
  confirmTitle = "",
  confirmBody = "",
  confirmLabel = "Delete",
  reason,
}: {
  viewHref: string;
  editHref?: string;
  id: string;
  // May answer a refusal — a guard that blocks the delete surfaces its words
  // in the gate instead of throwing. Leave it out for someone who may not
  // delete: the bin disappears rather than dead-ending.
  deleteAction?: (formData: FormData) => void | Promise<void | ActionResult>;
  /** The destructive seat can carry another verb (Void) — icon and name. */
  deleteLabel?: string;
  deleteIcon?: React.ReactNode;
  confirmTitle?: string;
  confirmBody?: string;
  confirmLabel?: string;
  /** Ask why — the line rides in the form as `reason`, as in DeleteButton. */
  reason?: { label: string; placeholder?: string; required?: boolean };
}) {
  const t = usePanelT();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setConfirming(false);
    setError(null);
  };

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link href={viewHref} aria-label={t("View")} title={t("View")} className={iconBtnClass(7, "ink")}>
        <Eye className="size-4" strokeWidth={1.9} />
      </Link>
      <Link href={editHref ?? viewHref} aria-label={t("Edit")} title={t("Edit")} className={iconBtnClass(7, "ink")}>
        <SquarePen className="size-4" strokeWidth={1.9} />
      </Link>
      {deleteAction ? (
        <>
          <button
            type="button"
            aria-label={t(deleteLabel)}
            title={t(deleteLabel)}
            onClick={() => setConfirming(true)}
            className={iconBtnClass(7, "danger")}
          >
            {deleteIcon ?? <Trash2 className="size-4" strokeWidth={1.9} />}
          </button>
          <ConfirmDialog
            open={confirming}
            onClose={close}
            pending={pending}
            error={error}
            onConfirm={(why) => {
              setError(null);
              const fd = new FormData();
              fd.set("id", id);
              if (why) fd.set("reason", why);
              startTransition(async () => {
                const res = await deleteAction(fd);
                // A good delete redirects (no answer). A refused one answers
                // { ok: false, error } — the gate stays open and says why.
                if (res && !res.ok) setError(res.error);
                else close();
              });
            }}
            title={confirmTitle}
            body={confirmBody}
            reason={reason}
            confirmLabel={confirmLabel}
          />
        </>
      ) : null}
    </div>
  );
}
