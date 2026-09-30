#!/usr/bin/env node
/**
 * panel-kit-check — is this panel still on the kit, and on the house rules?
 *
 * One checker for every panel, merged from the three that grew apart:
 * Elite Touch's style guard (a hand-rolled copy of a shared shape), the
 * Señorritas additions (no all-caps, no typed colour, no browser popups) and
 * Socialize's unity audit (counts per file that may only fall). Each app sets
 * it up in a panel-kit.config.mjs at its root — what to scan, where its
 * shared shapes live, which rules are on, and every exemption with its reason.
 *
 *   panel-kit-check              the report, worst files first
 *   panel-kit-check --json       the findings as JSON
 *   panel-kit-check --check      exit 1 when any count rises above the baseline
 *   panel-kit-check --baseline   write the baseline from today
 *
 * A count may only fall. A line that genuinely can't come from the kit says
 * so on or above itself — `style-guard-ignore: <reason>` — and stays
 * greppable, a standing decision rather than a silenced warning. A guard with
 * no honest exit gets deleted the first time it blocks a real change.
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

// ── The rules ────────────────────────────────────────────────────────────
// `kind` says what a rule reads: "class" a class string (every quoted or
// backticked run — class strings live in cn() calls, constants and ternaries
// as often as in className=), "code" the source with its comments blanked
// (a comment that names a forbidden thing is not the code doing it), "file"
// the whole file once. `on` is the default; a config turns any rule on or off.

const tokensOf = (s) => s.split(/\s+/).filter(Boolean);
const has = (tokens, want) => (typeof want === "string" ? tokens.includes(want) : tokens.some((t) => want.test(t)));
// A utility with its variants taken off: "sm:hover:bg-brand/50" → "bg-brand/50".
const bare = (token) => token.slice(token.lastIndexOf(":") + 1).replace(/^!/, "");
const ms = (token) => {
  const m = /^duration-(\d+)$/.exec(bare(token));
  return m ? Number(m[1]) : null;
};

// Elite Touch's set rules: a set of utilities that may only meet in the kit's
// own file. Set inclusion, not a literal: an inserted `shrink-0` walked past
// the first version of this guard while 36 hand-typed panel shells piled up.
const shape = (id, what, all, some = []) => ({
  id,
  what,
  kind: "class",
  on: true,
  test: (tokens) => all.every((t) => has(tokens, t)) && some.every((group) => group.some((t) => has(tokens, t))),
});

export const RULES = [
  shape("gradient-button", 'a hand-rolled gradient button — use Button emphasis="gradient" or buttonClass()', [
    "bg-gradient-to-br",
    /^from-brand/,
    /^to-brand/,
  ]),
  shape("panel-shell", "a hand-rolled card shell — use Panel or PANEL_SHELL", ["border", "border-ink/10", "bg-surface"], [
    ["rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-panel"],
  ]),
  shape("chip", "a hand-rolled chip — use Chip or CHIP", ["rounded-full", "border-ink/10", "bg-ink/[0.03]"]),
  // A decorative medallion is also `grid place-items-center` — what makes
  // this a BUTTON is the hover, so that's what the rule keys on.
  shape(
    "icon-button",
    "a hand-rolled icon button — use IconBtn or iconBtnClass",
    ["grid", "place-items-center"],
    [[/^size-(4|5|6|7|8|9|10)$/], [/^rounded(-md|-lg|-full)?$/], [/^hover:/]],
  ),
  shape("field-box", "a hand-rolled field box — use fieldBox(), Input or SelectMenu", [
    /^rounded-(lg|control)$/,
    "border-ink/15",
    "bg-surface",
  ]),
  {
    id: "caps",
    what: "all-caps or wide tracking — the panels speak sentence case",
    kind: "class",
    on: true,
    // first-letter:uppercase is sentence case, which the rule wants.
    test: (tokens) => tokens.some((t) => bare(t) === "uppercase" && !t.includes("first-letter:")) || has(tokens, /^tracking-\[0\.[1-9]/),
  },
  {
    id: "half-pixel",
    what: "off-scale type — the scale is whole pixels",
    kind: "class",
    on: true,
    test: (tokens) => has(tokens, /^text-\[\d+\.5px\]$/),
  },
  {
    // The brand is an accent, never a surface: a full fill belongs to the
    // kit's buttons, its switch, its solid tile, its count bubble and its
    // selected pill (Damine: lime on a big surface hurts the eyes).
    id: "brand-slab",
    what: "a brand fill outside the kit's own buttons and pills — the brand is an accent, never a surface",
    kind: "class",
    on: true,
    test: (tokens) =>
      tokens.some((t) => {
        const m = /^(bg|from|via|to)-brand(?:\/(\d+|\[[\d.]+\]))?$/.exec(bare(t));
        if (!m) return false;
        if (!m[2]) return true;
        const alpha = m[2].startsWith("[") ? Number(m[2].slice(1, -1)) * 100 : Number(m[2]);
        return alpha >= 50;
      }),
  },
  {
    id: "font-mono",
    what: "a monospace face — the panels have none; figures line up with tabular-nums",
    kind: "code",
    on: true,
    test: /\bfont-mono\b|\bmonospace\b|ui-monospace|Courier|Geist[_ ]?Mono|GeistMono/g,
  },
  {
    // Emil Kowalski's standard, the house bar for motion: under 300ms, never
    // ease-in, never transition-all, never from scale(0), and only transform
    // and opacity move. A colour may fade on hover, in 150ms or less.
    id: "motion",
    what: "motion off the house standard — transform and opacity only, under 300ms, never ease-in, colour fades 150ms or less",
    kind: "class",
    on: true,
    test: (tokens) => {
      const utils = tokens.map(bare);
      if (utils.some((u) => u === "transition-all" || u === "ease-in" || u === "scale-0" || u === "animate-bounce" || u === "animate-ping"))
        return true;
      // A layout property on the move: width, height, margins, grid tracks.
      if (utils.some((u) => /^transition-\[.*\b(width|height|margin|padding|inset|top|left|right|bottom|grid-template)/.test(u))) return true;
      // A keyframe run longer than the ceiling, typed in an arbitrary value.
      if (
        utils.some((u) => {
          const m = /^animate-\[[\w-]+_(\d*\.?\d+)(ms|s)/.exec(u);
          return m ? Number(m[1]) * (m[2] === "s" ? 1000 : 1) > 300 : false;
        })
      )
        return true;
      const longest = Math.max(0, ...tokens.map(ms).filter((n) => n !== null));
      if (longest > 300) return true;
      // A colour fade longer than 150ms (the default transition carries
      // colours too).
      const fadesColour = utils.some((u) => u === "transition" || u === "transition-colors" || /^transition-\[.*(color|shadow)/.test(u));
      if (fadesColour && longest > 150) return true;
      // Hover MOTION outside a desk with a mouse: a phone fires hover on tap.
      return tokens.some((t) => /(^|:)(group-|peer-)?hover(\/\w+)?:/.test(t) && /^-?(translate|scale|rotate)/.test(bare(t)) && !t.startsWith("fine:"));
    },
  },
  {
    // Dark mode comes from the tokens flipping; a room that writes its own
    // dark: styles drifts from every other room the day the tokens change.
    id: "dark-in-rooms",
    what: "a dark: variant in a room — the tokens flip on their own",
    kind: "class",
    on: true,
    test: (tokens) => tokens.some((t) => t.startsWith("dark:") || t.includes(":dark:")),
  },
  {
    id: "typed-colour",
    what: "a colour typed by hand — colours are tokens (kit.css)",
    kind: "code",
    on: true,
    test: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![-\w])|\b(?:rgba?|hsla?|oklch)\(/g,
  },
  {
    id: "browser-dialog",
    what: "alert(), confirm() or prompt() — say it with the toast, the gate or the form's own line",
    kind: "code",
    on: true,
    test: /\bwindow\.(?:alert|confirm|prompt)\(|(?<![\w.])(?:alert|confirm|prompt)\(/g,
  },
  {
    id: "ai-icons",
    what: "a sparkle, wand or robot glyph — an AI feature wears its room's icon",
    kind: "file",
    on: true,
    test: (text) => {
      const hits = [];
      const banned = /^(Lucide)?(Sparkles?|WandSparkles|Wand2?|Bot|BotMessageSquare|BotOff)(Icon)?$/;
      for (const m of text.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']lucide-react["']/g)) {
        for (const name of m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0])) {
          if (banned.test(name)) hits.push(m.index);
        }
      }
      return hits;
    },
  },
  {
    id: "local-kit-import",
    what: "an import from the app's old copy of the kit — take it from @socialize/panel-kit",
    kind: "file",
    on: true,
    test: (text, config) => {
      const hits = [];
      for (const prefix of config.legacyKit) {
        const escaped = prefix.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
        for (const m of text.matchAll(new RegExp(`from\\s*["']${escaped}`, "g"))) hits.push(m.index);
      }
      return hits;
    },
  },
  {
    // Every list fits its screen, which takes BOTH halves: `fill` stretches
    // it to the floor, and the page asks for only the rows that fit. One
    // without the other scrolls or leaves a blank band (Elite Touch: six
    // pages had drifted, my-jobs worst of all).
    id: "table-fills-screen",
    what: "a DataTable without `fill` and the measured page size (resolvePageAdaptive / resolvePageFromCookie / useAdaptiveRows)",
    kind: "file",
    on: true,
    test: (text) => {
      const at = text.indexOf("<DataTable");
      if (at < 0) return [];
      const fills = /\bfill\b/.test(text.slice(at));
      const pages = /resolvePageAdaptive|resolvePageFromCookie|useAdaptiveRows/.test(text);
      return fills && pages ? [] : [at];
    },
  },
  {
    id: "raw-table",
    what: "a table drawn by hand — use DataTable",
    kind: "code",
    on: true,
    test: /<table\b/g,
  },
  {
    id: "native-date",
    what: "the browser's date box — use DateField",
    kind: "code",
    on: true,
    test: /type=["'](?:date|datetime-local|month)["']/g,
  },
  {
    id: "native-check",
    what: "a bare OS checkbox — use Switch or ChoicePills",
    kind: "code",
    on: true,
    test: /type=["']checkbox["']/g,
  },
  {
    // A drawer or a dialog put together from Radix by hand drifts from the
    // other thirty (Socialize's audit of 19 Sep 2026).
    id: "hand-drawer",
    what: "a dialog built on Radix by hand — use Drawer, ConfirmDialog, PromptDialog or PickDialog",
    kind: "code",
    on: true,
    test: /from\s*["']@radix-ui\/react-dialog["']/g,
  },
  {
    // What a server component reads must not come from a client module: it
    // arrives as a reference, cn() drops it, and nothing errors (Elite Touch).
    id: "client-exports-class",
    what: 'a class string exported from a "use client" module — it reaches a server component as a reference',
    kind: "file",
    on: true,
    test: (text) => {
      if (!/^\s*["']use client["']/.test(text)) return [];
      return [...text.matchAll(/^export const [A-Z][A-Z0-9_]* = (?:["'`]|cn\()/gm)].map((m) => m.index);
    },
  },
  // ── The brain rules (Socialize's unity audit). Off by default: they
  // name an app's own homes, so an app turns on the ones it has.
  {
    id: "date-format",
    what: "a date formatted by hand — use the app's one date home",
    kind: "code",
    on: false,
    test: /\.toLocale(?:Date|Time)String\(|new Intl\.DateTimeFormat\(/g,
  },
  {
    id: "date-math",
    what: "days or months counted by hand — use the app's date helpers",
    kind: "code",
    on: false,
    test: /\.set(?:UTC)?(?:Date|Month|FullYear|Hours)\(|86_?400_?000|Date\.UTC\(|\.get(?:UTC)?Month\(\)\s*[-+]/g,
  },
  {
    id: "money-format",
    what: "money formatted by hand — use formatQAR from @socialize/team-kit/money",
    kind: "code",
    on: false,
    test: /`QAR \$\{|minimumFractionDigits|\w*(?:amount|total|balance|paid|price|cost|spend)\w*\)?\.toFixed\(2\)/gi,
  },
  {
    id: "helper-copy",
    what: "a private copy of a team-kit helper — import it",
    kind: "code",
    on: false,
    test: /(?:function|const) (?:formatQAR|round2|qarInWords|lineTotal|whatsappLink)\b/g,
  },
  {
    // A write a row rule refused is no error and no rows: without the row
    // read back it reported "saved" with nothing saved (Socialize, Sep 2026).
    id: "raw-write",
    what: "a database write whose row is never read back (.select() on the end)",
    kind: "code",
    on: false,
    test: /\.from\("[a-z_]+"\)(?:(?!;)[\s\S])*?\.(?:update|insert|upsert|delete)\((?:(?!\.select\()[^;])*;/g,
  },
];

const RULE_IDS = new Set(RULES.map((r) => r.id));

// ── Reading a file ───────────────────────────────────────────────────────

// Every quoted or backticked run is a candidate class string. Cheaper and
// sturdier than parsing JSX.
const CLASS_STRINGS = /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g;

const IGNORE = /style-guard-ignore:\s*\S/;
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*|\{\/\*)/;
// The line itself, then up through the comment block above it — a reason
// worth writing usually wraps past one line.
function isIgnored(lines, lineNo) {
  if (IGNORE.test(lines[lineNo - 1] ?? "")) return true;
  for (let i = lineNo - 2; i >= 0; i--) {
    const line = lines[i] ?? "";
    if (IGNORE.test(line)) return true;
    if (!COMMENT_LINE.test(line)) return false;
  }
  return false;
}

// Comments say what a rule forbids; they are not the code breaking it. Blank
// them to spaces so every index still points at its own line.
function blankComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, lead) => lead + " ".repeat(m.length - lead.length));
}

/**
 * Every finding in one file, as [{ rule, line }]. `rel` is the path from the
 * app's root with forward slashes; `config` is a resolved config.
 */
