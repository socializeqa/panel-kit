import { describe, expect, it } from "vitest";
import { formatTime12, parseTypedTime, quarterHours } from "../src/time-field";

describe("parseTypedTime — the ways the office writes a time", () => {
  it.each([
    ["9", "09:00"],
    ["930", "09:30"],
    ["9:30", "09:30"],
    ["9.30", "09:30"],
    ["9 30", "09:30"],
    ["1430", "14:30"],
    ["14:30", "14:30"],
    ["2pm", "14:00"],
    ["2 pm", "14:00"],
    ["2:30pm", "14:30"],
    ["9:30 am", "09:30"],
    ["12am", "00:00"],
    ["12pm", "12:00"],
    ["2", "14:00"],
    ["6", "18:00"],
    ["7", "07:00"],
    ["0", "00:00"],
  ])("%s → %s", (typed, out) => {
    expect(parseTypedTime(typed)).toBe(out);
  });
  it.each(["", "25", "9:75", "13pm", "abc", "9:3"])("rejects %j", (typed) => {
    expect(parseTypedTime(typed)).toBeNull();
  });
});

describe("formatTime12", () => {
  it.each([
    ["09:30", "9:30 AM"],
    ["00:15", "12:15 AM"],
    ["12:00", "12:00 PM"],
    ["14:30", "2:30 PM"],
  ])("%s → %s", (hhmm, out) => {
    expect(formatTime12(hhmm)).toBe(out);
  });
});

describe("quarterHours — the clock's window", () => {
  it("ET's office day: 6 AM to 10 PM, both ends included", () => {
    const t = quarterHours(6, 22);
    expect(t[0]).toBe("06:00");
    expect(t.at(-1)).toBe("22:00");
    expect(t).toHaveLength(65);
  });
  it("a bar's evening wraps past midnight", () => {
    const t = quarterHours(12, 2);
    expect(t[0]).toBe("12:00");
    expect(t).toContain("23:45");
    expect(t).toContain("00:30");
    expect(t.at(-1)).toBe("02:00");
    expect(t).toHaveLength(57);
  });
});
