import { describe, expect, it } from "vitest";
import { isWeekend, monthGrid, officeClock, officeMoment, weekDays, weekStart, workingDays } from "../src/calendar-time";
import { readCalendarAddress, stepDate, viewSpan, viewWindow } from "../src/calendar-views";

// An office outside Doha hands in its own clock: an offset, or a zone whose
// clock moves for summer, its own first day of the week and its own weekend.

describe("an office's own clock", () => {
  it("takes a fixed offset", () => {
    expect(officeMoment("2026-10-14", "10:00", { offsetMinutes: 60 })).toBe("2026-10-14T09:00:00.000Z");
    expect(officeClock("2026-10-14T23:30:00.000Z", { offsetMinutes: -300 })).toEqual({ day: "2026-10-14", minutes: 1110 });
  });

  it("follows a zone across its change of clock", () => {
    // Bucharest is +03:00 in summer and +02:00 from 25 October 2026.
    const zone = { timeZone: "Europe/Bucharest" };
    expect(officeMoment("2026-10-24", "10:00", zone)).toBe("2026-10-24T07:00:00.000Z");
    expect(officeMoment("2026-10-26", "10:00", zone)).toBe("2026-10-26T08:00:00.000Z");
    expect(officeClock("2026-10-26T08:00:00.000Z", zone)).toEqual({ day: "2026-10-26", minutes: 600 });
  });

  it("starts the week where the office does, and keeps its weekend", () => {
    expect(weekStart("2026-10-14", { weekStartsOn: 6 })).toBe("2026-10-10");
    expect(weekStart("2026-10-14", { weekStartsOn: 1 })).toBe("2026-10-12");
    expect(weekDays("2026-10-11", { weekStartsOn: 1 })[0]).toBe("2026-10-05");
    expect(monthGrid("2026-10-14", { weekStartsOn: 1 })[0]).toBe("2026-09-28");
    expect(isWeekend("2026-10-16")).toBe(true);
    expect(isWeekend("2026-10-18")).toBe(false);
    expect(isWeekend("2026-10-18", { weekend: [0, 6] })).toBe(true);
    expect(workingDays({ weekStartsOn: 6 })).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("the calendar's address", () => {
  it("opens the list for a search, and falls back on a view or a day it doesn't know", () => {
    expect(readCalendarAddress({ view: "month", date: "2026-10-14", q: "  bank  " }, "2026-10-17")).toEqual({ view: "list", date: "2026-10-14", q: "bank" });
    expect(readCalendarAddress({ view: "decade", date: "2026-02-30" }, "2026-10-17")).toEqual({ view: "week", date: "2026-10-17", q: "" });
  });

  it("loads what a view shows, the week around its day, and a day either side", () => {
    expect(viewSpan("week", "2026-10-14")).toEqual(["2026-10-11", "2026-10-18"]);
    expect(viewWindow("day", "2026-10-14")).toEqual(["2026-10-10", "2026-10-19"]);
    expect(viewWindow("month", "2026-10-14")).toEqual(["2026-09-26", "2026-11-09"]);
    expect(viewWindow("year", "2026-10-14")).toEqual(["2025-12-31", "2027-01-02"]);
  });

  it("steps a day, a week, a month or a year", () => {
    expect(stepDate("day", "2026-10-14", 1)).toBe("2026-10-15");
    expect(stepDate("week", "2026-10-14", -1)).toBe("2026-10-07");
    expect(stepDate("month", "2026-10-14", 1)).toBe("2026-11-01");
    expect(stepDate("year", "2026-10-14", -1)).toBe("2025-10-01");
  });
});