export function checkSource(rel, text, config) {
  const lines = text.split("\n");
  const lineAt = (i) => text.slice(0, i).split("\n").length;
  const code = blankComments(text);
  const findings = [];
  const add = (rule, index) => {
    const line = lineAt(index);
    if (isIgnored(lines, line)) return;
    if (exempted(config, rel, rule.id)) return;
    findings.push({ rule: rule.id, line });
  };
  const active = [...RULES.filter((r) => config.rules[r.id]), ...config.custom];

  const classRules = active.filter((r) => r.kind === "class");
  if (classRules.length) {
    for (const m of code.matchAll(CLASS_STRINGS)) {
      const raw = m[1] ?? m[2] ?? m[3] ?? "";
      const tokens = tokensOf(raw);
      if (tokens.length === 0) continue;
      for (const rule of classRules) if (rule.test(tokens)) add(rule, m.index);
    }
  }
  for (const rule of active) {
    if (rule.kind === "code") {
      for (const m of code.matchAll(rule.test)) add(rule, m.index);
    } else if (rule.kind === "file") {
      for (const index of rule.test(text, config)) add(rule, index);
    }
  }
  return findings;
}

// A string names a file or a folder; a RegExp is tested on the path.
function matches(pattern, rel) {
  if (typeof pattern !== "string") return pattern.test(rel);
  return rel === pattern || rel.startsWith(pattern.endsWith("/") ? pattern : `${pattern}/`);
}

