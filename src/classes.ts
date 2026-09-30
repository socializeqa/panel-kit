import { cn } from "./cn";

// ════════════════════════════════════════════════════════════════════════
// Every class string the kit shares, in one module with no "use client".
//
// Elite Touch paid for this: a constant exported from a client file reaches a
// server component as a client REFERENCE, not a string, and cn() silently
// drops it — a server-rendered list lost its row buttons' styling with no
// error anywhere. So the shapes a server component may read live here, and
// the client modules import them from here and never re-export them.
// (The checker's client-exports-class rule holds the kit to that.)
// ════════════════════════════════════════════════════════════════════════

// ── The one input box ─────────────────────────────────────────────────────
// Every text input, select and textarea derives from this — Elite Touch's
// audit found 16 competing field styles; this is the one they converged on.
// "md" is the shared Input/Select size, "sm" a drawer's inline cell,
// "compact" and "xs" the dense picker rows.
const FIELD_SIZES = {
  md: "px-3 py-2 text-[14px]",
  sm: "px-3 py-2 text-[13px]",
  compact: "px-2.5 py-2 text-[13px]",
  xs: "px-2.5 py-1.5 text-[13px]",
} as const;
export type FieldSize = keyof typeof FIELD_SIZES;

export function fieldBox(size: FieldSize = "md"): string {
  return cn(
    "w-full rounded-control border border-ink/15 bg-surface text-ink outline-none transition-colors focus:border-brand-deep focus:ring-1 focus:ring-brand-deep/30 disabled:opacity-60",
    FIELD_SIZES[size],
  );
}

// ── The one button ────────────────────────────────────────────────────────
// Elite Touch's audit counted 11 hand-rolled primary styles in 3 families;
// these props absorb them. `emphasis="gradient"` is the decision-rail look,
// `tone="ink"` the dark primary, `size="sm"` the compact rows.
export interface ButtonLook {
  variant?: "primary" | "ghost" | "danger";
  emphasis?: "flat" | "gradient";
  tone?: "brand" | "ink";
  size?: "md" | "sm" | "lg";
}

// A filled brand or danger button darkens a step toward black on hover — the
// same move whatever the colour, so no app needs a hover shade of its own.
const DEEPER_BRAND = "hover:bg-[color-mix(in_oklab,var(--brand)_88%,black)]";
const DEEPER_DANGER = "hover:bg-[color-mix(in_oklab,var(--danger)_88%,black)]";

export function buttonClass({
  variant = "primary",
  emphasis = "flat",
  tone = "brand",
  size = "md",
}: ButtonLook = {}): string {
  const styles =
    variant === "primary" && emphasis === "gradient"
      ? "bg-gradient-to-br from-brand-bright via-brand to-brand-deep text-brand-ink shadow-kit-lift hover:opacity-95"
      : variant === "primary" && tone === "ink"
        ? "bg-ink text-surface shadow-kit-tile hover:opacity-90"
        : {
            primary: cn("bg-brand text-brand-ink", DEEPER_BRAND),
            ghost: "border-ink/15 text-ink hover:bg-ink/5",
            danger: cn("bg-danger text-surface", DEEPER_DANGER),
          }[variant];
  // Every tier wears a border — transparent on the filled looks — so a primary
  // and a ghost side by side measure the same height to the pixel, and the
  // button sizes its own glyph so callers can't drift. A press sinks it to
  // 0.97 (motion-safe: a person who asked for less motion gets the colour
  // change alone); the colours fade in 150ms, the house ceiling for a fade.
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-control border border-transparent font-semibold transition-[color,background-color,border-color,opacity,scale] duration-150 ease-out motion-safe:active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100 [&_svg]:shrink-0",
    size === "sm"
      ? "px-3 py-1.5 text-[12px] [&_svg]:size-3.5"
      : size === "lg"
        ? "px-5 py-2.5 text-[14px] shadow-kit-lift [&_svg]:size-4"
        : "px-3.5 py-2 text-[13px] [&_svg]:size-4",
    styles,
  );
}

