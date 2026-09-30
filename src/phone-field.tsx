"use client";

import { useEffect, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, digits, format, parse, type Country } from "@socialize/team-kit/phone";
import { fieldBox, iconBtnClass, POPOVER_SHELL } from "./classes";
import { cn } from "./cn";
import { CaretInput } from "./caret-safe";
import { useMarkDrawerDirty } from "./drawer";
import { usePanel } from "./panel-provider";

// The phone field and the country pickers. The numbers are read and written
// by @socialize/team-kit's phone module — the one parser every team app
// shares, longest dial code first — and the countries are its list unless the
// app hands in its own (PanelProvider `countries`). How a flag is drawn is the
// app's too (`flag`): one ships flag-icons, another its own sheet; without
// one the dial code stands alone.

function useCountries() {
  const { countries, defaultCountry, flag } = usePanel();
  return { list: countries ?? COUNTRIES, fallback: defaultCountry ?? DEFAULT_COUNTRY, flag };
}

/**
 * A stored number split for display: the country it dials and its local part.
 * Only a number written in full (+ or 00) carries its country; a bare local
 * number is the panel's own country's, the way a Doha office writes them.
 */
export function parseDialNumber(
  value: string,
  fallbackIso: string = DEFAULT_COUNTRY,
): { country: Country | null; national: string } {
  const all = digits(value);
  if (!all) return { country: null, national: "" };
  const full = value.trim().startsWith("+") || all.startsWith("00");
  if (!full) return { country: COUNTRIES.find((c) => c.iso === fallbackIso) ?? null, national: all };
  const hit = parse(all.replace(/^00/, ""));
  return hit ? { country: hit.country, national: hit.national } : { country: null, national: all };
}

/** The app's flag for a country, or nothing. */
export function Flag({ iso, className }: { iso: string; className?: string }) {
  const { flag } = useCountries();
  if (!flag) return null;
  return (
    <span aria-hidden="true" className={cn("inline-flex shrink-0", className)}>
      {flag(iso)}
    </span>
  );
}

// A read-only number: the flag and the number the way it is written down
// ("+974 5512 3456"). For tables and a record's details.
export function PhoneValue({ value, className }: { value: string | null; className?: string }) {
  const { fallback } = useCountries();
  if (!value) return <span className="text-ink/40">—</span>;
  const { country, national } = parseDialNumber(value, fallback);
  return (
    <span dir="ltr" className={cn("inline-flex items-center gap-1.5", className)}>
      {country ? <Flag iso={country.iso} /> : null}
      <span className="tabular-nums">{country ? format(`+${country.dial}${national}`) : value}</span>
    </span>
  );
}

// The country list behind both pickers — a dial code's and a nationality's: a
// search box, then the countries in the order the app gave them (team-kit's
// is the Gulf first, then the places staff and clients come from). Its query
// lives here, so it starts empty each time the list opens.
function CountryMenu({
  iso,
  onPick,
  showCode = true,
}: {
  iso: string | null;
  onPick: (iso: string) => void;
  showCode?: boolean;
}) {
  const { t } = usePanel();
  const { list } = useCountries();
  const [query, setQuery] = useState("");

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return list;
    return list.filter(
      (c) => t(c.name).toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (showCode && c.dial.startsWith(q)) || c.iso.toLowerCase() === q,
    );
  }, [query, list, showCode, t]);

  return (
    // Floats out of the field (a Section card clips anything inside it) in the
    // same dress as every SelectMenu list.
    <Popover.Portal>
      <Popover.Content
        align="start"
        sideOffset={6}
        collisionPadding={12}
        onOpenAutoFocus={(e) => {
          // Land in the search box, not on the first row.
          e.preventDefault();
          (e.currentTarget as HTMLElement).querySelector("input")?.focus();
        }}
        className={cn(POPOVER_SHELL, "w-[300px] overflow-hidden")}
      >
        <div className="flex items-center gap-2 border-b border-ink/[0.07] px-3">
          <Search className="size-4 shrink-0 text-ink/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Enter takes the first match — type "ind", Enter, done.
              const first = hits[0];
              if (e.key === "Enter" && first) {
                e.preventDefault();
                onPick(first.iso);
              }
            }}
            placeholder={showCode ? t("Country or code…") : t("Search countries…")}
            aria-label={t("Search countries")}
            data-dirty-exempt
            className="w-full bg-transparent py-2.5 text-[13px] text-ink outline-none placeholder:text-ink/35"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {hits.map((c) => (
            <button
              key={c.iso}
              type="button"
              onClick={() => onPick(c.iso)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-start text-[13px] text-ink transition-colors hover:bg-brand-soft hover:text-brand-deep",
                c.iso === iso && "font-medium",
              )}
            >
              <Flag iso={c.iso} />
              <span className="min-w-0 flex-1 truncate">{t(c.name)}</span>
              {showCode ? <span className="shrink-0 tabular-nums text-quiet">+{c.dial}</span> : null}
              {c.iso === iso ? <Check size={14} strokeWidth={2.4} aria-hidden="true" className="shrink-0 text-brand-deep" /> : null}
            </button>
          ))}
          {hits.length === 0 ? <p className="px-3 py-6 text-center text-[13px] text-quiet">{t("No match.")}</p> : null}
        </div>
      </Popover.Content>
    </Popover.Portal>
  );
}