function exempted(config, rel, ruleId) {
  return config.exempt.some((e) => e.rules.includes(ruleId) && matches(e.match, rel));
}

// ── The config ───────────────────────────────────────────────────────────

/**
 * A panel-kit.config.mjs default-exports:
 *   scan       folders (or files) to read, from the app's root
 *   css        the stylesheet that imports kit.css, checked for its @source;
 *              null skips the check (the kit itself)
 *   legacyKit  import prefixes of the app's old kit copy ("@/components/admin/")
 *   rules      { ruleId: true | false } over the defaults above
 *   homes      { ruleId: [paths] } — where a shape may live; an exemption
 *              whose reason is "its home"
 *   exempt     [{ match: path | RegExp, rules: [ruleId], why: "…" }] — every
 *              one with its reason, or the checker refuses the config
 *   baseline   where the counts are kept (panel-kit.baseline.json)
 *   custom     an app's own code rules, [{ id, what, test: /regex/g }] — Elite
 *              Touch keeps its zod-fields and upload-ticket rules this way
 */
export function resolveConfig(raw = {}) {
  const rules = Object.fromEntries(RULES.map((r) => [r.id, r.on]));
  for (const [id, on] of Object.entries(raw.rules ?? {})) {
    if (!RULE_IDS.has(id)) throw new Error(`panel-kit.config: no rule "${id}"`);
    rules[id] = Boolean(on);
  }
  const exempt = [];
  for (const [id, paths] of Object.entries(raw.homes ?? {})) {
    if (!RULE_IDS.has(id)) throw new Error(`panel-kit.config: homes names no rule "${id}"`);
    for (const match of paths) exempt.push({ match, rules: [id], why: "its home" });
  }
  for (const e of raw.exempt ?? []) {
    if (!e.why || !String(e.why).trim()) throw new Error(`panel-kit.config: the exemption for ${e.match} gives no reason`);
    exempt.push({ match: e.match, rules: e.rules ?? [], why: e.why });
  }
  const custom = (raw.custom ?? []).map((rule) => {
    if (!rule.id || RULE_IDS.has(rule.id)) throw new Error(`panel-kit.config: a custom rule needs its own id (${rule.id})`);
    if (!rule.what) throw new Error(`panel-kit.config: the custom rule ${rule.id} doesn't say what it catches`);
    if (!(rule.test instanceof RegExp) || !rule.test.global) throw new Error(`panel-kit.config: the custom rule ${rule.id} needs a /g regex`);
    return { id: rule.id, what: rule.what, kind: "code", on: true, test: rule.test };
  });
  for (const e of exempt) {
    for (const id of e.rules) if (!RULE_IDS.has(id) && !custom.some((c) => c.id === id)) throw new Error(`panel-kit.config: exemption names no rule "${id}"`);
  }
  return {
    scan: raw.scan ?? ["src"],
    css: raw.css === undefined ? "src/app/globals.css" : raw.css,
    legacyKit: raw.legacyKit ?? ["@/components/admin/", "@/components/kit/"],
    baseline: raw.baseline ?? "panel-kit.baseline.json",
    rules,
    exempt,
    custom,
    // What each rule catches, in words, for the report.
    what: {
      ...Object.fromEntries([...RULES, ...custom].map((r) => [r.id, r.what])),
      "source-present": "the stylesheet doesn't import kit.css or point @source at the kit",
    },
  };
}

