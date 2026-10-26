import { describe, expect, it } from "vitest";
import { translator } from "../src/panel-provider";

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
