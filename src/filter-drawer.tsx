"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, SlidersHorizontal } from "lucide-react";
import { ChoicePills } from "./choice-pills";
import { CTRL_BTN, CTRL_LABEL, joinedEdge } from "./classes";
import { DateField } from "./date-field";
import { DirtyExempt, Drawer } from "./drawer";
import { DrawerHeader } from "./drawer-header";
import { Button, Field, FieldGroup, Lbl } from "./fields";
import { todayIso } from "./format";
import { ActiveDot } from "./header-control";
import { Hint } from "./hint";
import { JoinedRow } from "./joined-row";
import type { FilterSection, Option, SortOption } from "./list-config";
import { NumberStepper } from "./number-stepper";
import { usePanel, usePanelT } from "./panel-provider";
import { FormBar } from "./record";
import { Section } from "./record-fields";
import { SelectMenu } from "./select-menu";
import { usePanelPathname } from "./use-panel-pathname";

// The URL params one section owns — a date range two, a number range two, a
// choice one.
function sectionParams(s: FilterSection): string[] {
  if (s.kind === "dateRange") return [`${s.param}_from`, `${s.param}_to`];
  if (s.kind === "numberRange") return [`${s.param}_min`, `${s.param}_max`];
  return [s.param];
}

// Every URL param the drawer owns — the sections', and sorting's own pair.
// One list, so applying and clearing can never miss one.
function paramsOf(sections: FilterSection[]): string[] {
  return [...sections.flatMap(sectionParams), "sort", "dir"];
}

/** How many of these sections are narrowing the list right now. */
function activeFilterCount(sections: FilterSection[], params: URLSearchParams): number {
  return sections.filter((s) => sectionParams(s).some((p) => params.get(p))).length;
}

// More than six answers go to a grid of at most six a row — balanced, so seven
// read four and three rather than six and one alone (Señorritas).
function gridColumns(count: number): number | undefined {
  return count > 6 ? Math.ceil(count / Math.ceil(count / 6)) : undefined;
}

// A choice with a `fallback` (the list's own default, a booking list opening
// on this week) shows that answer lit while the URL names none, and picking it
// writes nothing — the URL stays clean for the default.
function ChoiceSection({
  label,
  hint,
  groups,
  value: picked,
  fallback,
  onSet,
  wide = false,
  multiple = false,
}: {
  label: string;
  hint?: string;
  groups: { label?: string; options: Option[] }[];
  value: string;
  fallback?: string;
  onSet: (next: string) => void;
  wide?: boolean;
  multiple?: boolean;
}) {
  const t = usePanelT();
  const value = picked || fallback || "";
  const set = (next: string) => onSet(next === fallback ? "" : next);
  const options = groups.flatMap((g) => g.options);
  const chosen = multiple ? value.split(",").filter(Boolean) : [];
  const labelOf = (v: string) => t(options.find((o) => o.value === v)?.label ?? v);
  const subtitle = multiple ? (chosen.length ? chosen.map(labelOf).join(", ") : t("Any")) : value ? labelOf(value) : t("Any");
  return (
    <Section
      icon={<SlidersHorizontal size={15} strokeWidth={2} aria-hidden="true" />}
      title={label}
      subtitle={subtitle}
      collapsible
      className={wide ? "md:col-span-2" : undefined}
    >
      {groups.map((group, i) => (
        <div key={group.label ?? i} className="flex flex-col gap-1">
          {group.label ? <Lbl>{group.label}</Lbl> : null}
          {multiple ? (
            <ChoicePills
              multiple
              ariaLabel={group.label ?? label}
              options={group.options}
              value={chosen}
              onChange={(next) => set(next.join(","))}
              columns={gridColumns(group.options.length)}
            />
          ) : (
            <ChoicePills
              ariaLabel={group.label ?? label}
              options={group.options}
              value={value}
              onChange={set}
              columns={gridColumns(group.options.length)}
            />
          )}
        </div>
      ))}
      {hint ? <Hint>{hint}</Hint> : null}
    </Section>
  );
}

