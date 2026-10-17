"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Car, Repeat } from "lucide-react";
import { useCalendar } from "./calendar-context";
import {
  dropAt,
  isOn,
  isTimed,
  moveOf,
  placeAllDay,
  placeDay,
  SNAP,
  type CalendarColumn,
  type CalendarItem,
  type CalendarMove,
  type GridDrag,
  type TimedItem,
} from "./calendar-layout";
import { DAY_END, hhmm, officeClock } from "./calendar-time";

/** One hour of the time grid, in pixels. */
const HOUR = 52;
const GUTTER = 56;

/** A column of the grid, with its head. */
export type GridColumn = CalendarColumn & { key: string; head: React.ReactNode; today: boolean; weekend: boolean };

/** Where a new item goes: a tap gives its start, a drag down the grid its start and end. */
export type CalendarSlot = { day: string; from: number; to?: number; person?: string };

type MoveDrag = Omit<GridDrag, "colWidth" | "hour" | "cols" | "across"> & { id: string; x: number; y: number; width: number; rtl: boolean; moved: boolean };
type DrawDrag = { kind: "draw"; col: number; y: number; start: number; end: number; moved: boolean };

const down = (minutes: number, step: number) => Math.floor(minutes / step) * step;
const up = (minutes: number, step: number) => Math.ceil(minutes / step) * step;
const clock24 = (minutes: number) => (minutes === DAY_END ? "24:00" : hhmm(minutes));

/** An item drawn down the grid: the quarter hours it covers, one at least. */
function drawn(d: { start: number; end: number }) {
  const from = Math.min(DAY_END - SNAP, down(Math.min(d.start, d.end), SNAP));
  return { from, to: Math.min(DAY_END, Math.max(from + SNAP, up(Math.max(d.start, d.end), SNAP))) };
}

/**
 * The time grid: the hours down the side, a column per day or per person,
 * the all-day items in a lane over it. An editable item can be dragged to
 * another hour (and, between days, another day; between people, another
 * person), its foot dragged to change its end; on an empty stretch a tap
 * books at that half hour and a drag draws the item's length. In the people
 * view a person's time off hatches their column.
 */
