import { describe, expect, it } from "vitest";
import { othersBoxText } from "../src/other-select";

// "Others — type your own" opens a box, and what the office types there IS the
// value. The box has to keep every character, even when the text on the way
// is also a word on the list. Elite Touch's test; the list is its people
// editor's designations (lib/admin/contact-designation.ts), written out here
// because the kit carries no business lists.
const LIST: readonly string[] = [
  "Representative",
  "Tenant",
  "Owner",
  "Property manager",
  "Facility manager",
  "Consultant",
  "Contractor",
];

/**
 * Type `text` key by key into the box, the way a browser does: each key is
 * added to what the box shows at that moment, and the result goes up as the
 * new value. `shown` is what the caller hands back down. The people editor
 * passes a blank designation as "Representative".
 */
function typeIntoBox(text: string, shown: (v: string) => string = (v) => v): string {
  let value = "";
  let typed = "";
  for (const key of text) {
    const back = shown(value);
    typed = othersBoxText(back, LIST.includes(back), typed) + key;
    value = typed;
  }
  return value;
}

const person = (v: string) => v || "Representative";

describe("the box beside Others", () => {
  it("keeps a designation that starts with a word on the list", () => {
    expect(typeIntoBox("Owner's representative", person)).toBe("Owner's representative");
    expect(typeIntoBox("Tenant's agent", person)).toBe("Tenant's agent");
    expect(typeIntoBox("Property manager assistant", person)).toBe("Property manager assistant");
  });

  it("keeps a designation that is exactly a word on the list", () => {
    expect(typeIntoBox("Owner", person)).toBe("Owner");
    expect(othersBoxText("Owner", true, "Owner")).toBe("Owner");
  });

  it("stays empty for the caller's stand-in word, which nobody typed", () => {
    // Just after Others is picked the person's designation is blank, and the
    // editor hands it back as "Representative". The box must not fill with it.
    expect(othersBoxText("Representative", true, "")).toBe("");
  });

  it("shows a saved word of the office's own as it was saved", () => {
    expect(othersBoxText("Site foreman", false, "Site foreman")).toBe("Site foreman");
    expect(othersBoxText("manager", false, "")).toBe("manager");
    expect(typeIntoBox("Site foreman & keyholder", person)).toBe("Site foreman & keyholder");
  });
});
