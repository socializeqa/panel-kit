"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ArrowUpToLine, GripVertical } from "lucide-react";
import type { ActionResult } from "./action-result";
import { buttonClass, glyphSeat, PANEL_SHELL } from "./classes";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";
import { SeatStrip } from "./seat-strip";
import { useToast } from "./toast";

/** A list with one item moved from one place to another; the rest keep their order. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length || to < 0 || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// An order to set by hand: the pieces of a shop, the photos of a listing, the
// rooms of a menu. A mouse drags a row by its grip; every row also carries
// up, down and to-the-top seats, so a keyboard and a phone can do the same.
// Nothing is saved while moving: once the order differs from the one on
// file, Save the order and Put it back appear, and Save hands the app the
// keys in their new order. No motion on a move: it answers a press that may
// come many times in a row, and a slide would only slow it down.
export function ReorderList<T>({
  items,
  keyOf,
  render,
  onSave,
  label = "Order",
}: {
  items: T[];
  keyOf: (item: T) => string;
  /** The row's contents between the grip and the seats. */
  render: (item: T, place: number) => React.ReactNode;
  /** Saves the keys in their new order. */
  onSave: (keys: string[]) => Promise<ActionResult>;
  /** What the list is, for a screen reader. */
  label?: string;
}) {
  const t = usePanelT();
  const toast = useToast();
  const [order, setOrder] = useState(items);
  const [dragged, setDragged] = useState<string | null>(null);
  const [saving, start] = useTransition();
  const changed = order.some((item, i) => keyOf(item) !== keyOf(items[i]));

  const save = () =>
    start(async () => {
      const result = await onSave(order.map(keyOf));
      if (result.ok) toast(result.message ?? t("Order saved"));
      else toast(result.error, "error");
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <ol aria-label={t(label)} className={cn(PANEL_SHELL, "min-h-0 flex-1 divide-y divide-ink/[0.07] overflow-y-auto")}>
        {order.map((item, i) => {
          const key = keyOf(item);
          return (
            <li
              key={key}
              draggable
              onDragStart={(e) => {
                setDragged(key);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!dragged || dragged === key) return;
                setOrder((now) => moveItem(now, now.findIndex((o) => keyOf(o) === dragged), now.findIndex((o) => keyOf(o) === key)));
              }}
              onDragEnd={() => setDragged(null)}
              className={cn("flex items-center gap-3 bg-surface px-3 py-2", dragged === key && "bg-brand-soft")}
            >
              <span aria-hidden="true" className="cursor-grab text-ink/30 active:cursor-grabbing">
                <GripVertical size={16} strokeWidth={2} />
              </span>
              <span className="w-8 shrink-0 text-end text-[12px] tabular-nums text-ink/40">{i + 1}</span>
              <div className="min-w-0 flex-1">{render(item, i)}</div>
              <SeatStrip>
                <button type="button" onClick={() => setOrder((now) => moveItem(now, i, 0))} disabled={i === 0} aria-label={t("Move to the top")} title={t("Move to the top")} className={glyphSeat()}>
                  <ArrowUpToLine aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setOrder((now) => moveItem(now, i, i - 1))} disabled={i === 0} aria-label={t("Move up")} title={t("Move up")} className={glyphSeat()}>
                  <ArrowUp aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setOrder((now) => moveItem(now, i, i + 1))} disabled={i === order.length - 1} aria-label={t("Move down")} title={t("Move down")} className={glyphSeat()}>
                  <ArrowDown aria-hidden="true" />
                </button>
              </SeatStrip>
            </li>
          );
        })}
      </ol>
      {changed ? (
        <div className="flex shrink-0 items-center justify-end gap-2">
          <button type="button" onClick={() => setOrder(items)} disabled={saving} className={buttonClass({ variant: "ghost", size: "md" })}>
            {t("Put it back")}
          </button>
          <button type="button" onClick={save} disabled={saving} className={buttonClass({ variant: "primary", size: "md" })}>
            {saving ? t("Saving…") : t("Save the order")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
