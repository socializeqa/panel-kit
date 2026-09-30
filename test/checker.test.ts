import { describe, expect, it } from "vitest";
// @ts-expect-error — the checker is plain JavaScript, shipped as a bin with no types.
import { checkSource, checkStylesheet, resolveConfig, risenAbove } from "../bin/panel-kit-check.mjs";

// The checker's rules, each shown one break it must catch and one line it
// must leave alone. A rule that stops catching is a rule that reports green
// while the thing it guards erodes — Elite Touch's first style guard did,
// for months.

type Finding = { rule: string; line: number };
const all = resolveConfig({ css: null, rules: { "date-format": true, "date-math": true, "money-format": true, "helper-copy": true, "raw-write": true } });
const rulesIn = (text: string, config = all, rel = "src/app/admin/page.tsx"): string[] =>
  (checkSource(rel, text, config) as Finding[]).map((f) => f.rule);

describe("the shapes that live in the kit", () => {
  it.each([
    ["gradient-button", `<b className="bg-gradient-to-br from-brand-bright via-brand to-brand-deep" />`],
    ["panel-shell", `<div className="rounded-xl border border-ink/10 bg-surface p-5 shrink-0" />`],
    ["chip", `<span className="rounded-full border border-ink/10 bg-ink/[0.03] px-2" />`],
    ["icon-button", `<button className="grid size-8 place-items-center rounded-lg hover:bg-ink/5" />`],
    ["field-box", `<input className="w-full rounded-lg border border-ink/15 bg-surface px-3" />`],
  ])("%s is caught with a utility slipped in", (rule, line) => {
    expect(rulesIn(line)).toContain(rule);
  });

  it("leaves a decorative medallion alone — no hover, no button", () => {
    expect(rulesIn(`<span className="grid size-8 place-items-center rounded-lg bg-ink/5" />`)).not.toContain("icon-button");
  });
});

