import { describe, expect, it } from "vitest";
import { calendarFile, type FeedEvent } from "../src/calendar-ics";

const event = (over: Partial<FeedEvent> = {}): FeedEvent =>
  ({
    id: "m1",
    kind: "meeting",
    title: "Partners' meeting",
    start: "2026-10-14T07:00:00.000Z",
    end: "2026-10-14T08:00:00.000Z",
    location: null,
    travelMinutes: 0,
    status: "confirmed",
    people: ["u1"],
    editable: true,
    updatedAt: "2026-10-07T09:30:00.000Z",
    ...over,
  }) as FeedEvent;

const file = (events: FeedEvent[]) =>
  calendarFile({
    name: "Example Office",
    prodId: "-//Example Office//Office calendar//EN",
    uidDomain: "example.org",
    linkFor: (e) => `https://panel.example.org/calendar?view=day&date=${e.allDay ? e.day : e.start.slice(0, 10)}`,
    events,
    people: [{ id: "u1", name: "Ana Lopes", colour: null }],
    now: new Date("2026-10-07T10:00:00Z"),
  });

describe("calendarFile", () => {
  it("writes a calendar a phone accepts: CRLF lines, the required fields, times in UTC", () => {
    const out = file([event()]);
    expect(out.endsWith("END:VCALENDAR\r\n")).toBe(true);
    const lines = out.split("\r\n");
    expect(lines.every((line) => !line.includes("\n"))).toBe(true);
    for (const line of [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Example Office//Office calendar//EN",
      "X-WR-TIMEZONE:Asia/Qatar",
      "UID:m1@example.org",
      "DTSTAMP:20261007T100000Z",
      "DTSTART:20261014T070000Z",
      "DTEND:20261014T080000Z",
      "STATUS:CONFIRMED",
      "URL:https://panel.example.org/calendar?view=day&date=2026-10-14",
    ]) {
      expect(lines).toContain(line);
    }
  });

  it("escapes commas, semicolons, backslashes and line breaks in text", () => {
    const out = file([event({ title: "Bank, legal; and C:\\files", notes: "Bring the deed\nand the cheque" })]);
    expect(out).toContain("SUMMARY:Bank\\, legal\\; and C:\\\\files");
    expect(out).toContain("Bring the deed\\nand the cheque");
  });

  it("folds long lines at 75 octets without cutting a character in two", () => {
    const title = "اجتماع الشركاء ".repeat(12);
    const out = file([event({ title })]);
    const encoder = new TextEncoder();
    for (const line of out.split("\r\n")) expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    const unfolded = out.replace(/\r\n /g, "");
    expect(unfolded).toContain(`SUMMARY:${title}`);
  });

  it("names who it is with, the people and the drive in the description, and marks a cancelled one", () => {
    const out = file([event({ with: ["Northwind", null], travelMinutes: 30, status: "cancelled" })]).replace(/\r\n /g, "");
    expect(out).toContain("DESCRIPTION:With Northwind\\nPeople: Ana Lopes\\n30 min drive before");
    expect(out).toContain("STATUS:CANCELLED");
  });

  it("sends an all-day item as dates, its end the day after its last", () => {
    const out = file([event({ allDay: true, day: "2026-10-14", endDay: "2026-10-16" } as Partial<FeedEvent>)]).split("\r\n");
    expect(out).toContain("DTSTART;VALUE=DATE:20261014");
    expect(out).toContain("DTEND;VALUE=DATE:20261017");
    expect(out.some((line) => line.startsWith("DTSTART:"))).toBe(false);
  });
});