// A number range (Señorritas' guest ages): two steppers fused, either end left
// empty for "no limit". Posted as <param>_min / <param>_max.
function NumberRangeSection({
  label,
  unit,
  min = 0,
  max = 9999,
  from,
  to,
  onRange,
}: {
  label: string;
  unit: string;
  min?: number;
  max?: number;
  from: string;
  to: string;
  onRange: (from: string, to: string) => void;
}) {
  const t = usePanelT();
  const num = (v: string) => (v === "" ? null : Number(v));
  const str = (n: number | null) => (n === null ? "" : String(n));
  const u = t(unit);
  const summary =
    from && to
      ? t("{min} to {max} {unit}", { min: from, max: to, unit: u })
      : from
        ? t("{min} {unit} and over", { min: from, unit: u })
        : to
          ? t("Up to {max} {unit}", { max: to, unit: u })
          : t("Any");
  return (
    <Section icon={<SlidersHorizontal size={15} strokeWidth={2} aria-hidden="true" />} title={label} subtitle={summary} collapsible>
      {/* A group, not a <label>: a label hands a click on its caption to the
          first button inside it — the stepper's minus. */}
      <FieldGroup label="From and to — leave one empty for no limit">
        <JoinedRow>
          <NumberStepper value={num(from)} onChange={(n) => onRange(str(n), to)} suffix={unit} min={min} max={max} placeholder="Any" className={joinedEdge(0, 2)} />
          <NumberStepper value={num(to)} onChange={(n) => onRange(from, str(n))} suffix={unit} min={min} max={max} placeholder="Any" className={joinedEdge(1, 2)} />
        </JoinedRow>
      </FieldGroup>
    </Section>
  );
}

// The quick windows, counted from the office's today — its zone, not the
// browser's. Plain date arithmetic on a local-midnight Date keeps a day a day.
function dateShortcuts(today: string): { label: string; from: string; to: string }[] {
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const day = (offset: number) => iso(new Date(y, m - 1, d + offset));
  const monthStart = iso(new Date(y, m - 1, 1));
  return [
    { label: "Today", from: day(0), to: day(0) },
    { label: "Last 7 days", from: day(-6), to: day(0) },
    { label: "Last 30 days", from: day(-29), to: day(0) },
    { label: "This month", from: monthStart, to: day(0) },
  ];
}

// A date range — the common windows as one fused bar, and the two DateFields
// under it for precision. A list whose windows are a choice of their own (a
// booking list's When) turns the bar off, so one screen never offers two
// different "This month"s.
function DateSection({
  label,
  from,
  to,
  onRange,
  quick = true,
}: {
  label: string;
  from: string;
  to: string;
  onRange: (from: string, to: string) => void;
  quick?: boolean;
}) {
  const { t, timeZone } = usePanel();
  const shortcuts = useMemo(() => dateShortcuts(todayIso(timeZone)), [timeZone]);
  const summary = from || to ? `${from || "…"} → ${to || "…"}` : t("Any time");
  const activeKey = shortcuts.find((sc) => sc.from === from && sc.to === to)?.label ?? "";
  return (
    <Section icon={<CalendarDays size={15} strokeWidth={2} aria-hidden="true" />} title={label} subtitle={summary} collapsible>
      {quick ? (
        <ChoicePills
          ariaLabel="Quick range"
          options={shortcuts.map((sc) => ({ value: sc.label, label: sc.label }))}
          value={activeKey}
          onChange={(v) => {
            const sc = shortcuts.find((s) => s.label === v);
            onRange(sc?.from ?? "", sc?.to ?? "");
          }}
        />
      ) : null}
      <Field label="From and to">
        <JoinedRow>
          <DateField value={from} onChange={(v) => onRange(v, to)} max={to || undefined} className={joinedEdge(0, 2)} />
          <DateField value={to} onChange={(v) => onRange(from, v)} min={from || undefined} className={joinedEdge(1, 2)} />
        </JoinedRow>
      </Field>
    </Section>
  );
}