function CountrySelect({ iso, onSelect }: { iso: string; onSelect: (iso: string) => void }) {
  const { t } = usePanel();
  const { list } = useCountries();
  const [open, setOpen] = useState(false);
  const current = list.find((c) => c.iso === iso) ?? COUNTRIES.find((c) => c.iso === iso);
  const markDirty = useMarkDrawerDirty();
  const pick = (next: string) => {
    markDirty();
    onSelect(next);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={t("Country code")}
        className="flex shrink-0 items-center gap-1.5 rounded-s-control py-2 pe-2 ps-3 text-[14px] text-ink transition-colors hover:bg-ink/[0.03] data-[state=open]:bg-brand-soft"
      >
        <Flag iso={iso} />
        <span dir="ltr" className="tabular-nums text-ink/70">
          {current ? `+${current.dial}` : "+"}
        </span>
        <ChevronDown className="size-3.5 text-quiet transition-transform duration-200 ease-out [[data-state=open]>&]:rotate-180" strokeWidth={2} />
      </Popover.Trigger>
      <CountryMenu iso={iso} onPick={pick} />
    </Popover.Root>
  );
}

// A country on its own — a guest's nationality (Señorritas). The same list as
// the dial code's, in the one field box: the flag and the country's name, or
// the placeholder, and an × to clear it. Posts the country's NAME under
// `name`, in the list's own spelling. A stored name the list does not know is
// shown as written, without a flag, and kept until changed.
export function CountryField({
  id,
  name,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Choose a country",
  className,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (country: string) => void;
  placeholder?: string;
  /** Extra classes on the box — a JoinedRow passes the edge rounding. */
  className?: string;
}) {
  const { t } = usePanel();
  const { list } = useCountries();
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const known = list.find((c) => c.name.toLowerCase() === current.trim().toLowerCase());
  const markDirty = useMarkDrawerDirty();
  const set = (next: string) => {
    markDirty();
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <Popover.Anchor asChild>
        <div className={cn(fieldBox("md"), "flex items-center p-0", open && "border-brand-deep ring-1 ring-brand-deep/30", className)}>
          <Popover.Trigger
            id={id}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-control py-2 pe-2 ps-3 text-start text-[14px] text-ink outline-none"
          >
            {known ? <Flag iso={known.iso} /> : null}
            <span className={cn("min-w-0 flex-1 truncate", !current && "text-ink/40")}>
              {current ? t(known?.name ?? current) : t(placeholder)}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-quiet transition-transform duration-200 ease-out [[data-state=open]>&]:rotate-180" strokeWidth={2} />
          </Popover.Trigger>
          {current ? (
            <button
              type="button"
              aria-label={t("Clear the country")}
              onClick={() => set("")}
              className={cn(iconBtnClass(7, "ink"), "me-1.5 size-6 shrink-0 text-ink/35")}
            >
              <X size={13} strokeWidth={2.2} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </Popover.Anchor>
      <CountryMenu
        iso={known?.iso ?? null}
        showCode={false}
        onPick={(next) => {
          set(list.find((c) => c.iso === next)?.name ?? "");
          setOpen(false);
        }}
      />
    </Popover.Root>
  );
}

// An editable phone with the country's dial code before it. Posts one hidden
// input under `name` holding the whole number ("+97455123456"), so a save
// that reads one phone string keeps working unchanged.
export function PhoneInput({
  name,
  defaultValue,
  onValueChange,
  placeholder = "Phone number",
  className,
  endSlot,
}: {
  name: string;
  defaultValue?: string | null;
  // Lets a form watch the whole number (the field otherwise keeps it inside
  // and only posts it through the hidden input).
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Extra classes on the box — a JoinedRow passes the edge rounding. */
  className?: string;
  /** Something small seated at the end of the box. */
  endSlot?: React.ReactNode;
}) {
  const { t } = usePanel();
  const { list, fallback } = useCountries();
  const parsed = parseDialNumber(defaultValue ?? "", fallback);
  const [iso, setIso] = useState(parsed.country?.iso ?? fallback);
  const [national, setNational] = useState(parsed.national);

  const typed = digits(national);
  const dial = (list.find((c) => c.iso === iso) ?? COUNTRIES.find((c) => c.iso === iso))?.dial ?? "";
  const combined = typed ? `+${dial}${typed}` : "";

  // Fire only when the whole number actually changes — NOT when the parent
  // re-creates `onValueChange` each render: listing the callback here would
  // loop (a new identity each render re-runs the effect, which sets state in
  // the parent, which renders again).
  useEffect(() => {
    onValueChange?.(combined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combined]);

  return (
    <div
      className={cn(
        fieldBox("md"),
        "flex items-center p-0 focus-within:border-brand-deep focus-within:ring-1 focus-within:ring-brand-deep/30",
        className,
      )}
    >
      <CountrySelect iso={iso} onSelect={setIso} />
      <span className="h-5 w-px bg-ink/10" />
      <CaretInput
        type="tel"
        inputMode="numeric"
        dir="ltr"
        autoComplete="tel-national"
        value={national}
        onChange={(e) => setNational(e.target.value)}
        placeholder={t(placeholder)}
        className="w-full bg-transparent px-3 py-2 text-[14px] text-ink outline-none placeholder:text-ink/35"
      />
      {endSlot}
      <input type="hidden" name={name} value={combined} />
    </div>
  );
}
