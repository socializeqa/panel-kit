# @socialize/panel-kit

The admin panel every Socialize Team app is built on: the shell (the rail and
the top bar), the drawers, the lists, the fields, the dialogs and the toast,
the house rules for how they look and move, and a checker that keeps a panel
on them.

It began as Elite Touch's panel. Señorritas, X Capital and Ecole each copied
it, and each copy drifted (X Capital kept 37 of 58 files identical, Ecole 7 of
64). This is the one copy they move back onto. Where each piece came from is in
[SEED.md](SEED.md).

**Panels share how they work, not their colours or fonts.** The kit brings the
shapes, the behaviour, the motion and the words. Each app brings its own brand
colour, its own palette and its own face, and nothing in the kit types a colour.

It ships as TypeScript source. There is no build step: the app's Next compiles
it with the app.

## The house rules, built in

- **The brand is an accent, never a surface.** A full brand fill appears only in
  the kit's own buttons, the switch, the solid icon tile, the + seat and a
  picked day. Everywhere else the brand is a soft wash, a hairline or words.
- **No monospace.** `font-mono` points at the panel's own face; figures line up
  with `tabular-nums`.
- **No all-caps.** Labels are sentence case, everywhere.
- **Motion, to Emil Kowalski's standard** (the team's bar since September 2026):
  under 300ms; never `ease-in`, never `transition-all`; only transform and
  opacity move; a colour may fade on hover in 150ms or less. Nothing grows from
  `scale(0)` — a menu starts at 0.98, a dialog at 0.96, with a fade. Anything
  you press sinks to 0.97. Hover motion waits for a mouse (the `fine:` variant).
  A person who asked for less motion gets the fades and none of the travel.
- **No sparkle, wand or robot** for anything AI. An AI feature wears its room's
  icon.
- **Every word colour reads 4.5:1** on the page and on a card, in both lights
  (a test holds kit.css to it).
- **Arabic works.** Every word the kit draws goes through the app's translator,
  logical properties put things on the right side, and `--kit-dir` turns a
  sideways move round.

## Adopting it

### 1. Install

```bash
pnpm add github:socializeqa/panel-kit#v0.1.0
# Elite Touch (npm): npm install github:socializeqa/panel-kit#v0.1.0
```

The kit's peers are the app's own: `next` 16.2+, `react` 19.2+, `lucide-react`,
`@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-select`,
`react-day-picker` 10, `clsx`, `tailwind-merge` 3, Tailwind 4.1.5 or later, and
`@socialize/team-kit`. Team-kit has to be the app's own direct dependency: pnpm
11 refuses a git dependency of a dependency (`blockExoticSubdeps`), so the kit
takes it as a peer. Every team app already has it.

### 2. next.config

```ts
const nextConfig: NextConfig = {
  transpilePackages: ["@socialize/panel-kit"],
};
```

### 3. globals.css

```css
@import "tailwindcss";
@import "@socialize/panel-kit/kit.css";
@source "../node_modules/@socialize/panel-kit/src";
```

The `@source` path is relative to the stylesheet. **Without it nothing fails**:
the build passes and every kit class is simply missing. The checker looks for
the line, and the kit's own CI reads a built stylesheet to prove it works.

Then the app's palette, after the import. Set any token you want to change on
`:root`, and again on `.dark` if the app has opted into dark mode (a token set
only on `:root` wins in the dark too):

```css
:root {
  --ink: #2a0810;          /* words and lines */
  --quiet: #6b5a5e;        /* secondary words */
  --ground: #faf8f5;       /* the page */
  --surface: #ffffff;      /* cards and fields */
  --surface-2: #f3eee7;    /* a quieter card */
  --rail: #2a0810;         /* the rail, dark in both lights */
  --on-rail: #faf8f5;
  --rail-accent: #ffd13f;  /* the accent on the rail */
  --font-panel: var(--font-geist), ui-sans-serif, system-ui, sans-serif;
}
```

The whole set: `ink`, `quiet`, `ground`, `surface`, `surface-2`, `rail`,
`on-rail`, `rail-accent`, `brand`, `brand-ink`, `brand-deep`, `brand-bright`,
`brand-soft`, `ok`, `warn`, `danger`, `info` (each with `-soft`),
`--shadow-panel/-menu/-tile/-lift/-focus`, `--radius-panel/-control`,
`--font-panel`, `--font-panel-arabic`, and the curves `--ease-out`,
`--ease-drawer`, `--ease-brand`. Note that kit.css makes Tailwind's `ease-out`
the strong curve (0.23, 1, 0.32, 1) app-wide.

### 4. The brand, on `<html>`

```tsx
import { brandVars } from "@socialize/panel-kit/brand";

<html lang="en" className="kit" style={brandVars("#80001E")}>
```

`brandVars(hex)` returns the brand, the ink that reads on it, a deep variant
that reads as words on a light page, and a bright one for the dark — all
worked out so nothing ships unreadable. No colour (or a bad one) returns
`undefined` and the house lime stays.

