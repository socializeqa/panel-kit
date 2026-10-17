import { describe, expect, it } from "vitest";
import { dueGroup, dueText, lateDays } from "../src/due";

// Wednesday 14 October 2026, 10:30 on the office's clock.
const TODAY = "2026-10-14";
const NOW = 10 * 60 + 30;
const at = (time: string | null) => ({ time, nowMinutes: NOW });

describe("dueGroup and dueText", () => {
  it("puts a task whose day has gone, or whose hour has gone today, among the late ones", () => {
    expect(dueGroup("2026-10-13", TODAY, at(null))).toBe("late");
    expect(dueText("2026-10-13", TODAY, at(null))).toEqual({ text: "1 day late", tone: "late" });
    expect(dueText("2026-10-11", TODAY, at("09:00"))).toEqual({ text: "3 days late", tone: "late" });
    expect(dueGroup(TODAY, TODAY, at("09:00"))).toBe("late");
    expect(dueText(TODAY, TODAY, at("09:00"))).toEqual({ text: "Late, was 09:00", tone: "late" });
  });

  it("keeps today's, tomorrow's and the week's apart, and dates the rest", () => {
    expect(dueGroup(TODAY, TODAY, at("17:00"))).toBe("today");
    expect(dueText(TODAY, TODAY, at("17:00"))).toEqual({ text: "17:00", tone: "today" });
    expect(dueText(TODAY, TODAY, at(null))).toEqual({ text: "Today", tone: "today" });
    expect(dueGroup("2026-10-15", TODAY, at(null))).toBe("tomorrow");
    expect(dueGroup("2026-10-20", TODAY, at(null))).toBe("week");
    expect(dueText("2026-10-20", TODAY, at(null))).toEqual({ text: "Tue 20 Oct", tone: "soon" });
    expect(dueGroup("2026-11-02", TODAY, at(null))).toBe("later");
    expect(dueText("2027-01-05", TODAY, at(null))?.text).toBe("Tue 5 Jan 2027");
    expect(dueGroup(null, TODAY, at(null))).toBe("someday");
  });

  it("reads a day alone when no time is given: due by the end of it", () => {
    expect(dueGroup(TODAY, TODAY)).toBe("today");
    expect(dueText("2026-10-15", TODAY, { time: "09:00" })).toEqual({ text: "Tomorrow 09:00", tone: "soon" });
  });
});

describe("lateDays", () => {
  it("counts whole days gone, and none for today or ahead", () => {
    expect(lateDays("2026-10-11", TODAY)).toBe(3);
    expect(lateDays(TODAY, TODAY)).toBe(0);
    expect(lateDays("2026-10-20", TODAY)).toBe(0);
    expect(lateDays(null, TODAY)).toBe(0);
  });
});
