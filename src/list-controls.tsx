"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Repeat, Search, SlidersHorizontal, X } from "lucide-react";
import { CTRL_BTN, CTRL_LABEL, iconBtnClass, MENU_ITEM, MENU_LABEL, MENU_PANEL } from "./classes";
import { cn } from "./cn";
import { FilterDrawer } from "./filter-drawer";
import { ActiveDot, HeaderMenu } from "./header-control";
import type { FilterSection, ListConfig, SortOption } from "./list-config";
import { useDynamicOptions, type DynamicOptions } from "./list-options-context";
import { usePanel, usePanelT } from "./panel-provider";
import { Eyebrow } from "./record";
import { useDismiss } from "./use-dismiss";
import { usePanelPathname } from "./use-panel-pathname";

// The top bar's search, filter and sort for the list on screen. The list's
// config comes from PanelProvider `lists`, keyed by its path; a page with no
// config gets no controls. The controls write URL params the list page reads.

// The list the page is showing, with the sorts this person may use: a sort
// that names a capability (a money column) hides from someone without it.
function useListConfig(): ListConfig | null {
  const pathname = usePanelPathname();
  const { lists, can } = usePanel();
  const cfg = lists[pathname];
  if (!cfg) return null;
  return { ...cfg, sorts: cfg.sorts.filter((s) => !s.cap || can(s.cap)) };
}

