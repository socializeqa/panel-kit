// A missing @source fails silently: the build passes, and every panel renders
// with none of the kit's own classes. So after the build this reads the
// stylesheet Next wrote and looks for classes that exist ONLY in the kit's
// source — the fixture's own pages never use them — plus the tokens and
// motion kit.css brings. Exit 1 if any is missing.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));

// [what to look for in the built CSS, the class it proves, where it comes
// from]. The first column is written in halves, as the class appears escaped
// in the stylesheet: Tailwind reads this file too (it sits in the fixture),
// and a whole class name here would be generated from HERE and prove nothing
// about @source.
const FROM_SOURCE = [
  [".max-w-\\[" + "1160px\\]", "max-w-" + "[1160px]", "the drawer's width (src/drawer.tsx)"],
  ["\\:animate-" + "drawer-in", "animate-" + "drawer-in", "the drawer's arrival (src/drawer.tsx)"],
  [".rounded-" + "panel{", "rounded-" + "panel", "the card shell (src/classes.ts)"],
  ["minmax(" + "220px", "minmax(" + "220px", "the figures strip (src/stat-strip.tsx)"],
];
// kit.css arrives through @import, not @source; these prove the import.
const FROM_IMPORT = [
  ["@keyframes kit-menu-in", "a menu's keyframes (kit.css)"],
  ["--ease-drawer:", "the drawer's curve (kit.css)"],
  ["--brand-soft:", "the brand's wash (kit.css)"],
];

function filesUnder(dir, test, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) filesUnder(path, test, out);
    else if (test(name)) out.push(path);
  }
  return out;
}

const cssFiles = filesUnder(join(here, ".next", "static"), (n) => n.endsWith(".css"));
const css = cssFiles.map((f) => readFileSync(f, "utf8")).join("\n");
const pages = filesUnder(join(here, "app"), (n) => /\.(tsx?|css)$/.test(n))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

let missing = 0;
const expect = (marker, from) => {
  if (css.includes(marker)) {
    console.log(`css-proof: found ${marker} — ${from}`);
  } else {
    console.error(`css-proof: missing ${marker} — ${from}`);
    missing += 1;
  }
};
for (const [marker, name, from] of FROM_SOURCE) {
  if (pages.includes(name)) {
    console.error(`css-proof: "${name}" appears in the fixture's own pages, so it proves nothing about @source`);
    missing += 1;
  } else {
    expect(marker, from);
  }
}
for (const [marker, from] of FROM_IMPORT) expect(marker, from);

console.log(`css-proof: read ${cssFiles.length} stylesheet${cssFiles.length === 1 ? "" : "s"}, ${css.length} characters`);
if (cssFiles.length === 0 || missing) {
  console.error("css-proof: the kit did not reach the built CSS — check the @import and @source lines in app/globals.css");
  process.exitCode = 1;
}
