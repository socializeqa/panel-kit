import { describe, expect, it } from "vitest";
import { repeatLabel, seriesDays } from "../src/calendar-repeat";

describe("seriesDays", () => {
  it("books a weekly item on the same weekday until the end day", () => {
    expect(seriesDays("2026-10-14", "weekly", "2026-11-04")).toEqual(["2026-10-14", "2026-10-21", "2026-10-28", "2026-11-04"]);
  });

  it("books every other week", () => {
    expect(seriesDays("2026-10-14", "fortnightly", "2026-11-11")).toEqual(["2026-10-14", "2026-10-28", "2026-11-11"]);
  });

  it("keeps working days to Sunday through Thursday", () => {
    // Thursday 15 Oct, then over the weekend to Sunday 18 and Monday 19.
    expect(seriesDays("2026-10-15", "weekdays", "2026-10-19")).toEqual(["2026-10-15", "2026-10-18", "2026-10-19"]);
  });

  it("always keeps the day it was booked on, even a Friday", () => {
    expect(seriesDays("2026-10-16", "weekdays", "2026-10-18")).toEqual(["2026-10-16", "2026-10-18"]);
  });

  it("skips the months without the date for a monthly item on the 31st", () => {
    expect(seriesDays("2026-10-31", "monthly", "2027-03-31")).toEqual(["2026-10-31", "2026-12-31", "2027-01-31", "2027-03-31"]);
  });

  it("stops a monthly series at its end day inside the last month", () => {
    expect(seriesDays("2026-10-20", "monthly", "2026-12-19")).toEqual(["2026-10-20", "2026-11-20"]);
  });

  it("runs a year at the most, whatever end day is asked", () => {
    const days = seriesDays("2026-10-14", "daily", "2030-01-01");
    expect(days.length).toBe(366);
    expect(days.at(-1)).toBe("2027-10-14");
  });

  it("follows an office's own weekend: Saturday and Sunday off", () => {
    // Friday 16 Oct, then over the weekend to Monday 19.
    expect(seriesDays("2026-10-16", "weekdays", "2026-10-19", { weekend: [0, 6] })).toEqual(["2026-10-16", "2026-10-19"]);
  });
});

describe("repeatLabel", () => {
  it("says the rule in words", () => {
    expect(repeatLabel("weekly", "2026-10-14")).toBe("Every Wednesday");
    expect(repeatLabel("fortnightly", "2026-10-14")).toBe("Every other Wednesday");
    expect(repeatLabel("monthly", "2026-10-01")).toBe("Every month on the 1st");
    expect(repeatLabel("monthly", "2026-10-12")).toBe("Every month on the 12th");
    expect(repeatLabel("monthly", "2026-10-23")).toBe("Every month on the 23rd");
  });

  it("names the working days from the office's weekend, wherever its week starts", () => {
    expect(repeatLabel("weekdays", "2026-10-14")).toBe("Every working day, Sunday to Thursday");
    expect(repeatLabel("weekdays", "2026-10-14", { weekStartsOn: 1 })).toBe("Every working day, Sunday to Thursday");
    expect(repeatLabel("weekdays", "2026-10-14", { weekend: [0, 6] })).toBe("Every working day, Monday to Friday");
    expect(repeatLabel("weekdays", "2026-10-14", { weekend: [2, 5] })).toBe("Every working day");
  });
});