// The bordered, quiet "Add line / New clause / Mark all read" pill that sits
// inside content (Button is a form's primary or footer action). Every
// pressable in the kit sinks to 0.97 under the finger, like Button.
const PRESS = "transition-[color,background-color,border-color,scale] duration-150 ease-out motion-safe:active:scale-[0.97]";
export const PILL_BUTTON = cn(
  "inline-flex w-fit items-center gap-1.5 rounded-control border border-ink/15 px-3 py-1.5 text-[12px] font-medium text-ink/70 hover:border-ink/30 hover:text-ink disabled:opacity-60 [&_svg]:size-3.5 [&_svg]:shrink-0",
  PRESS,
);

// ── Surfaces ──────────────────────────────────────────────────────────────
// The one card shell — the audit found ~30 hand copies with 8 paddings.
export const PANEL_SHELL = "rounded-panel border border-ink/10 bg-surface shadow-kit-panel";

// The one floating surface — pickers, row menus, the calendar and the clock
// (Elite Touch's POPOVER_SHELL, 28 Sep 2026: five components had typed it by
// hand). It grows a hair from its trigger — Radix hands the origin to a
// popover and to a select under two names, so both are read — on a strong
// ease-out, and fades out quicker. It carries `kit` because a portal sits
// outside the Shell.
export const POPOVER_SHELL = cn(
  PANEL_SHELL,
  "kit z-[80] shadow-kit-menu outline-none origin-[var(--radix-popover-content-transform-origin,var(--radix-select-content-transform-origin))] data-[state=open]:animate-menu-in data-[state=closed]:animate-menu-out",
);

// ── The header's seats ────────────────────────────────────────────────────
// The quiet icon-only action, in three sizes: 7 (a file row's acts), 8 (the
// list row-actions standard), 9 (drawer chrome). Brand hover for ordinary
// acts, ink for neutral chrome, danger for destructive ones.
export type IconBtnSize = 7 | 8 | 9;
export type IconBtnTone = "default" | "ink" | "danger";

export function iconBtnClass(size: IconBtnSize = 7, tone: IconBtnTone = "default"): string {
  return cn(
    "grid place-items-center disabled:opacity-40 [&_svg]:shrink-0 [&_svg]:[stroke-width:2]",
    PRESS,
    // The button sizes its glyph: 14 / 15 / 17 for the three seats.
    size === 7
      ? "size-7 rounded-md [&_svg]:size-3.5"
      : size === 8
        ? "size-8 rounded-lg [&_svg]:size-[15px]"
        : "size-9 rounded-lg [&_svg]:size-[17px]",
    tone === "ink" ? "text-ink/55" : "text-ink/40",
    tone === "danger"
      ? "hover:bg-danger-soft hover:text-danger"
      : tone === "ink"
        ? "hover:bg-ink/[0.06] hover:text-ink"
        : "hover:bg-brand-soft hover:text-brand-deep",
  );
}

// The 36px header seat — the one button language of every header strip (list
// controls, a record's ⋯, the drawer's close). It wears the field box so a
// row of seats and inputs reads as one strip; `seat` is what a cluster fuses on.
export const CTRL_BTN = cn(
  fieldBox("md"),
  "seat relative flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 px-0 py-0 text-[13px] font-medium text-ink/60 hover:relative hover:z-[1] hover:border-ink/30 hover:text-ink [&_svg]:size-[17px] [&_svg]:shrink-0 [&_svg]:[stroke-width:2]",
  PRESS,
);
// Icon-only seats keep their word for screen readers and the tooltip.
export const CTRL_LABEL = "sr-only";
// A header menu: dropped under its seat, in the popover's dress.
export const MENU_PANEL = cn(
  PANEL_SHELL,
  "absolute end-0 z-40 mt-2 w-56 origin-top-right p-1.5 shadow-kit-menu animate-menu-in rtl:origin-top-left",
);
export const MENU_ITEM =
  "flex w-full items-center justify-between gap-2 rounded-control px-2.5 py-2 text-start text-[13px] transition-colors hover:bg-ink/[0.04]";
