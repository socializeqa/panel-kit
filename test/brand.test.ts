import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { brandBright, brandDeep, brandInk, brandVars, contrast, HOUSE_BRAND, parseHex } from "../src/brand";

/**
 * A wrong brand colour doesn't throw — it ships an unreadable button to a
 * client's panel. These pin the promises: ink always reads on the fill, deep
 * always reads on white, bright always reads on the dark. Socialize's
 * lib/accent.test.ts, adapted to brandVars and to kit.css.
 */

const WHITE = { r: 255, g: 255, b: 255 };
const INK = { r: 10, g: 10, b: 10 };
const READABLE = 4.5;

function rgbOf(hex: string) {
  const rgb = parseHex(hex);
  if (!rgb) throw new Error(`bad hex in test: ${hex}`);
  return rgb;
}

describe("brandInk", () => {
  it("keeps house ink on the house lime", () => {
    expect(brandInk("#D1FE17")).toBe("#0A0A0A");
  });

  it("goes white on a dark brand", () => {
    expect(brandInk("#1A237E")).toBe("#ffffff");
  });

  it("falls back to ink on garbage", () => {
    expect(brandInk("not-a-color")).toBe("#0A0A0A");
  });
});

describe("brandDeep", () => {
  it.each(["#D1FE17", "#E91E63", "#00E5FF", "#FFC107"])("makes %s readable on white", (hex) => {
    expect(contrast(rgbOf(brandDeep(hex)), WHITE)).toBeGreaterThanOrEqual(READABLE);
  });

  it("leaves an already-deep colour alone", () => {
    expect(brandDeep("#1A237E")).toBe("#1a237e");
  });
});

describe("brandBright", () => {
  it.each(["#1A237E", "#7B1010", "#004D40", "#80001E"])("makes %s readable on the dark", (hex) => {
    expect(contrast(rgbOf(brandBright(hex)), INK)).toBeGreaterThanOrEqual(READABLE);
  });

  it("leaves the house lime alone, case aside", () => {
    expect(brandBright("#D1FE17")).toBe("#d1fe17");
  });

  it.each(["#0E0E0E", "#000000", "#6E6A6B", "#F2F2F2"])("answers the black-and-white brand %s in white", (hex) => {
    expect(brandBright(hex)).toBe("#ffffff");
  });

  it("keeps a colour that already reads on the dark", () => {
    expect(brandBright("#C6A24B")).toBe("#c6a24b");
  });
});

describe("brandVars", () => {
  it("stays out of the way with no colour on file", () => {
    expect(brandVars(null)).toBeUndefined();
    expect(brandVars(undefined)).toBeUndefined();
    expect(brandVars("chartreuse-ish")).toBeUndefined();
  });

  it("stamps all five variables, each keeping its promise", () => {
    const vars = brandVars("#E91E63") as Record<string, string>;
    expect(vars["--brand"]).toBe("#E91E63");
    // The ink is whichever of the two reads better — never a third colour.
    const fill = rgbOf("#E91E63");
    const ink = rgbOf(vars["--brand-ink"] as string);
    expect(["#0A0A0A", "#ffffff"]).toContain(vars["--brand-ink"]);
    expect(contrast(fill, ink)).toBeGreaterThanOrEqual(Math.max(contrast(fill, WHITE), contrast(fill, INK)) - 1e-9);
    expect(contrast(rgbOf(vars["--brand-deep"] as string), WHITE)).toBeGreaterThanOrEqual(READABLE);
    expect(contrast(rgbOf(vars["--brand-bright"] as string), INK)).toBeGreaterThanOrEqual(READABLE);
    expect(vars["--brand-bright-ink"]).toBe(brandInk(vars["--brand-bright"] as string));
  });

  it("gives a black brand white fills with ink words on the dark", () => {
    const vars = brandVars("#0E0E0E") as Record<string, string>;
    expect(vars["--brand-ink"]).toBe("#ffffff");
    expect(vars["--brand-deep"]).toBe("#0e0e0e");
    expect(vars["--brand-bright"]).toBe("#ffffff");
    expect(vars["--brand-bright-ink"]).toBe("#0A0A0A");
  });
});

// kit.css, read the way the browser will: the rules that make the promises
// above reach the page.
const css = readFileSync(fileURLToPath(new URL("../kit.css", import.meta.url)), "utf8").replace(/\r\n/g, "\n");
const block = (selector: string) => {
  const start = css.indexOf(`\n${selector} {`);
  if (start < 0) throw new Error(`${selector} missing from kit.css`);
  return css.slice(start, css.indexOf("\n}", start));
};
const token = (inside: string, name: string) => {
  const found = new RegExp(`--${name}: (#[0-9a-f]{6});`, "i").exec(inside);
  if (!found) throw new Error(`--${name} missing`);
  return found[1] as string;
};

describe("kit.css on the dark", () => {
  it("fills with the bright variant, which only an important rule can do over the inline style", () => {
    const dark = block(".dark,\n.dark .kit");
    expect(dark).toContain("--brand: var(--brand-bright) !important;");
    expect(dark).toContain("--brand-ink: var(--brand-bright-ink) !important;");
    expect(dark).toContain("--brand-deep: var(--brand-bright) !important;");
  });
});

describe("kit.css's house defaults", () => {
  const light = block(":root");
  const dark = block(".dark");

  it("are brandVars of the house lime, so a panel with no colour wears exactly it", () => {
    const house = brandVars(HOUSE_BRAND) as Record<string, string>;
    for (const name of ["brand", "brand-ink", "brand-deep", "brand-bright", "brand-bright-ink"]) {
      expect(token(light, name).toLowerCase()).toBe((house[`--${name}`] as string).toLowerCase());
    }
  });

  // Every word colour the kit sets must read on the two things words sit on.
  it.each(["ink", "quiet", "ok", "warn", "danger", "info"])("--%s reads 4.5:1 on the ground and the surface, light", (name) => {
    for (const under of ["ground", "surface"]) {
      expect(contrast(rgbOf(token(light, name)), rgbOf(token(light, under)))).toBeGreaterThanOrEqual(READABLE);
    }
  });

  it.each(["ink", "quiet", "ok", "warn", "danger", "info"])("--%s reads 4.5:1 on the ground and the surface, dark", (name) => {
    for (const under of ["ground", "surface"]) {
      expect(contrast(rgbOf(token(dark, name)), rgbOf(token(dark, under)))).toBeGreaterThanOrEqual(READABLE);
    }
  });

  it("keeps the rail's words readable in both lights", () => {
    expect(contrast(rgbOf(token(light, "on-rail")), rgbOf(token(light, "rail")))).toBeGreaterThanOrEqual(READABLE);
    expect(contrast(rgbOf(token(dark, "on-rail")), rgbOf(token(dark, "rail")))).toBeGreaterThanOrEqual(READABLE);
  });
});