// The direction speaks the column's language: dates say newest, amounts
// highest, text A to Z, and a set order reads as itself or reversed.
function dirWords(sort: SortOption | undefined): { desc: string; asc: string } {
  if (sort?.words) return sort.words;
  if (sort?.type === "date") return { desc: "Newest first", asc: "Oldest first" };
  if (sort?.type === "amount") return { desc: "Highest first", asc: "Lowest first" };
  if (sort?.type === "text") return { desc: "Z to A", asc: "A to Z" };
  if (sort?.type === "order") return { desc: "In order", asc: "Reversed" };
  return { desc: "Newest or highest first", asc: "Oldest or lowest first" };
}

function SortSection({
  sorts,
  activeSort,
  dir,
  onSetSort,
  onSetDir,
}: {
  sorts: SortOption[];
  activeSort: string;
  dir: "asc" | "desc";
  onSetSort: (value: string) => void;
  onSetDir: (value: "asc" | "desc") => void;
}) {
  const t = usePanelT();
  const current = sorts.find((s) => s.value === activeSort);
  const words = dirWords(current);
  return (
    <Section
      icon={<ArrowUpDown size={15} strokeWidth={2} aria-hidden="true" />}
      title="Sort"
      className="md:col-span-2"
      subtitle={current ? `${t(current.label)} · ${t(dir === "asc" ? words.asc : words.desc)}` : undefined}
      collapsible
    >
      <Field label="Order by, and which way">
        <JoinedRow>
          <SelectMenu
            value={activeSort}
            onValueChange={onSetSort}
            options={sorts.map((s) => ({ value: s.value, label: s.label }))}
            className={joinedEdge(0, 2)}
          />
          <ChoicePills
            ariaLabel="Direction"
            className={joinedEdge(1, 2)}
            flush="start"
            value={dir}
            // A direction is always one or the other — a tap on the lit one keeps it.
            onChange={(v) => onSetDir(v === "asc" ? "asc" : "desc")}
            options={[
              { value: "desc", label: words.desc, icon: <ArrowDown size={14} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-ink/40" /> },
              { value: "asc", label: words.asc, icon: <ArrowUp size={14} strokeWidth={2.2} aria-hidden="true" className="shrink-0 text-ink/40" /> },
            ]}
          />
        </JoinedRow>
      </Field>
    </Section>
  );
}

/**
 * The list's filter drawer: every dimension the list can be narrowed by, in
 * one organised panel instead of a row of competing menus. Choices are held
 * here while the drawer is open and written to the URL on "Show results", so
 * the table behind it doesn't re-query on every pill.
 */
export function FilterDrawer({
  sections,
  sorts,
  defaultSort,
}: {
  sections: FilterSection[];
  sorts: SortOption[];
  defaultSort: string;
}) {
  const t = usePanelT();
  const pathname = usePanelPathname();
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  // Open with whatever the URL says now, so the drawer never shows a stale
  // draft from a filter a chip has cleared meanwhile.
  const openWithUrlState = useCallback(() => {
    const next: Record<string, string> = {};
    for (const p of paramsOf(sections)) next[p] = params.get(p) ?? "";
    setDraft(next);
    setOpen(true);
  }, [params, sections]);

  const active = activeFilterCount(sections, new URLSearchParams(params.toString()));
  // The header dot answers "is this list showing me something other than the
  // plain default?" — a changed order counts as much as a filter.
  const urlSort = params.get("sort");
  const orderChanged = (!!urlSort && urlSort !== defaultSort) || params.get("dir") === "asc";
  const sorted = (draft.sort && draft.sort !== defaultSort) || draft.dir === "asc";
  const touched = sorted || sections.some((sec) => paramsOf([sec]).some((key) => key !== "sort" && key !== "dir" && draft[key]));

  const apply = (values: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const p of paramsOf(sections)) {
      const v = values[p];
      if (v) next.set(p, v);
      else next.delete(p);
    }
    // A narrower list can't still be on page 9.
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label={t("Filter and sort")}
        aria-expanded={open}
        title={t("Filter & sort")}
        onClick={openWithUrlState}
        className={CTRL_BTN}
      >
        <SlidersHorizontal className="size-[18px]" strokeWidth={1.9} />
        <span className={CTRL_LABEL}>{t("Filter")}</span>
        {(active > 0 || orderChanged) && <ActiveDot />}
      </button>

      {open && (
        <Drawer title="Filter & sort" open={open} onOpenChange={setOpen} padded={false}>
          <DrawerHeader
            title="Filter & sort"
            sub={active ? t(active === 1 ? "{n} filter on" : "{n} filters on", { n: active }) : t("Narrow the list, then order it")}
          />
          <DirtyExempt>
            <div className="flex min-h-full flex-1 flex-col">
              {/* Half and half: a short choice sits beside another; a wide bar
                  (more than four pills) and the date pair take the full row. */}
              <div className="grid flex-1 content-center gap-4 px-5 pt-6 sm:px-7 md:grid-cols-2">
                {sections.map((s) =>
                  s.kind === "choice" ? (
                    <ChoiceSection
                      key={s.param}
                      wide={s.wide ?? s.groups.some((g) => g.options.length > 4)}
                      label={s.label}
                      hint={s.hint}
                      groups={s.groups}
                      fallback={s.fallback}
                      multiple={s.multiple}
                      value={draft[s.param] ?? ""}
                      onSet={(next) => setDraft((d) => ({ ...d, [s.param]: next }))}
                    />
                  ) : s.kind === "numberRange" ? (
                    <NumberRangeSection
                      key={s.param}
                      label={s.label}
                      unit={s.unit}
                      min={s.min}
                      max={s.max}
                      from={draft[`${s.param}_min`] ?? ""}
                      to={draft[`${s.param}_max`] ?? ""}
                      onRange={(from, to) => setDraft((d) => ({ ...d, [`${s.param}_min`]: from, [`${s.param}_max`]: to }))}
                    />
                  ) : (
                    <DateSection
                      key={s.param}
                      label={s.label}
                      quick={s.quick !== false}
                      from={draft[`${s.param}_from`] ?? ""}
                      to={draft[`${s.param}_to`] ?? ""}
                      onRange={(from, to) => setDraft((d) => ({ ...d, [`${s.param}_from`]: from, [`${s.param}_to`]: to }))}
                    />
                  ),
                )}
                {/* Sorting lives here too — narrowing a list and ordering it
                    are one thought, so they are one panel. A list ordered by a
                    named choice instead (Señorritas' staff app: "soonest
                    first") has no columns, and no column picker. */}
                {sorts.length > 0 ? (
                  <SortSection
                    sorts={sorts}
                    activeSort={draft.sort && sorts.some((s) => s.value === draft.sort) ? draft.sort : defaultSort}
                    dir={draft.dir === "asc" ? "asc" : "desc"}
                    onSetSort={(v) => setDraft((d) => ({ ...d, sort: v }))}
                    onSetDir={(v) => setDraft((d) => ({ ...d, dir: v === "asc" ? "asc" : "" }))}
                  />
                ) : null}
              </div>
              <FormBar>
                <Button type="button" size="lg" onClick={() => apply(draft)}>
                  {t("Show results")}
                </Button>
                <Button type="button" size="lg" variant="ghost" disabled={!touched} onClick={() => apply({})}>
                  {t("Clear all")}
                </Button>
              </FormBar>
            </div>
          </DirtyExempt>
        </Drawer>
      )}
    </>
  );
}