// Layout only — the type comes from <Eyebrow size="sm">, which wears it.
export const MENU_LABEL = "px-2.5 pb-1 pt-1.5";

// The header ⋯ that unfolds to the start into a fused control (HeaderFold):
// the revealed action's base.
export const FOLD_ACTION = cn(CTRL_BTN, "w-auto whitespace-nowrap rounded-e-none px-3.5");

// ── Chips and seats in content ────────────────────────────────────────────
// The raw chip grammar — for the rare non-span chip (a clickable stage
// button, a titled pill) that can't render <Chip> itself.
export const CHIP =
  "inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-ink/[0.03] py-0.5 pe-2.5 ps-2 text-[12px] font-medium text-ink/75";

// A glyph seat in a SeatStrip: 30px inside the strip's hairline, the same
// height as a word seat. The seat sizes its glyph.
export function glyphSeat(tone: "default" | "danger" = "default"): string {
  return cn(
    "grid h-[30px] w-8 shrink-0 place-items-center text-ink/55 transition-colors [&_svg]:size-[15px] [&_svg]:shrink-0 [&_svg]:[stroke-width:2]",
    "disabled:opacity-40 data-[state=open]:bg-ink/[0.05] data-[state=open]:text-ink",
    tone === "danger" ? "hover:bg-danger/[0.06] hover:text-danger" : "hover:bg-ink/[0.04] hover:text-ink",
  );
}

// A word seat: a pill's words on the strip's body — same height, same type.
export function wordSeat(): string {
  return cn(
    "inline-flex h-[30px] shrink-0 items-center gap-1.5 px-3 text-[12px] font-medium text-ink/70 transition-colors",
    "hover:bg-ink/[0.04] hover:text-ink disabled:opacity-60 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:[stroke-width:2]",
  );
}

// ── The fused pill bar ────────────────────────────────────────────────────
// One segment of a merged pill bar. The input is the `peer`; this is the face
// it paints. The chosen one is lit in the brand's soft wash, never filled.
const PILL_FACE = cn(
  "inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap border border-ink/15 bg-surface px-1.5 text-[12px] font-medium text-ink/70 transition-colors",
  "hover:relative hover:z-[1] hover:border-ink/30 hover:text-ink",
  "peer-focus-visible:relative peer-focus-visible:z-[2] peer-focus-visible:ring-2 peer-focus-visible:ring-brand-deep/40",
  "peer-checked:relative peer-checked:z-[1] peer-checked:border-brand-deep peer-checked:bg-brand-soft peer-checked:text-brand-deep",
  "peer-checked:[&_svg]:text-brand-deep",
);

/** `fused` off = a standalone rounded pill, for a grid of many answers. */
export function pillClass(first: boolean, last: boolean, fused = true): string {
  if (!fused) return cn(PILL_FACE, "rounded-control");
  return cn(
    PILL_FACE,
    // Compact screens break the bar into a wrapped grid of standalone pills
    // (fusing across wrapped rows reads as broken borders); the fused
    // single-line bar returns at sm.
    "rounded-control sm:rounded-none",
    first ? "sm:rounded-s-control" : "sm:-ms-px",
    last && "sm:rounded-e-control",
  );
}

// ── Fused fields ──────────────────────────────────────────────────────────
// Two or more field boxes fused into one control (JoinedRow). Below sm the
// pair stays one control, stacked: the seam turns horizontal instead of the
// fields shrinking into slivers.
export function joinedEdge(index: number, count: number): string {
  const first = index === 0;
  const last = index === count - 1;
  return cn(
    // Stacked (below sm): vertical fusion — square the corners facing a seam.
    !first && "-mt-px rounded-ss-none rounded-se-none",
    !last && "rounded-es-none rounded-ee-none",
    // Side by side (sm+): horizontal fusion — restore the block corners,
    // square the inline seams.
    "sm:mt-0",
    !first ? "sm:-ms-px sm:rounded-ss-none sm:rounded-es-none" : "sm:rounded-ss-control sm:rounded-es-control",
    !last ? "sm:rounded-se-none sm:rounded-ee-none" : "sm:rounded-se-control sm:rounded-ee-control",
    "focus-within:relative focus-within:z-[1]",
  );
}

