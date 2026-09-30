"use client";

import { useEffect } from "react";
import { useDrawerDirty } from "./drawer";
import { Button } from "./fields";
import { usePanelT } from "./panel-provider";

// The Save for a form that hand-rolls its own submit (RecordForm carries its
// own). It stays greyed out until the drawer holds unsaved edits and greys out
// again after a good save — a record with nothing pending never shows a live
// "Save". Outside a drawer there is no dirty tracking, so it behaves normally.
export function SaveButton({
  pending,
  result,
  gateOnDirty = true,
  children = "Save changes",
  pendingLabel = "Saving…",
  ...rest
}: {
  pending: boolean;
  result?: { ok?: boolean } | null;
  // Grey out until there are unsaved edits. False for a create or add action,
  // where a custom picker may not report its change.
  gateOnDirty?: boolean;
  children?: string;
  pendingLabel?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    variant?: "primary" | "ghost" | "danger";
  }) {
  const t = usePanelT();
  const { isDirty, markClean } = useDrawerDirty();

  // A save that keeps the drawer open settles it back to clean.
  useEffect(() => {
    if (result?.ok) markClean();
  }, [result, markClean]);

  return (
    <Button {...rest} type="submit" disabled={pending || (gateOnDirty && !isDirty)}>
      {pending ? t(pendingLabel) : t(children)}
    </Button>
  );
}