describe("the house rules", () => {
  it("catches all-caps and wide tracking, and lets first-letter sentence case through", () => {
    expect(rulesIn(`<p className="uppercase text-[11px]" />`)).toContain("caps");
    expect(rulesIn(`<p className="md:uppercase" />`)).toContain("caps");
    expect(rulesIn(`<p className="tracking-[0.12em]" />`)).toContain("caps");
    expect(rulesIn(`<p className="first-letter:uppercase" />`)).not.toContain("caps");
  });

  it("catches half-pixel type", () => {
    expect(rulesIn(`<p className="text-[12.5px]" />`)).toContain("half-pixel");
    expect(rulesIn(`<p className="text-[12px]" />`)).not.toContain("half-pixel");
  });

  it("catches a brand slab, and leaves a wash or the brand as words alone", () => {
    expect(rulesIn(`<div className="bg-brand p-10" />`)).toContain("brand-slab");
    expect(rulesIn(`<div className="bg-brand/60" />`)).toContain("brand-slab");
    expect(rulesIn(`<div className="hover:bg-brand" />`)).toContain("brand-slab");
    expect(rulesIn(`<div className="bg-brand/[0.8]" />`)).toContain("brand-slab");
    expect(rulesIn(`<div className="bg-brand-soft text-brand-deep border-brand-deep" />`)).not.toContain("brand-slab");
    expect(rulesIn(`<div className="bg-brand/10 bg-brand/[0.05]" />`)).not.toContain("brand-slab");
  });

  it("catches a monospace face wherever it is named", () => {
    expect(rulesIn(`<code className="font-mono" />`)).toContain("font-mono");
    expect(rulesIn(`const face = "ui-monospace, Menlo";`)).toContain("font-mono");
    expect(rulesIn(`import { Geist_Mono } from "next/font/google";`)).toContain("font-mono");
    expect(rulesIn(`<p className="tabular-nums" />`)).not.toContain("font-mono");
  });

  it.each([
    ["transition-all", `<b className="transition-all" />`],
    ["ease-in", `<b className="transition-transform ease-in" />`],
    ["a 400ms move", `<b className="transition-transform duration-400" />`],
    ["a slow keyframe", `<b className="animate-[drawer-in_0.35s_ease]" />`],
    ["a height on the move", `<b className="transition-[height,opacity]" />`],
    ["grid rows on the move", `<b className="transition-[grid-template-rows,opacity] duration-300" />`],
    ["a 200ms colour fade", `<b className="transition-colors duration-200 hover:text-ink" />`],
    ["growing from nothing", `<b className="scale-0" />`],
    ["hover motion a phone would fire", `<b className="hover:-translate-y-0.5" />`],
    ["a bounce", `<b className="animate-bounce" />`],
  ])("the motion rule catches %s", (_, line) => {
    expect(rulesIn(line)).toContain("motion");
  });

  it.each([
    ["a 150ms colour fade", `<b className="transition-colors duration-150" />`],
    ["a press", `<b className="transition-[scale,color] duration-150 ease-out motion-safe:active:scale-[0.97]" />`],
    ["a drawer on its curve", `<b className="transition-transform duration-300 ease-out" />`],
    ["an ease-in-out", `<b className="transition-transform ease-in-out duration-200" />`],
    ["hover motion behind fine:", `<b className="fine:hover:-translate-y-0.5 fine:group-hover/x:scale-105" />`],
    ["a spinner", `<b className="animate-spin" />`],
  ])("the motion rule leaves %s alone", (_, line) => {
    expect(rulesIn(line)).not.toContain("motion");
  });

  it("catches dark: in a room — the tokens flip on their own", () => {
    expect(rulesIn(`<div className="bg-surface dark:bg-black" />`)).toContain("dark-in-rooms");
    expect(rulesIn(`<div className="md:dark:text-white" />`)).toContain("dark-in-rooms");
  });

  it("catches a typed colour in code, but not in a comment", () => {
    expect(rulesIn(`const c = "#80001E";`)).toContain("typed-colour");
    expect(rulesIn(`style={{ color: "rgb(0 0 0)" }}`)).toContain("typed-colour");
    expect(rulesIn(`// the crimson #80001E, for the record`)).not.toContain("typed-colour");
    expect(rulesIn(`const c = "var(--brand)";`)).not.toContain("typed-colour");
  });

  it("catches the browser's own dialogs", () => {
    expect(rulesIn(`if (window.confirm("Sure?")) go();`)).toContain("browser-dialog");
    expect(rulesIn(`alert("Saved");`)).toContain("browser-dialog");
    expect(rulesIn(`onConfirm(why);`)).not.toContain("browser-dialog");
  });

  it("catches a sparkle, a wand or a robot for AI", () => {
    expect(rulesIn(`import { Sparkles, Users } from "lucide-react";`)).toContain("ai-icons");
    expect(rulesIn(`import { Bot as Helper } from "lucide-react";`)).toContain("ai-icons");
    expect(rulesIn(`import { WandSparklesIcon } from "lucide-react";`)).toContain("ai-icons");
    expect(rulesIn(`import { Brain, MessageSquare } from "lucide-react";`)).not.toContain("ai-icons");
  });

  it("catches a leftover import from the app's old kit copy", () => {
    expect(rulesIn(`import { Drawer } from "@/components/admin/drawer";`)).toContain("local-kit-import");
    expect(rulesIn(`import { Drawer } from "@socialize/panel-kit/drawer";`)).not.toContain("local-kit-import");
    const custom = resolveConfig({ css: null, legacyKit: ["@/ui/"] });
    expect(rulesIn(`import { X } from "@/ui/x";`, custom)).toContain("local-kit-import");
  });

  it("catches a list that doesn't fill its screen, both halves", () => {
    expect(rulesIn(`<DataTable rows={r} />`)).toContain("table-fills-screen");
    expect(rulesIn(`const p = resolvePageAdaptive(sp.page, rows);\n<DataTable fill rows={r} />`)).not.toContain("table-fills-screen");
    expect(rulesIn(`const p = await resolvePageFromCookie(sp.page);\n<DataTable rows={r} />`)).toContain("table-fills-screen");
  });

  it("catches the hand-built pieces the kit already has", () => {
    expect(rulesIn(`<table className="w-full" />`)).toContain("raw-table");
    expect(rulesIn(`<input type="date" />`)).toContain("native-date");
    expect(rulesIn(`<input type="checkbox" />`)).toContain("native-check");
    expect(rulesIn(`import * as Dialog from "@radix-ui/react-dialog";`)).toContain("hand-drawer");
  });

  it('catches a class string exported from a "use client" module, and allows it elsewhere', () => {
    const client = `"use client";\nexport const SHELL = "rounded-xl border";\nexport const MENU = cn("a", "b");`;
    expect(rulesIn(client).filter((r) => r === "client-exports-class")).toHaveLength(2);
    expect(rulesIn(`export const SHELL = "rounded-xl border";`)).not.toContain("client-exports-class");
  });

  it("holds the brain rules off until an app turns them on", () => {
    const quiet = resolveConfig({ css: null });
    expect(rulesIn(`const t = amount.toFixed(2);`, quiet)).not.toContain("money-format");
    expect(rulesIn(`const t = amount.toFixed(2);`)).toContain("money-format");
    expect(rulesIn(`function formatQAR(n) {}`)).toContain("helper-copy");
    expect(rulesIn(`d.setDate(d.getDate() + 1);`)).toContain("date-math");
    expect(rulesIn(`new Intl.DateTimeFormat("en-GB")`)).toContain("date-format");
    expect(rulesIn(`await db.from("payments").update({ a: 1 }).eq("id", id);`)).toContain("raw-write");
    expect(rulesIn(`await db.from("payments").update({ a: 1 }).eq("id", id).select();`)).not.toContain("raw-write");
  });
});