export function TimeGrid({
  columns,
  across,
  items,
  nowMinutes,
  canAdd,
  canEdit,
  onSlot,
  onMove,
}: {
  columns: GridColumn[];
  /** May a move change column? The week's days, and people when a hand-over is allowed. */
  across: boolean;
  items: CalendarItem[];
  nowMinutes: number;
  canAdd: boolean;
  canEdit: boolean;
  onSlot: (slot: CalendarSlot) => void;
  onMove: (item: CalendarItem, move: CalendarMove) => void;
}) {
  const { clock, w, t, onOpen } = useCalendar();
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const [drag, setDragState] = useState<MoveDrag | DrawDrag | null>(null);
  // The drag as the window's listeners read it, kept in step from the handlers.
  const dragRef = useRef<MoveDrag | DrawDrag | null>(null);
  const setDrag = (next: MoveDrag | DrawDrag | null) => {
    dragRef.current = next;
    setDragState(next);
  };

  const hasToday = columns.some((c) => c.today);
  const people = columns.some((c) => c.person);

  // Open on the working day: an hour and a half before now on today, else at half past seven.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = (hasToday ? Math.max(0, nowMinutes / 60 - 1.5) : 7.5) * HOUR;
    // Only on arrival: a refresh after a save must not jump the grid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const own = useMemo(() => columns.map((c) => (c.person ? items.filter((i) => i.people.includes(c.person!)) : items)), [columns, items]);
  // In the people view time off is the column's ground, not an item among the others.
  const placed = useMemo(() => columns.map((c, col) => placeDay(people ? own[col].filter((i) => !i.away) : own[col], c.day, clock)), [columns, own, people, clock]);
  const bands = useMemo(
    () =>
      columns.map((c, col) =>
        people
          ? own[col]
              .filter((i) => i.away && i.status !== "cancelled" && isOn(i, c.day, clock))
              .map((i) => {
                if (!isTimed(i)) return { id: i.id, from: 0, to: DAY_END };
                const start = officeClock(i.start, clock);
                const end = officeClock(i.end, clock);
                return { id: i.id, from: start.day < c.day ? 0 : start.minutes, to: end.day > c.day ? DAY_END : end.minutes };
              })
          : [],
      ),
    [columns, own, people, clock],
  );
  const lane = useMemo(() => placeAllDay(items, columns, clock), [items, columns, clock]);

  /** The minutes of the day at a height on screen. */
  const minutesAt = (clientY: number) => {
    const top = columnsRef.current?.getBoundingClientRect().top ?? 0;
    return Math.min(DAY_END, Math.max(0, ((clientY - top) / HOUR) * 60));
  };

  const dropOf = (d: MoveDrag) => dropAt({ ...d, colWidth: d.width, hour: HOUR, cols: columns.length, across });

  useEffect(() => {
    if (!drag) return;
    const moveAt = (e: PointerEvent) => {
      const cur = dragRef.current;
      if (!cur) return;
      if (cur.kind === "draw") {
        setDrag({ ...cur, end: minutesAt(e.clientY), moved: cur.moved || Math.abs(e.clientY - cur.y) > 4 });
        return;
      }
      const dx = e.clientX - cur.x;
      const dy = e.clientY - cur.y;
      setDrag({ ...cur, dx, dy, moved: cur.moved || Math.hypot(dx, dy) > 4 });
    };
    const release = () => {
      const cur = dragRef.current;
      setDrag(null);
      if (!cur) return;
      const column = columns[cur.col];
      if (cur.kind === "draw") {
        if (!cur.moved) return onSlot({ day: column.day, from: Math.min(23 * 60, down(cur.start, 30)), person: column.person });
        return onSlot({ day: column.day, ...drawn(cur), person: column.person });
      }
      const item = byId.get(cur.id);
      if (!item || !isTimed(item)) return;
      if (!cur.moved) return onOpen(item);
      const move = moveOf(columns, cur.col, dropOf(cur), clock);
      // By the moment, not the text: a database writes "+00:00" where the clock writes "Z".
      const same = Date.parse(move.start) === Date.parse(item.start) && Date.parse(move.end) === Date.parse(item.end);
      if (!same || move.toPerson) onMove(item, move);
    };
    // A touch that turns into a scroll is the browser's, not a drag.
    const cancel = () => setDrag(null);
    window.addEventListener("pointermove", moveAt);
    window.addEventListener("pointerup", release, { once: true });
    window.addEventListener("pointercancel", cancel, { once: true });
    return () => {
      window.removeEventListener("pointermove", moveAt);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", cancel);
    };
    // The listeners read the drag through its ref; they are set once a drag begins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null]);

  const grab = (e: React.PointerEvent, item: TimedItem, from: number, to: number, col: number, kind: MoveDrag["kind"]) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (!canEdit || !item.editable) return onOpen(item);
    const box = columnsRef.current;
    const width = (box?.clientWidth ?? 0) / columns.length || 1;
    const rtl = box ? getComputedStyle(box).direction === "rtl" : false;
    setDrag({ kind, id: item.id, x: e.clientX, y: e.clientY, col, width, rtl, from, to, dx: 0, dy: 0, moved: false });
  };

  const draw = (e: React.PointerEvent<HTMLDivElement>, col: number) => {
    if (e.button !== 0 || e.target !== e.currentTarget || !canAdd) return;
    // A mouse drawing an item must not select the grid's text on the way.
    if (e.pointerType === "mouse") e.preventDefault();
    const at = minutesAt(e.clientY);
    setDrag({ kind: "draw", col, y: e.clientY, start: at, end: at, moved: false });
  };

  const moving = drag && drag.kind !== "draw" ? drag : null;
  const ghost = moving?.moved ? dropOf(moving) : null;
  const drawing = drag?.kind === "draw" && drag.moved ? { col: drag.col, ...drawn(drag) } : null;

  const itemAt = (item: TimedItem, col: number, from: number, to: number, lane: number, lanes: number, live: boolean) => (
    <GridItem
      key={item.id}
      item={item}
      from={from}
      to={to}
      lane={lane}
      lanes={lanes}
      dragging={live}
      draggable={canEdit && item.editable}
      onPointerDown={(e, kind) => grab(e, item, from, to, col, kind)}
    />
  );

  const template = { gridTemplateColumns: `${GUTTER}px repeat(${columns.length}, minmax(0, 1fr))` };

  return (
    <div className="cal-card">
      <div className="cal-heads" style={template}>
        <span />
        {columns.map((c) => (
          <div key={c.key} className="cal-head" data-today={c.today || undefined} data-weekend={c.weekend || undefined}>
            {c.head}
          </div>
        ))}
      </div>
      {lane.bars.length ? (
        <div className="cal-allday" style={{ ...template, gridTemplateRows: `repeat(${lane.rows}, 24px)` }}>
          <span className="cal-allday-label" style={{ gridRow: `1 / span ${lane.rows}` }}>
            {t(w.allDay)}
          </span>
          {lane.bars.map((bar) => (
            <AllDayBar key={`${bar.item.id}-${bar.col}`} bar={bar} />
          ))}
        </div>
      ) : null}
      <div ref={scrollRef} className="cal-scroll">
        <div className="relative grid" style={{ gridTemplateColumns: `${GUTTER}px minmax(0, 1fr)`, height: 24 * HOUR }}>
          <div className="relative">
            {Array.from({ length: 23 }, (_, i) => (
              <span key={i} className="cal-hour" style={{ top: (i + 1) * HOUR }}>
                {hhmm((i + 1) * 60)}
              </span>
            ))}
            {hasToday ? (
              <span className="cal-hour cal-hour-now" style={{ top: (nowMinutes / 60) * HOUR }}>
                {hhmm(nowMinutes)}
              </span>
            ) : null}
          </div>
          <div ref={columnsRef} className="cal-columns" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {columns.map((c, col) => (
              <div key={c.key} className="cal-day" data-weekend={c.weekend || undefined} onPointerDown={(e) => draw(e, col)}>
                {bands[col].map((b) => (
                  <span key={b.id} className="cal-away" style={{ top: (b.from / 60) * HOUR, height: ((b.to - b.from) / 60) * HOUR }} aria-hidden />
                ))}
                {placed[col].map((p) => {
                  const live = Boolean(ghost && moving?.id === p.item.id);
                  // A move across columns leaves its column; within one (the
                  // people side by side, no hand-over) it moves in every column it sits in.
                  if (live && across && ghost!.col !== col) return null;
                  return live ? itemAt(p.item, col, ghost!.from, ghost!.to, 0, 1, true) : itemAt(p.item, col, p.from, p.to, p.lane, p.lanes, false);
                })}
                {/* An item dragged in from another column is drawn in this one. */}
                {across && ghost && moving && ghost.col === col && !placed[col].some((p) => p.item.id === moving.id) && byId.get(moving.id)
                  ? itemAt(byId.get(moving.id) as TimedItem, col, ghost.from, ghost.to, 0, 1, true)
                  : null}
                {drawing?.col === col ? (
                  <div className="cal-draw" style={{ top: (drawing.from / 60) * HOUR, height: ((drawing.to - drawing.from) / 60) * HOUR - 2 }}>
                    <span>
                      {clock24(drawing.from)} – {clock24(drawing.to)}
                    </span>
                  </div>
                ) : null}
                {c.today ? <span className="cal-now" style={{ top: (nowMinutes / 60) * HOUR }} /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AllDayBar({ bar }: { bar: ReturnType<typeof placeAllDay>["bars"][number] }) {
  const { colourOf, warned, kindIcon, onOpen } = useCalendar();
  const { item } = bar;
  const Icon = kindIcon?.(item.kind);
  return (
    <button
      type="button"
      className="cal-allday-item"
      data-away={item.away || undefined}
      data-status={item.status}
      data-warning={warned.get(item.id)?.[0]?.kind}
      style={{ gridColumn: `${bar.col + 2} / span ${bar.span}`, gridRow: bar.row + 1, "--c": colourOf(item) } as React.CSSProperties}
      onClick={() => onOpen(item)}
      title={item.title}
    >
      {Icon ? <Icon className="cal-kind-icon" strokeWidth={2.2} aria-hidden /> : null}
      <span className="truncate">{item.title}</span>
    </button>
  );
}

function GridItem({
  item,
  from,
  to,
  lane,
  lanes,
  dragging,
  draggable,
  onPointerDown,
}: {
  item: TimedItem;
  from: number;
  to: number;
  lane: number;
  lanes: number;
  dragging: boolean;
  draggable: boolean;
  onPointerDown: (e: React.PointerEvent, kind: "move" | "resize") => void;
}) {
  const { t, w, colourOf, personColour, nameOf, warned, kindIcon, onOpen } = useCalendar();
  const colour = colourOf(item);
  const warning = warned.get(item.id)?.[0]?.kind;
  const Icon = kindIcon?.(item.kind);
  const top = (from / 60) * HOUR;
  const height = Math.max(20, ((to - from) / 60) * HOUR - 2);
  const left = `calc(${(lane / lanes) * 100}% + 3px)`;
  const width = `calc(${100 / lanes}% - 6px)`;
  const travel = item.travelMinutes ?? 0;
  return (
    <>
      {travel > 0 && !dragging ? (
        <div className="cal-travel" style={{ top: top - (travel / 60) * HOUR, height: (travel / 60) * HOUR - 2, left, width, "--c": colour } as React.CSSProperties}>
          {(travel / 60) * HOUR > 18 ? (
            <span>
              <Car className="size-3" strokeWidth={2} /> {t(w.drive, { n: travel })}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        role="button"
        tabIndex={0}
        className="cal-meeting"
        data-status={item.status}
        data-warning={warning}
        data-away={item.away || undefined}
        data-fixed={!draggable || undefined}
        data-dragging={dragging || undefined}
        data-short={height < 40 || undefined}
        style={{ top, height, left, width, "--c": colour } as React.CSSProperties}
        onPointerDown={(e) => onPointerDown(e, "move")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(item);
          }
        }}
        title={item.title}
      >
        <span className="cal-meeting-title">
          {warning ? <AlertTriangle className="cal-warn-icon" strokeWidth={2.2} /> : null}
          {Icon ? <Icon className="cal-kind-icon" strokeWidth={2.2} aria-hidden /> : null}
          {item.seriesId ? <Repeat className="cal-repeat-icon" strokeWidth={2.2} aria-label={t(w.repeats)} /> : null}
          {item.title}
        </span>
        {height >= 40 ? (
          <span className="cal-meeting-meta">
            {clock24(from)}–{clock24(to)}
            {item.location ? ` · ${item.location}` : ""}
          </span>
        ) : null}
        {height >= 58 && item.people.length ? (
          <span className="cal-meeting-people">
            {item.people.slice(0, 4).map((p) => (
              <i key={p} style={{ background: personColour(p) }} title={nameOf(p)} />
            ))}
          </span>
        ) : null}
        {draggable ? <span className="cal-meeting-foot" onPointerDown={(e) => onPointerDown(e, "resize")} aria-hidden /> : null}
      </div>
    </>
  );
}
