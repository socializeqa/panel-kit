import { describe, expect, it } from "vitest";
import { dropAt, itemDays, moveOf, placeAllDay, placeDay, warnings, type CalendarColumn, type CalendarItem, type GridDrag, type TimedItem } from "../src/calendar-layout";
import { addDays, monthGrid, officeClock, officeMoment, weekStart } from "../src/calendar-time";

/**
 * The calendar's arithmetic, on the office's clock (Doha's by default): an
 * item lands on the day and the minute it was booked, the week starts on
 * Sunday, overlapping items share a day's width, all-day items stack in a
 * lane, a drag lands on the quarter hour and in the column it was let go
 * over, and the calendar warns when a person is in two places at once, has
 * no time to drive, or is away.
 */
const at = (day: string, time: string) => officeMoment(day, time);
const item = (id: string, day: string, from: string, to: string, people: string[], over: Partial<TimedItem> = {}): TimedItem => ({
  id,
  kind: "meeting",
  title: id,
  start: at(day, from),
  end: at(day, to),
  people,
  travelMinutes: 0,
  status: "confirmed",
  editable: true,
  ...over,
});
const allDay = (id: string, day: string, endDay: string | undefined, people: string[], over: Partial<CalendarItem> = {}): CalendarItem =>
  ({ id, kind: "leave", title: id, allDay: true, day, endDay, people, editable: false, ...over }) as CalendarItem;

