import { describe, expect, it } from "vitest";
import { maskTypedDate, parseTypedDate } from "../src/date-field";

const today = "2026-08-23";

describe("parseTypedDate — the ways the office writes a day", () => {
  it.each([
    ["25/08/2026", "2026-08-25"],
    ["25/8/26", "2026-08-25"],
    ["25-08-2026", "2026-08-25"],
    ["25.08.2026", "2026-08-25"],
    ["25/8", "2026-08-25"],
    ["2026-08-25", "2026-08-25"],
    ["25082026", "2026-08-25"],
    ["25 aug", "2026-08-25"],
    ["25 Aug 2026", "2026-08-25"],
    ["25 august 2026", "2026-08-25"],
    ["aug 25", "2026-08-25"],
    ["Aug 25, 2026", "2026-08-25"],
    ["1/1", "2026-01-01"],
  ])("%s → %s", (typed, iso) => {
    expect(parseTypedDate(typed, today)).toBe(iso);
  });

  it.each(["", "   ", "31/02/2026", "32/01/2026", "25/13/2026", "hello", "25 xyz", "2026-02-30"])(
    "rejects %j",
    (typed) => {
      expect(parseTypedDate(typed, today)).toBeNull();
    },
  );
});

describe("maskTypedDate — slashes arrive on their own", () => {
  it.each([
    ["2", "", "2"],
    ["25", "2", "25/"],
    ["25/0", "25/", "25/0"],
    ["25/08", "25/0", "25/08/"],
    ["25/08/2", "25/08/", "25/08/2"],
    ["25/08/2026", "25/08/202", "25/08/2026"],
    ["2508", "250", "25/08/"],
    ["25082026", "2508202", "25/08/2026"],
  ])("%s after %s → %s", (next, prev, out) => {
    expect(maskTypedDate(next, prev)).toBe(out);
  });
  it("leaves deletions and words alone", () => {
    expect(maskTypedDate("25/", "25/0")).toBe("25/");
    expect(maskTypedDate("25 a", "25 ")).toBe("25 a");
  });
});
