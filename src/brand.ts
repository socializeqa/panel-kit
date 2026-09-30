import type { CSSProperties } from "react";

/**
 * A panel's own colour, made safe. Any brand colour a client gives us must
 * arrive with a readable ink for words set on it, a deep variant that reads
 * as words on a light page, and a bright one that reads on the dark. All pure
 * maths, so a panel never ships an unreadable button.
 *
 * Socialize's lib/accent.ts (brandStyle), which has kept the client portals
 * readable since September 2026, renamed for the kit: brandVars(hex) returns
 * the variables an app stamps on <html class="kit">, and kit.css reads them.
 */

/** Socialize's lime — what a panel wears until it stamps its own colour. */
export const HOUSE_BRAND = "#D1FE17";
const HOUSE_INK = "#0A0A0A";
const HOUSE_DEEP = "#61760b";

type Rgb = { r: number; g: number; b: number };

export function parseHex(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1] as string, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function toHex({ r, g, b }: Rgb): string {
  const channel = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
function luminance({ r, g, b }: Rgb): number {
  const linear = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const INK: Rgb = { r: 10, g: 10, b: 10 };
const READABLE = 4.5;

/** Scale a colour toward black (factor < 1) or white (factor > 1). */
function scaled(rgb: Rgb, factor: number): Rgb {
  if (factor <= 1) {
    return { r: rgb.r * factor, g: rgb.g * factor, b: rgb.b * factor };
  }
  const toward = (v: number) => v + (255 - v) * (factor - 1);
  return { r: toward(rgb.r), g: toward(rgb.g), b: toward(rgb.b) };
}

/** The words a filled brand surface carries: house ink or white, whichever reads. */
export function brandInk(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return HOUSE_INK;
  return contrast(rgb, INK) >= contrast(rgb, WHITE) ? HOUSE_INK : "#ffffff";
}

/**
 * The brand as words on a light page: darkened step by step until it reads
 * against white. Lime comes out #61760b, the olive every panel's words wear.
 */
export function brandDeep(hex: string): string {
  let rgb = parseHex(hex);
  if (!rgb) return HOUSE_DEEP;
  for (let step = 0; step < 24 && contrast(rgb, WHITE) < READABLE; step++) {
    rgb = scaled(rgb, 0.88);
  }
  return toHex(rgb);
}

/**
 * The brand on the dark, as words and as a fill: lightened until it reads. A
 * colour with no hue (black, charcoal, grey) is a black-and-white brand, and
 * it answers in white on dark the way its logo does; lightening black step by
 * step would stop at a mid grey nobody chose.
 */
export function brandBright(hex: string): string {
  let rgb = parseHex(hex);
  if (!rgb) return HOUSE_BRAND;
  if (Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b) <= 8) return "#ffffff";
  for (let step = 0; step < 24 && contrast(rgb, INK) < READABLE; step++) {
    rgb = scaled(rgb, 1.12);
  }
  return toHex(rgb);
}

/**
 * The inline variables a panel stamps on its root: <html className="kit"
 * style={brandVars(client.color)}>. No colour on file (or garbage) returns
 * undefined, so the house defaults in kit.css stay in charge. kit.css swaps
 * in the bright pair under .dark.
 */
export function brandVars(hex: string | null | undefined): CSSProperties | undefined {
  if (!hex || !parseHex(hex)) return undefined;
  const bright = brandBright(hex);
  return {
    "--brand": hex,
    "--brand-ink": brandInk(hex),
    "--brand-deep": brandDeep(hex),
    "--brand-bright": bright,
    "--brand-bright-ink": brandInk(bright),
  } as CSSProperties;
}