describe("the escape and the exemptions", () => {
  it("lets a line through that says why, on it or in the comment block above", () => {
    expect(rulesIn(`<b className="uppercase" /> {/* style-guard-ignore: a bank code is capitals by nature */}`)).not.toContain("caps");
    const above = `// style-guard-ignore: the printed sheet stays light on paper,\n// whatever the reader's theme\nconst c = "#ffffff";`;
    expect(rulesIn(above)).not.toContain("typed-colour");
    expect(rulesIn(`// style-guard-ignore:\nconst c = "#ffffff";`)).toContain("typed-colour");
  });

  it("exempts a file for a rule only with a reason", () => {
    const config = resolveConfig({ css: null, exempt: [{ match: "src/app/admin/print/", rules: ["typed-colour"], why: "a printed sheet" }] });
    expect(rulesIn(`const c = "#ffffff";`, config, "src/app/admin/print/sheet.tsx")).not.toContain("typed-colour");
    expect(rulesIn(`const c = "#ffffff";`, config, "src/app/admin/printer.tsx")).toContain("typed-colour");
    expect(() => resolveConfig({ exempt: [{ match: "src/x.tsx", rules: ["caps"], why: " " }] })).toThrow(/no reason/);
    expect(() => resolveConfig({ rules: { "no-such-rule": true } })).toThrow(/no rule/);
  });

  it("carries an app's own code rules, with their words in the report", () => {
    const config = resolveConfig({
      css: null,
      custom: [{ id: "upload-ticket", what: "raw createSignedUploadUrl — mint tickets through lib/admin/upload-ticket", test: /createSignedUploadUrl\(/g }],
      exempt: [{ match: "src/lib/admin/upload-ticket.ts", rules: ["upload-ticket"], why: "the ticket's own home" }],
    });
    expect(rulesIn(`await bucket.createSignedUploadUrl(path);`, config)).toContain("upload-ticket");
    expect(rulesIn(`await bucket.createSignedUploadUrl(path);`, config, "src/lib/admin/upload-ticket.ts")).not.toContain("upload-ticket");
    const risen = risenAbove({ "upload-ticket": { "a.ts": [4] } }, {}, config.what) as string[];
    expect(risen[0]).toContain("mint tickets through lib/admin/upload-ticket");
    expect(() => resolveConfig({ custom: [{ id: "caps", what: "x", test: /x/g }] })).toThrow(/its own id/);
    expect(() => resolveConfig({ custom: [{ id: "mine", what: "x", test: /x/ }] })).toThrow(/\/g regex/);
  });

  it("gives a shape its home", () => {
    const config = resolveConfig({ css: null, homes: { chip: ["src/components/chip.tsx"] } });
    const line = `<span className="rounded-full border border-ink/10 bg-ink/[0.03]" />`;
    expect(rulesIn(line, config, "src/components/chip.tsx")).not.toContain("chip");
    expect(rulesIn(line, config, "src/app/admin/page.tsx")).toContain("chip");
  });
});

describe("the baseline — a count may only fall", () => {
  const found = { caps: { "a.tsx": [3, 9], "b.tsx": [1] } };

  it("reports a file whose count rose, and a file new to the rule", () => {
    const risen = risenAbove(found, { caps: { "a.tsx": 1 } }) as string[];
    expect(risen).toHaveLength(2);
    expect(risen[0]).toContain("a.tsx 1 → 2");
    expect(risen[1]).toContain("b.tsx 0 → 1");
  });

  it("is quiet when every count held or fell", () => {
    expect(risenAbove(found, { caps: { "a.tsx": 2, "b.tsx": 4 } })).toEqual([]);
  });
});

describe("the stylesheet", () => {
  it("wants the import and the @source — a missing @source fails silently in the browser", () => {
    const good = `@import "tailwindcss";\n@import "@socialize/panel-kit/kit.css";\n@source "../node_modules/@socialize/panel-kit/src";`;
    expect(checkStylesheet(good)).toEqual([]);
    expect(checkStylesheet(`@import "tailwindcss";\n@import "@socialize/panel-kit/kit.css";`)).toEqual([
      'no @source ".../@socialize/panel-kit/src"',
    ]);
    expect(checkStylesheet(`@import "tailwindcss";`)).toHaveLength(2);
  });
});