/** The stylesheet imports the kit and points Tailwind at its source. Without
 *  the @source line nothing fails — the kit's classes are simply never
 *  generated and every panel renders unstyled. */
export function checkStylesheet(text) {
  const problems = [];
  if (!/@import\s+["']@socialize\/panel-kit\/kit\.css["']/.test(text)) problems.push('no @import "@socialize/panel-kit/kit.css"');
  if (!/@source\s+["'][^"']*@socialize\/panel-kit\/src["']/.test(text)) problems.push('no @source ".../@socialize/panel-kit/src"');
  return problems;
}

// ── A run ────────────────────────────────────────────────────────────────

function walk(path, out) {
  if (!existsSync(path)) return out;
  if (statSync(path).isDirectory()) {
    for (const name of readdirSync(path)) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      walk(join(path, name), out);
    }
  } else if (/\.(tsx?|jsx?|mjs)$/.test(path) && !/\.test\.[jt]sx?$/.test(path)) {
    // Tests draw nothing; they may quote a colour to check the tokens.
    out.push(path);
  }
  return out;
}

export function checkProject(root, config) {
  const found = {}; // rule -> file -> [lines]
  const files = config.scan.flatMap((dir) => walk(resolve(root, dir), []));
  for (const file of files) {
    const rel = relative(root, file).split(sep).join("/");
    for (const { rule, line } of checkSource(rel, readFileSync(file, "utf8"), config)) {
      ((found[rule] ??= {})[rel] ??= []).push(line);
    }
  }
  if (config.css) {
    const cssPath = resolve(root, config.css);
    const problems = existsSync(cssPath) ? checkStylesheet(readFileSync(cssPath, "utf8")) : [`${config.css} not found`];
    if (problems.length) (found["source-present"] ??= {})[config.css] = problems.map(() => 1);
  }
  return { files: files.length, found };
}

function counts(found) {
  return Object.fromEntries(
    Object.entries(found).map(([rule, files]) => [rule, Object.fromEntries(Object.entries(files).map(([f, l]) => [f, l.length]))]),
  );
}

/** Findings that rose above the baseline — a new break, in one line each. */
export function risenAbove(found, baseline, what = {}) {
  const risen = [];
  for (const [rule, files] of Object.entries(found)) {
    for (const [file, lines] of Object.entries(files)) {
      const was = baseline[rule]?.[file] ?? 0;
      if (lines.length > was) risen.push(`${rule}: ${file} ${was} → ${lines.length} (lines ${lines.join(", ")}) — ${what[rule] ?? rule}`);
    }
  }
  return risen;
}

async function main() {
  const root = process.cwd();
  const configPath = join(root, "panel-kit.config.mjs");
  const raw = existsSync(configPath) ? (await import(pathToFileURL(configPath).href)).default : {};
  const config = resolveConfig(raw);
  const { files, found } = checkProject(root, config);
  const args = new Set(process.argv.slice(2));
  const baselinePath = join(root, config.baseline);
  const total = (rule) => Object.values(found[rule] ?? {}).reduce((s, l) => s + l.length, 0);
  const summary = () =>
    Object.keys(found).length ? Object.keys(found).map((r) => `${r} ${total(r)}`).join(", ") : "no findings";

  if (args.has("--baseline")) {
    writeFileSync(baselinePath, `${JSON.stringify(counts(found), null, 2)}\n`);
    console.log(`panel-kit-check: baseline written (${summary()})`);
  } else if (args.has("--check")) {
    const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : {};
    const risen = risenAbove(found, baseline, config.what);
    if (risen.length) {
      console.error(`panel-kit-check: ${risen.length} new break${risen.length === 1 ? "" : "s"} of the house rules\n  ${risen.join("\n  ")}`);
      console.error("Use the kit's piece, or exempt the file with its reason in panel-kit.config.mjs.");
      process.exitCode = 1;
    } else {
      console.log(`panel-kit-check: nothing new in ${files} files (${summary()})`);
    }
  } else if (args.has("--json")) {
    console.log(JSON.stringify(found, null, 2));
  } else {
    if (!Object.keys(found).length) console.log(`panel-kit-check: ${files} files, every rule kept`);
    for (const [rule, byFile] of Object.entries(found)) {
      const entries = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length);
      console.log(`\n${rule} — ${config.what[rule]}: ${total(rule)} in ${entries.length} files`);
      for (const [file, lines] of entries.slice(0, 12)) {
        console.log(`  ${String(lines.length).padStart(4)}  ${file}  (${lines.slice(0, 6).join(", ")}${lines.length > 6 ? ", …" : ""})`);
      }
      if (entries.length > 12) console.log(`  … and ${entries.length - 12} more files`);
    }
  }
}

// Run when called as a program — through node_modules/.bin too, which may be a
// link — and stay quiet when a test imports the rules.
if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) {
  await main();
}