`kit` on `<html>` suits an app that is only a panel. An app with a website
beside its panel (Señorritas) leaves it off: the Shell, every kit popup and
`DoorPage` carry the class themselves, so nothing of the kit touches the site.

### 5. Fonts

Load the face with `next/font` and hand its variable to `--font-panel` (above).
A panel that speaks Arabic sets `--font-panel-arabic` too; it takes over under
`dir="rtl"`.

### 6. PanelProvider

Everything the kit used to import from an app — the rooms, the lists, the
permissions, the host, the logo, the translator — it now reads from one
provider. The rooms carry their icons and `can` is a function, and neither can
cross from a server component, so the app writes one client module:

```tsx
// app/admin/panel.tsx
"use client";

import { CalendarCheck, LayoutDashboard } from "lucide-react";
import { PanelProvider } from "@socialize/panel-kit/panel-provider";
import { Shell } from "@socialize/panel-kit/shell";
import { ToastProvider } from "@socialize/panel-kit/toast";
import { can } from "@/lib/admin/permissions";
import { LISTS } from "@/lib/admin/list-config";

const NAV = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", Icon: LayoutDashboard }] },
  { label: "Operations", items: [{ href: "/admin/bookings", label: "Bookings", Icon: CalendarCheck, cap: "view_bookings" }] },
];

export function Panel({ role, caps, name, children }) {
  return (
    <PanelProvider
      nav={NAV}
      host={{ home: "/admin", base: "/admin", doors: ["/login", "/reset-password"] }}
      lists={LISTS}                                   // { "/admin/bookings": ListConfig }
      create={{ "/admin/bookings": { label: "New booking", cap: "add_bookings" } }}
      can={(cap) => can(role, caps, cap)}
      logo={<Logo />}
      user={{ name, role: "Manager" }}
      signOut={signOut}
      tools={<><GlobalSearch /><NotificationBell /><CollapseButton /></>}
    >
      <ToastProvider>
        <Shell>{children}</Shell>
      </ToastProvider>
    </PanelProvider>
  );
}
```

What the provider takes: `nav`, `host` (`home`, `base`, `doors`, and `fold`
for a panel that moved from "/admin/…" to a host of its own), `lists`,
`create`, `can`, `t`, `logo`, `railTop` (a branch switch), `user`, `signOut`,
`tools`, `credit`, `countries`, `defaultCountry`, `flag`, `lights`, `paging`
(`"server"` re-renders a list when the screen's rows are measured,
`"browser"` hands them to `useAdaptiveRows`), `timeZone` (Doha by default) and
`statuses` (a room's own status words and their tones). Hoist the objects to
module scope where you can, so the context stays steady.

### 7. Dark mode, opt-in

A panel is light until the app says otherwise. To opt in, give the provider
`lights` and put `.dark` on `<html>` — next-themes does both:

```tsx
const { resolvedTheme, setTheme } = useTheme();
<PanelProvider lights={{ dark: resolvedTheme === "dark", onChange: (d) => setTheme(d ? "dark" : "light") }} …>
```

The switch then sits at the rail's foot. Rooms never write `dark:` — the tokens
flip on their own, and the checker says so.

### 8. Arabic

Pass the translator as `t` (English is the key; `{name}` blanks are filled from
the values). Every word the kit draws goes through it; the server-safe pieces
speak through `<Tx>` and `tx()`. Put `dir="rtl"` on `<html>`.

### 9. Importing

Every module has its own name, and there is no index — one would mix server and
browser modules:

```ts
import { Drawer } from "@socialize/panel-kit/drawer";
import { fieldBox, iconBtnClass } from "@socialize/panel-kit/classes";
```

Class strings (`fieldBox`, `buttonClass`, `PANEL_SHELL`, `POPOVER_SHELL`,
`CTRL_BTN`, `iconBtnClass`…) come from `/classes` only, a module with no
`"use client"`. A constant exported from a client module reaches a server
component as a reference, and `cn()` drops it without a word.

### 10. The checker

```bash
pnpm exec panel-kit-check            # the report, worst files first
pnpm exec panel-kit-check --check    # exit 1 when a count rises above the baseline
pnpm exec panel-kit-check --baseline # take today's counts as the baseline
```

It reads `panel-kit.config.mjs` at the app's root:

```js
export default {
  scan: ["src/app/admin", "src/components/admin"],
  css: "src/app/globals.css",
  legacyKit: ["@/components/admin/"],      // the app's old copy, while it moves
  rules: { "date-format": true },          // the brain rules are off by default
  homes: { "raw-table": ["src/app/admin/reports/statement.tsx"] },
  exempt: [
    { match: "src/app/admin/print/", rules: ["typed-colour"], why: "a printed sheet stays light on paper" },
  ],
  custom: [
    { id: "upload-ticket", what: "raw createSignedUploadUrl — use lib/admin/upload-ticket", test: /createSignedUploadUrl\(/g },
  ],
};
```

Every exemption needs its reason or the checker refuses the config. A single
line that can't come from the kit says why on itself or just above:
`style-guard-ignore: <reason>`. The counts in `panel-kit.baseline.json` may only
fall. Add `--check` to the app's lint or CI.

The rules: `gradient-button`, `panel-shell`, `chip`, `icon-button`, `field-box`
(a hand-rolled copy of a kit shape), `caps`, `half-pixel`, `brand-slab`,
`font-mono`, `motion`, `dark-in-rooms`, `typed-colour`, `browser-dialog`,
`ai-icons`, `local-kit-import`, `table-fills-screen`, `raw-table`,
`native-date`, `native-check`, `hand-drawer`, `client-exports-class`,
`source-present`, and, off until an app turns them on, `date-format`,
`date-math`, `money-format`, `helper-copy`, `raw-write`.

### 11. The doors

A panel's pages outside the Shell (signing in, a forgotten password, a new
one) are a `DoorPage` with a form from `door-forms` inside. The forms are the
kit's; the server actions are the app's, and they read the same rules from
`staff-door`, so the form and the server never disagree:

