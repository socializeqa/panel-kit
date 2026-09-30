"use client";

import { useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { fieldBox, POPOVER_SHELL, type FieldSize } from "./classes";
import { cn } from "./cn";
import { useMarkDrawerDirty } from "./drawer";
import { usePanelT } from "./panel-provider";

export interface SelectMenuOption {
  value: string;
  label: string;
  /** A quieter second line under the label, for options that need a hint. */
  hint?: string;
  /** A small glyph before the label — the same one shows in the closed box. */
  icon?: LucideIcon;
  disabled?: boolean;
}

// Radix refuses an item whose value is "" (it means "nothing chosen"), so a
// caller's blank row rides under this sentinel and comes back out as "".
const NONE = "__none__";

// The panel's dropdown — the same box as every Input, opening a floating list
// in the panel's own dress. Built on Radix Select, so keyboard, typeahead and
// screen readers come for free. Use it for any single choice; the native
// Select in fields.tsx stays only where a caller has not moved yet.
export function SelectMenu({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  groups,
  placeholder = "Choose…",
  size = "md",
  disabled,
  required,
  className,
  onCloseAutoFocus,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options?: SelectMenuOption[];
  groups?: { label: string; options: SelectMenuOption[] }[];
  placeholder?: string;
  size?: Extract<FieldSize, "md" | "sm" | "xs">;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Runs as the list closes. Focus then returns to this menu's own box,
   *  unless the handler calls `event.preventDefault()` and puts it somewhere
   *  else (OtherSelect moves it into its text box). */
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const t = usePanelT();
  const toRadix = (v: string | undefined) => (v === "" ? NONE : v);
  // Nothing chosen shows the placeholder — Radix's own reading of "" — unless
  // an option IS the empty choice ("No folder"), which needs the sentinel.
  const hasEmptyOption = (groups ? groups.flatMap((g) => g.options) : (options ?? [])).some((o) => o.value === "");
  const toRoot = (v: string | undefined) => (v === "" && !hasEmptyOption ? "" : toRadix(v));
  const fromRadix = (v: string) => (v === NONE ? "" : v);
  const item = (o: SelectMenuOption) => (
    <Select.Item
      key={o.value}
      value={toRadix(o.value) as string}
      disabled={o.disabled}
      className="relative flex cursor-pointer select-none items-center gap-2 rounded-md py-1.5 pe-2.5 ps-8 text-[13px] text-ink outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-brand-soft data-[highlighted]:text-brand-deep data-[state=checked]:font-medium data-[disabled]:opacity-40"
    >
      <Select.ItemIndicator className="absolute start-2.5 top-1/2 -translate-y-1/2 text-brand-deep">
        <Check size={14} strokeWidth={2.4} aria-hidden="true" />
      </Select.ItemIndicator>
      <span className="flex min-w-0 flex-col">
        <Select.ItemText>
          <span className="inline-flex items-center gap-2">
            {o.icon ? <o.icon size={15} strokeWidth={1.9} aria-hidden="true" className="shrink-0 text-ink/45" /> : null}
            {t(o.label)}
          </span>
        </Select.ItemText>
        {o.hint ? <span className="text-[11px] leading-snug text-quiet">{t(o.hint)}</span> : null}
      </span>
    </Select.Item>
  );

  // The form posts the DOMAIN value, never Radix's sentinel: Radix's own
  // hidden select would post "__none__" for an empty option, and a server read
  // it as a bogus id ("Invalid folder." on every top-level shelf, Elite Touch,
  // 26 Aug 2026). So the name rides our own hidden input, fed by the value this
  // menu actually holds — controlled or not.
  const [inner, setInner] = useState<string>(value ?? defaultValue ?? "");
  const current = value !== undefined ? value : inner;
  const markDirty = useMarkDrawerDirty();

  return (
    <Select.Root
      value={toRoot(value)}
      defaultValue={toRoot(defaultValue)}
      onValueChange={(v) => {
        const next = fromRadix(v);
        markDirty();
        setInner(next);
        onValueChange?.(next);
      }}
      disabled={disabled}
      required={required}
    >
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <Select.Trigger
        id={id}
        className={cn(
          fieldBox(size),
          "flex items-center justify-between gap-2 text-start data-[placeholder]:text-ink/40 data-[state=open]:border-brand-deep data-[state=open]:ring-1 data-[state=open]:ring-brand-deep/30",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          <Select.Value placeholder={t(placeholder)} />
        </span>
        <Select.Icon className="shrink-0 text-ink/40 transition-transform duration-200 ease-out [[data-state=open]>&]:rotate-180">
          <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            POPOVER_SHELL,
            "max-h-[min(20rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] min-w-[10rem] overflow-hidden p-1",
          )}
        >
          <Select.Viewport className="flex flex-col gap-0.5">
            {groups
              ? groups.map((g, i) => (
                  <Select.Group key={g.label} className={cn(i > 0 && "mt-1 border-t border-ink/[0.07] pt-1")}>
                    <Select.Label className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold text-quiet">{t(g.label)}</Select.Label>
                    {g.options.map(item)}
                  </Select.Group>
                ))
              : options?.map(item)}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
