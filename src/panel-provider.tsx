"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Country } from "@socialize/team-kit/phone";
import type { ListConfig } from "./list-config";
import type { NavGroup } from "./nav";

// ════════════════════════════════════════════════════════════════════════
// Everything the kit used to be hard-wired to, handed in by the app.
//
// In Elite Touch the shell imported its rooms from lib/admin/nav, the header
// its lists from lib/admin/list-config, the + its permissions, the drawer the
// job line, the phone field its countries. Each app that copied the kit then
// rewrote those imports, and the copies drifted (X Capital 37 of 58 files
// identical, Ecole 7 of 64). Here the kit imports nothing of an app's: the
// app mounts one PanelProvider and the kit reads it.
//
// The config holds components and functions (the rooms' icons, `can`, `t`),
// which can't cross from a server component, so an app builds it in a
// "use client" module of its own — see README, "Adopting the kit".
// ════════════════════════════════════════════════════════════════════════

export type Vars = Record<string, string | number>;
/** English in, the person's language out. Blanks read `{name}`. */
export type Translate = (text: string, vars?: Vars) => string;

/** A status word's colour: the dot on a StatusBadge. */
export type StatusTone = "ok" | "warn" | "danger" | "info" | "quiet";

/** The + in the top bar for one list (X Capital's settings-driven button). */
export interface CreateEntry {
  /** What the + says, in the tooltip and to a screen reader. */
  label: string;
  /** Where it leads. Without one, the + opens `?r=new` on the list itself
   *  (a room that opens its drawers on the list, as Señorritas' do). */
  href?: string;
  /** The capability a person needs to see the + at all. */
  cap?: string;
  /** Held back for now — a booking needs a branch chosen first. */
  hidden?: boolean;
}

/** Where the panel lives on its host. */
export interface PanelHost {
  /** The panel's first page: the logo leads here and the Back door hides here. */
  home?: string;
  /** Where panel pages start — "/admin" beside a website, "/" on a host of its own. */
  base?: string;
  /** Pages under `base` that are doors in, not rooms ("/login"). */
  doors?: string[];
  /** An older prefix that still arrives in links and folds away: Elite Touch's
   *  panel moved from "/admin/quotes" to its own host's "/quotes". */
  fold?: string;
}

export interface PanelConfig {
  /** The rooms, grouped the way the rail draws them. */
  nav?: NavGroup[];
  host?: PanelHost;
  /** What each list filters and sorts by, keyed by the list's own path. */
  lists?: Record<string, ListConfig>;
  /** The top bar's +, keyed by the list's own path. */
  create?: Record<string, CreateEntry>;
  /** May the signed-in person do this? Every capability the kit asks about
   *  comes through here. Everyone may do everything by default. */
  can?: (capability: string) => boolean;
  /** The translator. Plain English by default; Ecole's Arabic plugs in here. */
  t?: Translate;
  /** The panel's mark at the top of the rail. */
  logo?: ReactNode;
  /** Where the mark sits on the rail: the start (the default) or the
   *  centre, for a stacked wordmark like X Capital's. */
  logoAlign?: "start" | "center";
  /** The mark on the light top bar (a phone, a page with no title). The
   *  rail is dark and the bar is light, so a white rail mark would vanish
   *  there; without it the bar wears `logo`. */
  barLogo?: ReactNode;
  /** Something under the logo — a branch switch. */
  railTop?: ReactNode;
  /** Who is signed in, for the rail's foot. */
  user?: { name: string | null; role?: string };
  /** Sign out, from the rail's foot. */
  signOut?: () => void | Promise<void>;
  /** Seats after the list tools in the top bar: a global search, the bell. */
  tools?: ReactNode;
  /** The line at the very foot of the rail. `null` hides it. */
  credit?: ReactNode;
  /** The phone picker's countries, and how a flag is drawn beside one. */
  countries?: readonly Country[];
  defaultCountry?: string;
  flag?: (iso: string) => ReactNode;
  /** Dark mode, opted into: the lights switch appears on the rail's foot and
   *  the app puts `.dark` on <html>. Without it the panel stays light. */
  lights?: { dark: boolean; onChange: (dark: boolean) => void };
  /** How a list pages. "server" re-renders the page when the calibrator
   *  measures a new screenful (Elite Touch); "browser" tells the list through
   *  useAdaptiveRows instead (Señorritas). */
  paging?: "server" | "browser";
  /** The zone "today" is read in. Every team panel works in Doha. */
  timeZone?: string;
  /** A room's own status words and the tone each wears. */
  statuses?: Record<string, StatusTone>;
}