// ── The glyph square ──────────────────────────────────────────────────────
// Every icon in a tinted tile is an IconTile on a three-step scale, and the
// TILE sizes the glyph, so two tiles of one size never carry two icon sizes.
//   sm  28 px · 15 px glyph — bands, told lines, row marks
//   md  32 px · 16 px glyph — section heads, stat cells
//   lg  36 px · 17 px glyph — the drawer's room mark
export type TileSize = "sm" | "md" | "lg";
export type TileTone =
  | "quiet" // ink wash — a neutral mark
  | "brand" // brand wash — meaning, the house accent
  | "ok" // ok wash — a good state
  | "solid" // solid brand — the one surface the public sees
  | "ink" // the rail's ink, dark in both lights — the ordinal, the room
  | "warn" // waiting on someone
  | "danger" // needs attention
  | "onRail"; // a tile sitting on the rail

const TILE_SIZE: Record<TileSize, string> = {
  sm: "size-7 rounded-lg [&_svg]:size-[15px]",
  md: "size-8 rounded-lg [&_svg]:size-4",
  lg: "size-9 rounded-xl [&_svg]:size-[17px]",
};

const TILE_TONE: Record<TileTone, string> = {
  quiet: "bg-ink/[0.05] text-ink/60",
  brand: "bg-brand-soft text-brand-deep",
  ok: "bg-ok-soft text-ok",
  solid: "bg-brand text-brand-ink shadow-kit-lift",
  ink: "bg-rail text-on-rail",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  onRail: "bg-on-rail/[0.08] text-rail-accent",
};

export function tileClass(size: TileSize = "sm", tone: TileTone = "quiet"): string {
  return cn(
    "grid shrink-0 place-items-center [&_svg]:shrink-0 [&_svg]:[stroke-width:2]",
    TILE_SIZE[size],
    TILE_TONE[tone],
  );
}

// ── Inline record fields ──────────────────────────────────────────────────
// The SAME box in view and in edit, so switching modes changes only the
// border and background — never the size or position. For a form that is
// always editable to style raw inputs identically to the drawers.
export function inlineFieldClass(editing: boolean): string {
  return cn(
    fieldBox("sm"),
    "placeholder:text-ink/35",
    editing
      ? "border border-ink/15 bg-surface text-ink focus:border-brand-deep focus:ring-1 focus:ring-brand-deep/30"
      : "border border-transparent bg-ink/[0.03] text-ink/85 focus:border-transparent focus:ring-0",
  );
}

// ── Overlays ──────────────────────────────────────────────────────────────
// The one dimmed backdrop every overlay speaks; consumers add their own
// stacking. It is the rail's ink, which stays dark in both lights.
export const BACKDROP = "fixed inset-0 bg-rail/40 backdrop-blur-sm";
// A transparent click-catcher for a hand-built dropdown.
export const CLICK_CATCHER = "fixed inset-0 z-30 cursor-default";
// z-[70]: confirm dialogs sit above every drawer, the elevated one (z-60)
// included, or a delete confirm opened inside it renders behind it.
export const DIALOG_OVERLAY = cn(
  "kit",
  BACKDROP,
  "z-[70] data-[state=open]:animate-scrim-in data-[state=closed]:animate-scrim-out",
);
// The frame alone — the confirm gate pads its own bands so its fused foot
// reaches the true edge. A dialog stays centred and settles from 0.96.
export const DIALOG_FRAME =
  "kit fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface shadow-kit-menu focus:outline-none data-[state=open]:animate-dialog-in data-[state=closed]:animate-menu-out";
export const DIALOG_CONTENT = cn(DIALOG_FRAME, "p-5");
