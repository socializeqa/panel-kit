import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The package's own promises: every module an app might import is reachable by
// its own name, nothing is shipped that isn't, and nothing runs at install.

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8")) as {
  exports: Record<string, string>;
  scripts: Record<string, string>;
  files: string[];
  peerDependencies: Record<string, string>;
};
const sources = readdirSync(`${root}src`).sort();
const read = (file: string) => readFileSync(`${root}src/${file}`, "utf8");

describe("package.json exports", () => {
  it("lists every file in src under its own name, pointing at the source", () => {
    for (const file of sources) {
      const name = `./${file.replace(/\.tsx?$/, "")}`;
      expect(pkg.exports[name], `${file} is not exported`).toBe(`./src/${file}`);
    }
  });

  it("points at nothing that isn't there", () => {
    for (const [name, target] of Object.entries(pkg.exports)) {
      if (name === "./kit.css") continue;
      expect(sources, `${name} → ${target}`).toContain(target.replace("./src/", ""));
    }
    expect(pkg.exports["./kit.css"]).toBe("./kit.css");
  });

  // A git dependency with any of these makes npm run a full install of the
  // package's own dev tools inside the app's install — it kept Elite Touch's
  // CI red in September 2026 (team-kit v1.2.1).
  it("has no script an install would run", () => {
    for (const script of ["build", "prepare", "prepack", "postinstall", "install", "preinstall"]) {
      expect(pkg.scripts[script], `"${script}" script`).toBeUndefined();
    }
  });

  it("ships the source, the stylesheet, the checker and the words — no fixture", () => {
    expect(pkg.files).toEqual(["src", "kit.css", "bin", "README.md", "CHANGELOG.md"]);
  });

  // pnpm 11 refuses a git dependency of a dependency (blockExoticSubdeps), so
  // team-kit is the app's own install, never the kit's.
  it("takes team-kit from the app, as a peer", () => {
    expect(pkg.peerDependencies["@socialize/team-kit"]).toBeDefined();
  });
});

describe("the source's shape", () => {
  // The kit is one tree an app compiles: an "@/" import would reach into the
  // app's own folders.
  it("imports its own files relatively, never through an alias", () => {
    for (const file of sources) {
      expect(read(file), file).not.toMatch(/from ["']@\//);
    }
  });

  // A module that holds state or reads the browser must say so, or a server
  // component imports it and breaks at the first hook.
  it('marks every module that uses hooks or the browser "use client"', () => {
    const clientish = /\buse(State|Effect|LayoutEffect|Context|Ref|Memo|Callback|Transition|ActionState|SyncExternalStore|Router|SearchParams|Pathname|Panel|PanelT|Toast|Dismiss)\b/;
    for (const file of sources) {
      const text = read(file);
      if (!clientish.test(text.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ""))) continue;
      expect(text.startsWith('"use client";'), `${file} uses hooks without "use client"`).toBe(true);
    }
  });

  // What a server component reads must not come from a client module: it
  // arrives as a reference, not a string, and cn() drops it (classes.ts).
  it("keeps every shared class string out of the client modules", () => {
    for (const file of sources) {
      const text = read(file);
      if (!text.startsWith('"use client";')) continue;
      expect(text, file).not.toMatch(/^export const [A-Z_]+ =/m);
      expect(text, file).not.toMatch(/^export \{[^}]*\} from "\.\/classes"/m);
    }
    expect(read("classes.ts").startsWith('"use client"')).toBe(false);
  });
});
