"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "./cn";
import { useDrawerHeaderSetter, type DrawerHeaderData } from "./drawer";
import { usePanelT } from "./panel-provider";
import { EditSeat, RecordEditingProvider, useRecordEditing } from "./record-editing";

export interface DrawerTab {
  key: string;
  label: string;
  /** A rendered glyph — an element, so a server component can hand it over. */
  icon: ReactNode;
  /** A count after the label — requests on a file, documents in a room. */
  count?: number;
  content: ReactNode;
}

// A record drawer's rooms — Profile, Requests, Money, Documents — as one fused
// strip in the header band, one room on screen at a time. It replaced the
// stack of unrelated cards a record used to scroll through (Damine, 23 Aug
// 2026: "messy"). The strip is published into the drawer's header like the
// title is, so it sits with the record's name and never scrolls away.
type DrawerTabsProps = Omit<DrawerHeaderData, "tabs"> & {
  tabs: DrawerTab[];
  initial?: string;
  /** Show the pencil seat; the form room reads useRecordEditing(). */
  editable?: boolean;
};

export function DrawerTabs(props: DrawerTabsProps) {
  // The editing flag lives above the rooms, so the header's seat and the form
  // room read the same one. Without `editable` every room stays editable.
  return props.editable ? (
    <RecordEditingProvider>
      <Tabs {...props} />
    </RecordEditingProvider>
  ) : (
    <Tabs {...props} />
  );
}

function Tabs({ title, badge, actions, sub, context, tabs, initial, editable = false }: DrawerTabsProps) {
  const t = usePanelT();
  const [active, setActive] = useState(initial ?? tabs[0]?.key ?? "");
  const { editing, setEditing } = useRecordEditing();
  const publish = useDrawerHeaderSetter();

  const editSeat = editable ? <EditSeat editing={editing} onEdit={() => setEditing(true)} /> : null;

  // A tab is chosen by a click or by the arrow keys the tablist brings;
  // nothing slides — switching rooms is frequent, so it is instant.
  const strip = (
    <div role="tablist" aria-label={t("Sections")} className="flex">
      {tabs.map((tab, i) => {
        const on = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setActive(tab.key)}
            className={cn(
              // On its own line (a narrow drawer) the pills share the width;
              // beside the title they size to their words.
              "inline-flex h-9 flex-1 items-center justify-center gap-2 border px-3.5 text-[13px] font-medium transition-colors @[1080px]:flex-none",
              i > 0 && "-ms-px",
              i === 0 && "rounded-s-control",
              i === tabs.length - 1 && "rounded-e-control",
              on
                ? "relative z-[1] border-brand-deep bg-brand-soft text-brand-deep"
                : "border-ink/15 bg-surface text-ink/60 hover:text-ink",
            )}
          >
            {tab.icon}
            {t(tab.label)}
            {tab.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums",
                  on ? "bg-brand/15 text-brand-deep" : "bg-ink/[0.06] text-quiet",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );

  useEffect(() => {
    if (!publish) return;
    publish({
      title,
      badge,
      actions: (
        <>
          {actions}
          {editSeat}
        </>
      ),
      sub,
      context,
      tabs: strip,
    });
    return () => publish(null);
    // The strip re-renders with `active`, the seat with `editing`; those are
    // what change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publish, title, badge, actions, sub, context, active, tabs, editing, editable]);

  const current = tabs.find((tab) => tab.key === active) ?? tabs[0];
  return (
    <>
      {/* Outside a drawer the strip has nowhere to go; draw it inline so
          nothing is lost. */}
      {!publish ? <div className="mb-4">{strip}</div> : null}
      <div role="tabpanel" className="flex min-h-full flex-1 flex-col">
        {current?.content}
      </div>
    </>
  );
}
