import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { cn } from "../src/cn";

// Moving X Capital (30 September 2026) found three places where kit.css
// reached past the panel into the app's own website: the strong ease-out set
// app-wide, a shadow-lift that clashed with the site's own, and dark values
// that switched on any .dark element. These hold the line.
const css = readFileSync(fileURLToPath(new URL("../kit.css", import.meta.url)), "utf8");
const block = (name: string) => css.slice(css.indexOf(name), css.indexOf("\n}", css.indexOf(name)));

describe("the kit stays inside the panel", () => {
  it("sets the strong ease-out on .kit, never as a theme value", () => {
    expect(block("@theme static {")).not.toMatch(/--ease-out:/);
    expect(css).toMatch(/\.kit \{\s*--ease-out: cubic-bezier\(0\.23, 1, 0\.32, 1\);/);
  });

  it("names its shadows shadow-kit-*, so an app's own shadow-lift is its own", () => {
    expect(block("@theme inline {")).not.toMatch(/--shadow-(panel|menu|tile|lift|focus):/);
    expect(block("@theme inline {")).toMatch(/--shadow-kit-lift: var\(--kit-shadow-lift\);/);
  });

  it("switches to dark only inside the panel", () => {
    expect(css).not.toMatch(/\n\.dark \{/);
    expect(css).not.toMatch(/\n\.dark,\n\.dark \.kit \{/);
    expect(css.match(/\n\.kit\.dark,\n\.dark \.kit \{/g)?.length).toBe(2);
  });

  it("merges its own shadows over Tailwind's, keeping only the last", () => {
    expect(cn("shadow-sm", "shadow-kit-menu")).toBe("shadow-kit-menu");
    expect(cn("shadow-kit-tile", "shadow-kit-lift")).toBe("shadow-kit-lift");
  });
});