```tsx
<DoorPage scene={DOOR_SCENE} title="Welcome back" lead="Sign in to the panel.">
  <SignInForm action={signIn} placeholder="you@xcapital.qa or 5512 3456" />
</DoorPage>
```

- **Sign in** takes an email or a mobile. `readLogin(form.get("login"))` says
  which; the app finds the login behind a mobile in its own staff table.
- **A mobile-only login** signs in by an address made from the number at the
  app's staff domain (`phoneLoginEmail`). Nothing is ever mailed there: a
  forgotten password for it goes through a manager.
- **A starting password** (one the office hands out) is changed at the first
  sign-in: the app keeps a must-change flag, and `passwordProblem` refuses the
  handed-out one. `PASSWORD_DOOR[door]` has the heading, line and button for
  each way in.
- **Forgot password** answers the same whether the login exists or not.

Give `user.href` to the provider and the name at the rail's foot opens the
person's own account (X Capital: their password).

## What's in it

| | |
|---|---|
| **Shell** | `shell`, `panel-provider`, `nav`, `page-header-context` (PageMeta), `back-door`, `nav-memory`, `collapse-button`, `new-record-button`, `header-control`, `header-fold`, `lights-toggle`, `use-panel-pathname`, `number-wheel-guard`, `rows-calibrator`, `refresh-if-stale`, `door-page`, `door-forms`, `grain` |
| **Lists** | `data-table`, `stage-tabs`, `list-config`, `list-controls` (search, filter, sort, the chips), `filter-drawer`, `list-options-context`, `page-size`, `page-size-server`, `link-row`, `row-actions`, `row-menu`, `decision-bar` |
| **Records** | `drawer`, `drawer-header`, `drawer-tabs`, `record`, `record-fields` (Section), `record-form`, `record-editing`, `record-route`, `stage-walk`, `unsaved-guard`, `delete-button`, `save-button`, `use-action-success`, `foot-log` |
| **Fields** | `fields`, `select-menu`, `other-select`, `choice-pills`, `segmented`, `switch`, `number-stepper`, `date-field`, `time-field`, `phone-field`, `password-input`, `note-box`, `grab-resize`, `caret-safe`, `joined-row`, `media-drop-zone`, `photo-field`, `star-rating` |
| **Feedback** | `modal` (ConfirmDialog, PromptDialog, PickDialog), `toast`, `hint`, `empty-state`, `panel-loader`, `load-error` |
| **Guide** | `help-guide` (HelpGuide, HelpPrintSeat): the panel's own "how to use", a section per room, each person seeing only what their role can do; `PanelProvider` `help` puts a "?" on every room's top bar |
| **Figures** | `stat-tile`, `stat-strip`, `figure`, `meter`, `status-badge`, `icon-tile`, `icon-btn`, `seat-strip` |
| **Helpers** | `classes`, `cn`, `brand`, `format`, `tx`, `action-result`, `use-dismiss`, `staff-door` |

## Working on the kit

```bash
pnpm install
pnpm run typecheck && pnpm run test && pnpm run check
cd fixture && pnpm run build && pnpm run css-proof
```

`fixture/` is a small Next app that installs the kit the way an app does and
must build; `css-proof` reads its built stylesheet for classes that exist only
in the kit's source. CI runs all of it.

**Never give the package a `build`, `prepare`, `prepack`, `postinstall` or
`install` script.** npm prepares any git dependency that has one by running a
full install of its dev tools inside the app's install; that kept Elite
Touch's CI red in September 2026. A test holds the line.

A release is a tag (`v0.1.0`) and a CHANGELOG entry; apps pin the tag.