/** Fill `{name}` blanks with their values — the translator a panel with no
 *  second language uses, so a kit sentence with a number still reads. */
export function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (blank, key: string) =>
    key in vars ? String(vars[key]) : blank,
  );
}

export interface ResolvedPanel {
  nav: NavGroup[];
  host: Required<Omit<PanelHost, "fold">> & { fold?: string };
  lists: Record<string, ListConfig>;
  create: Record<string, CreateEntry>;
  can: (capability: string) => boolean;
  t: Translate;
  logo: ReactNode;
  logoAlign: "start" | "center";
  barLogo: ReactNode;
  railTop: ReactNode;
  user?: { name: string | null; role?: string };
  signOut?: () => void | Promise<void>;
  tools: ReactNode;
  credit: ReactNode | undefined;
  countries?: readonly Country[];
  defaultCountry?: string;
  flag?: (iso: string) => ReactNode;
  lights?: { dark: boolean; onChange: (dark: boolean) => void };
  paging: "server" | "browser";
  timeZone: string;
  statuses: Record<string, StatusTone>;
}

const DEFAULT_HOST = { home: "/", base: "/", doors: ["/login"] };
const EVERYONE = () => true;

function resolve(config: PanelConfig): ResolvedPanel {
  return {
    nav: config.nav ?? [],
    host: { ...DEFAULT_HOST, ...config.host },
    lists: config.lists ?? {},
    create: config.create ?? {},
    can: config.can ?? EVERYONE,
    t: config.t ?? fill,
    logo: config.logo ?? null,
    logoAlign: config.logoAlign ?? "start",
    barLogo: config.barLogo ?? config.logo ?? null,
    railTop: config.railTop ?? null,
    user: config.user,
    signOut: config.signOut,
    tools: config.tools ?? null,
    credit: config.credit,
    countries: config.countries,
    defaultCountry: config.defaultCountry,
    flag: config.flag,
    lights: config.lights,
    paging: config.paging ?? "server",
    timeZone: config.timeZone ?? "Asia/Qatar",
    statuses: config.statuses ?? {},
  };
}

// Outside a provider every piece still works on the defaults — a door page,
// a test, a kit piece rendered on its own.
const PanelContext = createContext<ResolvedPanel>(resolve({}));

export function PanelProvider({ children, ...config }: PanelConfig & { children: ReactNode }) {
  // The app's wrapper usually rebuilds the config object on every render;
  // reading it field by field keeps the context steady unless one changed.
  const {
    nav, host, lists, create, can, t, logo, logoAlign, barLogo, railTop, user, signOut, tools, credit,
    countries, defaultCountry, flag, lights, paging, timeZone, statuses,
  } = config;
  const value = useMemo(
    () =>
      resolve({
        nav, host, lists, create, can, t, logo, logoAlign, barLogo, railTop, user, signOut, tools, credit,
        countries, defaultCountry, flag, lights, paging, timeZone, statuses,
      }),
    [
      nav, host, lists, create, can, t, logo, logoAlign, barLogo, railTop, user, signOut, tools, credit,
      countries, defaultCountry, flag, lights, paging, timeZone, statuses,
    ],
  );
  return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>;
}

export function usePanel(): ResolvedPanel {
  return useContext(PanelContext);
}

/** The translator, for a browser component's words and attributes. */
export function usePanelT(): Translate {
  return useContext(PanelContext).t;
}

/**
 * A translated text: <Tx>Save changes</Tx>, or <Tx text="{n} filters on"
 * vars={{ n }} />. A server component can't read context, but it can render
 * this, which does — it is how the kit's server-safe pieces speak Arabic.
 */
export function Tx({ children, text, vars }: { children?: string; text?: string; vars?: Vars }) {
  const t = usePanelT();
  return <>{t(text ?? children ?? "", vars)}</>;
}
