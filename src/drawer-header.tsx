"use client";

import { useEffect } from "react";
import { useDrawerHeaderSetter, type DrawerHeaderData } from "./drawer";
import { usePanelT } from "./panel-provider";
import { EditSeat, useRecordEditing } from "./record-editing";

// The one header every record opens with. Inside a Drawer it publishes the
// title, badge, subline, context and actions into the drawer's header band
// and draws nothing itself — so a drawer never carries two headings. On a full
// page (the same record rendered at its own route) it draws the heading
// inline. RecordHeader is the list page's sibling that publishes to the top bar.
export function DrawerHeader({
  title,
  badge,
  actions,
  sub,
  context,
  editable = false,
}: DrawerHeaderData & {
  /** Seat the pencil after the actions; needs a RecordEditingProvider above. */
  editable?: boolean;
}) {
  const t = usePanelT();
  const publish = useDrawerHeaderSetter();
  const { editing, setEditing } = useRecordEditing();
  useEffect(() => {
    if (!publish) return;
    publish({
      title,
      badge,
      actions: editable ? (
        <>
          {actions}
          <EditSeat editing={editing} onEdit={() => setEditing(true)} />
        </>
      ) : (
        actions
      ),
      sub,
      context,
    });
    return () => publish(null);
  }, [publish, title, badge, actions, sub, context, editable, editing, setEditing]);
  if (publish) return null;
  return (
    <div className="mb-5 flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">{t(title)}</h2>
          {badge}
        </div>
        {actions ? <div className="ms-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {context ?? null}
      {sub ? <p className="text-[13px] text-quiet">{t(sub)}</p> : null}
    </div>
  );
}
