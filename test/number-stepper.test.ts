import { describe, expect, it } from "vitest";
import { stepperEntry } from "../src/number-stepper";

// The box between − and + takes typing too. Elite Touch could not type half
// an hour of overtime (14 Sep 2026): the box turned "0." back into "0" on the
// way, so the point never stayed long enough for the 5.

/**
 * Type `keys` one by one, the way a browser does: each key lands on what the
 * box shows at that moment. A refused key leaves the box as it was.
 */
function typeInto(keys: string, limits: { step: number; min?: number; max?: number } = { step: 0.5, min: 0, max: 12 }) {
  let text = "";
  let value: number | null = null;
  for (const key of keys) {
    const next = stepperEntry(text + key, { min: 0, max: 9999, ...limits });
    if (!next) continue;
    text = next.text;
    if (next.value !== undefined) value = next.value;
  }
  return { text, value };
}

describe("typing into a stepper", () => {
  it("takes half an hour typed either way", () => {
    expect(typeInto("0.5")).toEqual({ text: "0.5", value: 0.5 });
    expect(typeInto(".5")).toEqual({ text: ".5", value: 0.5 });
    expect(typeInto("1.5")).toEqual({ text: "1.5", value: 1.5 });
  });

  it("keeps the point on screen while the number is on its way", () => {
    expect(typeInto("2.")).toEqual({ text: "2.", value: 2 });
    expect(typeInto(".")).toEqual({ text: ".", value: null });
  });

  it("takes as many decimals as the step has, no more", () => {
    expect(typeInto("2.25")).toEqual({ text: "2.2", value: 2.2 });
  });

  it("a whole-number stepper stays whole", () => {
    expect(typeInto("12", { step: 1 })).toEqual({ text: "12", value: 12 });
    expect(typeInto("3.", { step: 1 })).toEqual({ text: "3", value: 3 });
  });

  it("holds the number inside its limits", () => {
    expect(typeInto("13")).toEqual({ text: "12", value: 12 });
  });

  it("refuses what could never be a number, and an empty box is not set", () => {
    expect(typeInto("abc")).toEqual({ text: "", value: null });
    expect(stepperEntry("", { step: 0.5, min: 0, max: 12 })).toEqual({ text: "", value: null });
  });
});