describe("the office's clock", () => {
  it("keeps the wall clock whatever the machine's zone", () => {
    expect(officeMoment("2026-10-14", "10:00")).toBe("2026-10-14T07:00:00.000Z");
    expect(officeClock("2026-10-14T07:00:00.000Z")).toEqual({ day: "2026-10-14", minutes: 600 });
    expect(officeClock("2026-10-14T22:30:00.000Z")).toEqual({ day: "2026-10-15", minutes: 90 });
  });

  it("starts the week on Sunday and shows six weeks a month", () => {
    expect(weekStart("2026-10-14")).toBe("2026-10-11");
    const grid = monthGrid("2026-10-14");
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-09-27");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("placing a day", () => {
  it("gives a lone item the whole width", () => {
    const [p] = placeDay([item("a", "2026-10-14", "09:00", "10:00", ["r"])], "2026-10-14");
    expect(p).toMatchObject({ from: 540, to: 600, lane: 0, lanes: 1 });
  });

  it("shares the width between items that overlap, and only those", () => {
    const day = "2026-10-14";
    const placed = placeDay([item("a", day, "09:00", "10:00", ["r"]), item("b", day, "09:30", "10:30", ["h"]), item("c", day, "11:00", "12:00", ["r"])], day);
    const by = Object.fromEntries(placed.map((p) => [p.item.id, p]));
    expect(by.a).toMatchObject({ lane: 0, lanes: 2 });
    expect(by.b).toMatchObject({ lane: 1, lanes: 2 });
    expect(by.c).toMatchObject({ lane: 0, lanes: 1 });
  });

  it("cuts an item past midnight at the day's end and starts it at midnight the next day", () => {
    const late = item("late", "2026-10-14", "23:00", "23:30", ["r"], { end: at("2026-10-15", "01:00") });
    expect(placeDay([late], "2026-10-14")[0]).toMatchObject({ from: 1380, to: 1440 });
    expect(placeDay([late], "2026-10-15")[0]).toMatchObject({ from: 0, to: 60 });
  });

  it("keeps an item that ends at midnight in its own day, with no stub on the next", () => {
    const evening = item("evening", "2026-10-14", "22:00", "23:00", ["r"], { end: at("2026-10-15", "00:00") });
    expect(itemDays(evening)).toEqual({ first: "2026-10-14", last: "2026-10-14" });
    expect(placeDay([evening], "2026-10-14")[0]).toMatchObject({ from: 1320, to: 1440 });
    expect(placeDay([evening], "2026-10-15")).toEqual([]);
  });

  it("leaves all-day items to the lane", () => {
    expect(placeDay([allDay("off", "2026-10-14", undefined, ["r"])], "2026-10-14")).toEqual([]);
  });
});

describe("the all-day lane", () => {
  const week: CalendarColumn[] = Array.from({ length: 7 }, (_, i) => ({ day: addDays("2026-10-11", i) }));

  it("lays a bar across the days it covers, cut at the week's edges", () => {
    const { bars, rows } = placeAllDay([allDay("trip", "2026-10-09", "2026-10-13", ["r"]), allDay("expo", "2026-10-16", "2026-10-20", ["h"])], week);
    expect(rows).toBe(1);
    expect(bars.map(({ item, col, span, row }) => [item.id, col, span, row])).toEqual([
      ["trip", 0, 3, 0],
      ["expo", 5, 2, 0],
    ]);
  });

  it("stacks bars that share a day in rows, and reuses a row once it is free", () => {
    const { bars, rows } = placeAllDay(
      [allDay("a", "2026-10-12", "2026-10-14", ["r"]), allDay("b", "2026-10-13", undefined, ["h"]), allDay("c", "2026-10-15", undefined, ["h"])],
      week,
    );
    expect(rows).toBe(2);
    const row = Object.fromEntries(bars.map((b) => [b.item.id, b.row]));
    expect(row).toEqual({ a: 0, b: 1, c: 0 });
  });

  it("puts a bar only in its own people's columns, split where they aren't side by side", () => {
    const people: CalendarColumn[] = ["r", "h", "s"].map((person) => ({ day: "2026-10-14", person }));
    const { bars } = placeAllDay([allDay("offsite", "2026-10-14", undefined, ["r", "s"])], people);
    expect(bars.map(({ col, span }) => [col, span])).toEqual([
      [0, 1],
      [2, 1],
    ]);
  });
});

describe("warnings", () => {
  it("finds a person in two things at once, on both", () => {
    const day = "2026-10-15";
    const found = warnings([item("bank", day, "14:00", "15:00", ["h"]), item("call", day, "14:00", "14:45", ["h"])]);
    expect(found.filter((w) => w.kind === "clash").map((w) => w.itemId).sort()).toEqual(["bank", "call"]);
  });

  it("finds no time to drive, and nothing when there is", () => {
    const day = "2026-10-14";
    const tight = warnings([item("office", day, "10:00", "10:50", ["r"]), item("site", day, "11:00", "12:00", ["r"], { travelMinutes: 25 })]);
    expect(tight).toEqual([{ kind: "drive", itemId: "site", person: "r", otherId: "office" }]);
    const fine = warnings([item("office", day, "10:00", "10:30", ["r"]), item("site", day, "11:00", "12:00", ["r"], { travelMinutes: 25 })]);
    expect(fine).toEqual([]);
  });

  it("never counts a cancelled item, nor two people's separate days", () => {
    const day = "2026-10-14";
    expect(warnings([item("a", day, "09:00", "10:00", ["r"]), item("b", day, "09:00", "10:00", ["r"], { status: "cancelled" })])).toEqual([]);
    expect(warnings([item("a", day, "09:00", "10:00", ["r"]), item("b", day, "09:00", "10:00", ["h"])])).toEqual([]);
  });

  it("warns about anything booked while its person is away, timed or all-day", () => {
    const found = warnings([
      allDay("leave", "2026-10-14", "2026-10-15", ["r"], { away: true }),
      item("visit", "2026-10-15", "10:00", "11:00", ["r", "h"]),
      allDay("expo", "2026-10-14", undefined, ["r"]),
      item("after", "2026-10-16", "09:00", "10:00", ["r"]),
    ]);
    expect(found).toEqual([
      { kind: "away", itemId: "visit", otherId: "leave", person: "r" },
      { kind: "away", itemId: "expo", otherId: "leave", person: "r" },
    ]);
  });

  it("reads a timed absence by its hours, and never sets time off against time off", () => {
    const day = "2026-10-14";
    const found = warnings([
      item("doctor", day, "09:00", "11:00", ["r"], { away: true }),
      item("standup", day, "10:30", "10:45", ["r"]),
      item("lunch", day, "12:00", "13:00", ["r"]),
      allDay("leave", day, undefined, ["r"], { away: true }),
    ]);
    expect(found).toEqual([
      { kind: "away", itemId: "standup", otherId: "doctor", person: "r" },
      { kind: "away", itemId: "standup", otherId: "leave", person: "r" },
      { kind: "away", itemId: "lunch", otherId: "leave", person: "r" },
    ]);
  });
});

describe("where a drag lands", () => {
  const drag = (over: Partial<GridDrag>): GridDrag => ({ kind: "move", col: 1, from: 600, to: 660, dx: 0, dy: 0, colWidth: 100, hour: 52, cols: 3, across: true, ...over });

  it("snaps to the quarter hour and keeps the item's length", () => {
    // 15px down is 17 minutes, the nearest quarter 15; 20px is 23, nearer 30.
    expect(dropAt(drag({ dy: 15 }))).toEqual({ col: 1, from: 615, to: 675 });
    expect(dropAt(drag({ dy: 20 }))).toEqual({ col: 1, from: 630, to: 690 });
  });

  it("stays inside the day", () => {
    expect(dropAt(drag({ dy: -52 * 11 }))).toEqual({ col: 1, from: 0, to: 60 });
    expect(dropAt(drag({ dy: 52 * 20 }))).toEqual({ col: 1, from: 1380, to: 1440 });
  });

  it("stretches by its foot, a quarter hour at the least, to midnight at the most", () => {
    expect(dropAt(drag({ kind: "resize", dy: 26 }))).toEqual({ col: 1, from: 600, to: 690 });
    expect(dropAt(drag({ kind: "resize", dy: -200 }))).toEqual({ col: 1, from: 600, to: 615 });
    expect(dropAt(drag({ kind: "resize", dy: 52 * 30 }))).toEqual({ col: 1, from: 600, to: 1440 });
  });

  it("changes column across, inside the columns there are, and the other way in Arabic", () => {
    expect(dropAt(drag({ dx: 110 })).col).toBe(2);
    expect(dropAt(drag({ dx: 400 })).col).toBe(2);
    expect(dropAt(drag({ dx: -400 })).col).toBe(0);
    expect(dropAt(drag({ dx: 110, rtl: true })).col).toBe(0);
    expect(dropAt(drag({ dx: 110, across: false })).col).toBe(1);
  });

  it("turns a drop into new times, and between people into a hand-over", () => {
    const people: CalendarColumn[] = ["r", "h"].map((person) => ({ day: "2026-10-14", person }));
    expect(moveOf(people, 0, { col: 1, from: 600, to: 660 })).toEqual({
      start: "2026-10-14T07:00:00.000Z",
      end: "2026-10-14T08:00:00.000Z",
      fromPerson: "r",
      toPerson: "h",
    });
    expect(moveOf(people, 1, { col: 1, from: 615, to: 675 })).toEqual({ start: "2026-10-14T07:15:00.000Z", end: "2026-10-14T08:15:00.000Z" });
    const week: CalendarColumn[] = [{ day: "2026-10-14" }, { day: "2026-10-15" }];
    expect(moveOf(week, 0, { col: 1, from: 1380, to: 1440 })).toEqual({ start: "2026-10-15T20:00:00.000Z", end: "2026-10-15T21:00:00.000Z" });
  });
});