function SortMenu({
  sorts,
  activeSort,
  dir,
  isDefault,
  onSetSort,
  onSetDir,
}: {
  sorts: SortOption[];
  activeSort: string;
  dir: "asc" | "desc";
  isDefault: boolean;
  onSetSort: (value: string) => void;
  onSetDir: (value: "asc" | "desc") => void;
}) {
  const t = usePanelT();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);

  return (
    <div ref={ref} className="contents">
      <button
        type="button"
        aria-label={t("Sort")}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t("Sort")}
        onClick={() => setOpen((o) => !o)}
        className={CTRL_BTN}
      >
        <ArrowUpDown className="size-[18px]" strokeWidth={1.9} />
        <span className={CTRL_LABEL}>{t("Sort")}</span>
        {!isDefault && <ActiveDot />}
      </button>
      {open && (
        <div role="menu" className={MENU_PANEL}>
          <Eyebrow size="sm" className={MENU_LABEL}>
            {t("Sort by")}
          </Eyebrow>
          {sorts.map((s) => {
            const active = activeSort === s.value;
            return (
              <button
                key={s.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => onSetSort(s.value)}
                className={cn(MENU_ITEM, active ? "font-medium text-ink" : "text-ink/70")}
              >
                {t(s.label)}
                {active && <Check className="size-4 text-brand-deep" strokeWidth={2.5} />}
              </button>
            );
          })}
          <div className="my-1 border-t border-ink/[0.06]" />
          <div className="flex gap-1 p-1">
            {(["desc", "asc"] as const).map((d) => {
              const active = dir === d;
              const Arrow = d === "desc" ? ArrowDown : ArrowUp;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onSetDir(d)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[12px] font-medium transition-colors",
                    active ? "border-ink bg-ink text-surface" : "border-ink/15 text-ink/65 hover:border-ink/30 hover:text-ink",
                  )}
                >
                  <Arrow className="size-3.5" strokeWidth={2.2} />
                  {d === "desc" ? t("Descending") : t("Ascending")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Write URL params, dropping ?page — staying on a deep page after the result
// set shrinks would show an empty table. `key` may be several keys: a range
// chip clears both ends in ONE replace, since two replaces in a row each start
// from the same old address and the second puts back what the first took.
function useSetParam() {
  const pathname = usePanelPathname();
  const router = useRouter();
  const params = useSearchParams();
  return useCallback(
    (key: string | string[], value: string | null) => {
      const next = new URLSearchParams(params.toString());
      for (const k of Array.isArray(key) ? key : [key]) {
        if (value) next.set(k, value);
        else next.delete(k);
      }
      next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );
}

// The list search: a header seat like Filter and Sort. It opens a search bar
// floating in the middle of the header (the header is the nearest positioned
// ancestor); Esc, X or a click outside dismisses it. It writes the debounced
// ?q param every list page filters on.
function HeaderSearch({ hint }: { hint: string }) {
  const t = usePanelT();
  const params = useSearchParams();
  const setParam = useSetParam();
  const urlQ = params.get("q") ?? "";
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(urlQ);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) setValue(urlQ);
  }, [urlQ]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const commit = (next: string) => {
    setValue(next);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setParam("q", next.trim() || null), 350);
  };

  return (
    <div ref={ref} className="contents">
      <button
        type="button"
        aria-label={t("Search")}
        aria-expanded={open}
        title={t("Search")}
        onClick={() => setOpen((o) => !o)}
        className={CTRL_BTN}
      >
        <Search className="size-[18px]" strokeWidth={1.9} />
        <span className={CTRL_LABEL}>{t("Search")}</span>
        {urlQ && <ActiveDot />}
      </button>

      {open && (
        <div className="absolute left-1/2 top-1/2 z-40 w-[min(520px,calc(100%-120px))] -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-10 items-center gap-2.5 rounded-panel border border-brand-deep/45 bg-surface px-3.5 shadow-menu ring-4 ring-brand/10 animate-fade-in">
            <Search className="size-4 shrink-0 text-brand-deep" strokeWidth={2} />
            <input
              ref={inputRef}
              type="search"
              value={value}
              onChange={(e) => commit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  if (value) commit("");
                  else close();
                }
                if (e.key === "Enter") close();
              }}
              placeholder={t(hint)}
              aria-label={t("Search this list")}
              className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink/35 [&::-webkit-search-cancel-button]:appearance-none"
            />
            {value ? (
              <button
                type="button"
                onClick={() => {
                  commit("");
                  inputRef.current?.focus();
                }}
                aria-label={t("Clear search")}
                className={cn(iconBtnClass(7, "ink"), "shrink-0")}
              >
                <X className="size-3.5" strokeWidth={2.2} />
              </button>
            ) : null}
            <span className="hidden shrink-0 rounded-md border border-ink/10 px-1.5 py-0.5 text-[10px] font-medium text-ink/35 sm:block">
              Esc
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// A `choice` section declared with no options of its own is a placeholder for
// values that live in the data — the page fills it by param. One that arrives
// empty (nobody has applied yet, so there are no nationalities) is dropped, so
// the drawer never shows a heading above nothing.
function fillDynamicSections(sections: FilterSection[], dynamic: DynamicOptions): FilterSection[] {
  return sections.flatMap((s): FilterSection[] => {
    if (s.kind !== "choice") return [s];
    const supplied = dynamic[s.param];
    const declared = s.groups.some((g) => g.options.length > 0);
    if (declared || !supplied) return declared ? [s] : [];
    return supplied.length ? [{ ...s, groups: [{ options: supplied }] }] : [];
  });
}

// Search, filter and sort for the list on screen. Mounted once in the header;
// renders nothing on a page that isn't a list.
export function ListControls() {
  const params = useSearchParams();
  const setParam = useSetParam();
  const dynamic = useDynamicOptions();
  const cfg = useListConfig();
  if (!cfg) return null;

  const sorts = cfg.sorts;
  const sections = cfg.filters && fillDynamicSections(cfg.filters, dynamic);
  const status = params.get("status") ?? "";
  const sortParam = params.get("sort") ?? "";
  const dir: "asc" | "desc" = params.get("dir") === "asc" ? "asc" : "desc";
  const activeSort = sorts.some((s) => s.value === sortParam) ? sortParam : cfg.defaultSort;
  const isDefault = activeSort === cfg.defaultSort && dir === "desc";
  const extra = cfg.extraFilter;

  return (
    <div className="contents">
      <HeaderSearch hint={cfg.searchHint ?? "Search"} />
      {sections && sections.length > 0 ? (
        // A list with real depth gets the drawer; the single status menu
        // below is for a list that narrows only one way.
        <FilterDrawer sections={sections} sorts={sorts} defaultSort={cfg.defaultSort} />
      ) : (
        <>
          {cfg.statuses.length > 0 && (
            <HeaderMenu
              icon={<SlidersHorizontal className="size-[18px]" strokeWidth={1.9} />}
              label="Filter"
              sectionLabel={cfg.statusLabel ?? "Status"}
              options={cfg.statuses}
              current={status}
              onSet={(v) => setParam("status", v || null)}
            />
          )}
          {extra && (
            <HeaderMenu
              icon={<Repeat className="size-[18px]" strokeWidth={1.9} />}
              label={extra.label}
              sectionLabel={extra.label}
              options={extra.options}
              current={params.get(extra.param) ?? ""}
              onSet={(v) => setParam(extra.param, v || null)}
            />
          )}
        </>
      )}
      {!cfg.filters && sorts.length > 0 && (
        <SortMenu
          sorts={sorts}
          activeSort={activeSort}
          dir={dir}
          isDefault={isDefault}
          onSetSort={(v) => setParam("sort", v)}
          onSetDir={(v) => setParam("dir", v === "asc" ? "asc" : null)}
        />
      )}
    </div>
  );
}

function FilterChip({ prefix, label, onClear }: { prefix: string; label: string; onClear: () => void }) {
  const t = usePanelT();
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-surface py-1 pe-1 ps-2.5 text-[12px] font-medium text-ink/75">
      <span className="text-quiet">{t(prefix)}:</span>
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={t("Clear the {name} filter", { name: t(prefix) })}
        className={cn(iconBtnClass(7, "ink"), "size-5 rounded-full")}
      >
        <X className="size-3" strokeWidth={2.2} />
      </button>
    </span>
  );
}

// Names the list's active search and filters in plain words, with one click
// to clear each — so a filtered-empty table can never pass for "no data".
// Mounted once in the shell, above the page; renders nothing unless something
// is narrowing the list.
export function ActiveFilterChips() {
  const t = usePanelT();
  const params = useSearchParams();
  const setParam = useSetParam();
  const dynamic = useDynamicOptions();
  const cfg = useListConfig();
  if (!cfg) return null;

  const q = params.get("q") ?? "";
  const search = q ? <FilterChip prefix="Search" label={`“${q}”`} onClear={() => setParam("q", null)} /> : null;

  // A drawer list describes itself from its own sections, so every dimension
  // in the drawer gets a chip without being listed twice. Filled with the
  // page's data-driven values first, so a chip reads "Position: Painter" and
  // not the slug the URL carries.
  const filled = cfg.filters && fillDynamicSections(cfg.filters, dynamic);
  if (filled) {
    const chips = filled.flatMap((s) => {
      if (s.kind === "dateRange") {
        const from = params.get(`${s.param}_from`) ?? "";
        const to = params.get(`${s.param}_to`) ?? "";
        if (!from && !to) return [];
        const label = from && to ? `${from} → ${to}` : from ? t("from {day}", { day: from }) : t("until {day}", { day: to });
        return [{ key: s.param, prefix: s.label, label, clear: () => setParam([`${s.param}_from`, `${s.param}_to`], null) }];
      }
      if (s.kind === "numberRange") {
        const min = params.get(`${s.param}_min`) ?? "";
        const max = params.get(`${s.param}_max`) ?? "";
        if (!min && !max) return [];
        const unit = t(s.unit);
        const label =
          min && max
            ? t("{min} to {max} {unit}", { min, max, unit })
            : min
              ? t("{min} {unit} and over", { min, unit })
              : t("up to {max} {unit}", { max, unit });
        return [{ key: s.param, prefix: s.label, label, clear: () => setParam([`${s.param}_min`, `${s.param}_max`], null) }];
      }
      const value = params.get(s.param) ?? "";
      if (!value) return [];
      const options = s.groups.flatMap((g) => g.options);
      const labelOf = (v: string) => t(options.find((o) => o.value === v)?.label ?? v);
      // A several-answer choice reads its answers in one chip.
      const label = s.multiple ? value.split(",").filter(Boolean).map(labelOf).join(", ") : labelOf(value);
      return [{ key: s.param, prefix: s.label, label, clear: () => setParam(s.param, null) }];
    });
    if (!q && chips.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-2 px-5 pt-4 sm:px-8">
        {search}
        {chips.map((c) => (
          <FilterChip key={c.key} prefix={c.prefix} label={c.label} onClear={c.clear} />
        ))}
      </div>
    );
  }

  const status = params.get("status") ?? "";
  const extra = cfg.extraFilter;
  const extraValue = extra ? (params.get(extra.param) ?? "") : "";
  if (!status && !q && !extraValue) return null;

  const statusLabel = t(cfg.statuses.find((s) => s.value === status)?.label ?? status);
  const extraLabel = t(extra?.options.find((o) => o.value === extraValue)?.label ?? extraValue);

  return (
    <div className="flex flex-wrap items-center gap-2 px-5 pt-4 sm:px-8">
      {search}
      {status && <FilterChip prefix={cfg.statusLabel ?? "Status"} label={statusLabel} onClear={() => setParam("status", null)} />}
      {extraValue && extra && <FilterChip prefix={extra.label} label={extraLabel} onClear={() => setParam(extra.param, null)} />}
    </div>
  );
}
