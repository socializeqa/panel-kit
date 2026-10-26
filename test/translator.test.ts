import { describe, expect, it } from "vitest";
import { waitWords } from "../src/staff-door";
import { translator } from "../src/translate";

describe("translator", () => {
  const ro = translator({ "Save changes": "Salvează", "{count} in stock": "{count} în stoc" });

  it("says the panel's own words and fills the blanks after", () => {
    expect(ro("Save changes")).toBe("Salvează");
    expect(ro("{count} in stock", { count: 3 })).toBe("3 în stoc");
  });

  it("leaves a text with no entry in English and tells who asked", () => {
    const heard: string[] = [];
    const t = translator({}, (text) => heard.push(text));
    expect(t("Cancel")).toBe("Cancel");
    expect(heard).toEqual(["Cancel"]);
  });
});

describe("waitWords", () => {
  it("says how long to wait, in English or in the panel's words", () => {
    expect(waitWords(30)).toBe("in 30 seconds");
    expect(waitWords(61)).toBe("in 2 minutes");
    expect(waitWords(45, translator({ "in {n} seconds": "în {n} secunde" }))).toBe("în 45 secunde");
  });
});
