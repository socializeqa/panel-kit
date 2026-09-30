# Where the kit came from

Every file, its source, and what changed on purpose — so a later sync can tell
a choice from drift. Read with the owner's plan of 29 Sep 2026 (the panel-kit
plan): seed from Señorritas' copy, not raw Elite Touch.

**Sources, all read at their committed HEAD on 29 Sep 2026:**

| Short | Repo and folder | Commit |
|---|---|---|
| Sen | `Senorritas  Tex-Mex` · `src/components/kit/`, `src/lib/admin/`, `scripts/style-guard.mjs` | `619da72` — itself Elite Touch `9215b833` with its own README of changes |
| ET | `elitetouch.qa` · `components/admin/`, `lib/admin/`, `scripts/style-guard.mjs` | `87063b8e` — the kit files changed since `9215b833` (commits `435c16c7`, `d1bef9aa`) |
| XC | `X Capital/web` · `src/components/admin/` | `9f58f1c` |
| Ecole | `Ecole Sport Center/web` · `src/components/admin/` | `f3990eb` |
| HQ | `Socialize/web` · `src/lib/accent.ts`, `src/app/globals.css`, `src/app/admin/(dashboard)/lights-toggle.tsx`, `scripts/unity-audit.mjs` | `c1dd6fce` |

## Changed everywhere

These hold for every file below and are not repeated per row.

- **Tokens.** Señorritas' names became the plan's: `accent` → `brand`,
  `accent-deep` → `brand-deep`, `accent-light` → `brand-bright`, `gold` →
  `rail-accent`, `bone` → `ground`, `bg-white` → `surface`, `linen` →
  `surface-2`, `steel` → `quiet`, `ok-deep` → `ok`, the `red-*` family →
  `danger`, `amber-*` and `orange-*` → `warn`. `text-ink/45`–`/55` became
  `quiet`, which reads 4.5:1 (the ink at 55% did not). Text in the brand is
  always `brand-deep` (a lime brand is unreadable as words); a filled brand
  carries `brand-ink`. The rail and the room tiles read `rail` / `on-rail`, so
  they stay dark in both lights. Eleven named shadows became five (`panel`,
  `menu`, `tile`, `lift`, `focus`); `rounded-xl` on a card and `rounded-lg` on
  a field became `rounded-panel` and `rounded-control`.
- **`kit` for `kit-root`.** The class the Shell and every portal wear.
- **Words.** Every string the kit draws goes through the app's translator
  (`usePanelT()` in a browser component, `<Tx>` / `tx()` in a server-safe one) —
  Ecole's approach, with English as the key.
- **Imports.** Relative only; `@/lib/utils` (`cn`) → `./cn`; app imports
  (`@/lib/admin/nav`, `list-config`, `permissions`, `lib/site`, `useBranch`,
  the countries) became `PanelProvider` fields.
- **Class strings** moved to `classes.ts` (no `"use client"`); a client module
  never re-exports one. Elite Touch's lesson: a string exported from a client
  file reaches a server component as a reference and `cn()` drops it.
- **Motion.** Keyframes live in kit.css as `--animate-*` (`animate-menu-in`,
  `animate-drawer-in`…) so the reduced-motion rule can swap them; every exit
  eases out; colour fades are 150ms; hover motion sits behind `fine:`; every
  pressable sinks to 0.97. Arbitrary `animate-[menu-in_0.16s_…]` strings are gone.
- **RTL.** `--kit-dir` (1 or -1) turns sideways moves round: the drawer, the
  phone's rail, a switch's knob, the header fold, a row's edge.

## File map

| Kit file | From | Changed on purpose |
|---|---|---|
| `action-result.ts` | Sen `lib/admin/action-result.ts` | — |
| `back-door.tsx` | Sen | room name and home page from the provider (`host.home`) |
| `brand.ts` | HQ `lib/accent.ts` | `brandStyle` → `brandVars`, `accent*` → `brand*`; the garbage fallback for the deep tone is the readable olive `#61760b` (HQ fell back to `#84a005`, 3:1); `vibrantFromPixels` (reading a colour off a logo) stays HQ's own |
| `caret-safe.tsx` | Sen | the two copies of the caret logic share one hook |
| `choice-pills.tsx` | Sen | the pill face moved to `classes.ts`; a lit pill is the brand's soft wash |
| `classes.ts` | new | the shared class strings, from Sen `fields`, `icon-btn`, `record`, `status-badge`, `seat-strip`, `choice-pills`, `joined-row`, `icon-tile`, `record-fields`, `modal`, `header-control`, `header-fold`, and ET `record.tsx`'s `POPOVER_SHELL` (which reads both Radix origin variables) |
| `cn.ts` | Sen | tailwind-merge taught the kit's colours, shadows, radii, curves, fonts and animations (without the colours, `cn("bg-surface", "bg-brand")` kept both) |
| `collapse-button.tsx` | XC (ET's) | a record page is one segment under its room (from the provider's nav), not a hard-wired `/admin/<room>/<id>` |
| `data-table.tsx` | Sen | headers, string cells and the pager speak through `tx()`/`<Tx>` (Ecole); pinned columns use `start`/`end`; the row's edge follows `--kit-dir`; Actions light on focus as well as hover |
| `date-field.tsx` | Sen + ET `POPOVER_SHELL` | today in the provider's `timeZone`; month names and the footer translated; chevrons flip in RTL; a picked day's hover darkens toward black instead of to `brand-deep` |
| `decision-bar.tsx` | Sen | — |
| `delete-button.tsx` | Sen | — |
| `door-page.tsx` | XC | the logo is a prop; the heading is in the panel face; carries `kit` |
| `drawer-header.tsx` | Sen + Ecole | Ecole's `context` slot |
| `drawer-tabs.tsx` | XC (ET's) | publishes `context` too |
| `drawer.tsx` | Sen + Ecole | Ecole's `context` row under the title (replaces ET's hard-wired JobLine); a controlled drawer's content starts unlocked (`RecordEditingProvider initial`, Ecole); room from the provider |
| `empty-state.tsx` | Sen | — |
| `fields.tsx` | Sen | `fieldBox`/`buttonClass` moved to `classes.ts`; Button `tone` is `brand` \| `ink`; a filled button's hover darkens toward black; the press lists `scale` in its transition (Tailwind 4 scales through the `scale` property, which a `transform` transition misses) |
| `figure.tsx` | Sen | `positive` reads `ok` |
| `filter-drawer.tsx` | Sen | quick ranges counted from the provider's today; a sort may carry its own direction `words`; `order` reads "In order" / "Reversed" (Señorritas' "As guests see it" is its own words now) |
| `foot-log.tsx` | XC (ET's) | tones in `ok` / `danger` / `brand` |
| `format.ts` | Sen `lib/admin/format.ts` (part) | only what the kit reads: `todayIso(timeZone)` and `formatTime`; the room date formats stay each app's |
| `grab-resize.tsx` | Sen | the grip changes colour on hover and nothing else (ET: `transition-all` and a hover grow); the tip's slide sits behind `fine:`; the storage key is `panel-writing-h:` |
| `grain.tsx` | Sen | — |
| `header-control.tsx` | Sen | the class strings moved to `classes.ts`; the active dot sits at `end` |
| `header-fold.tsx` | Sen | the transition lists `translate` (it listed `transform`, which the `translate-x-*` utilities don't use in Tailwind 4, so the slide never ran) |
| `hint.tsx` | Sen | — |
| `icon-btn.tsx` | Sen | now a client module (it translates its label); `iconBtnClass` lives in `classes.ts` |
| `icon-tile.tsx` | Sen | tones `brand`, `warn`, `danger`, `onRail`; `ink` is the rail's colour |
| `joined-row.tsx` | Sen | `joinedEdge` moved to `classes.ts` |
| `lights-toggle.tsx` | HQ | controlled (`dark`, `onChange`) so the kit needs no theme library; 200ms on the drawer's ease-out (HQ: 300ms); seated by the Shell when the provider has `lights` |
| `link-row.tsx` | XC (ET's) | — |
| `list-config.ts` | Sen `lib/admin/list-config.ts` | the types and page helpers only — the lists are the app's; `resolveSort` takes the config; a sort may carry `cap` (ET's `financeOnly`) and `words` |
| `list-controls.tsx` | Sen | the list's config from the provider by path; sorts gated by `can`; "Descending" / "Ascending" |
| `list-options-context.tsx` | Sen | — |
| `load-error.tsx` | Sen | — |
| `media-drop-zone.tsx` | Sen | — |
| `meter.tsx` | Sen | tone keys `brand`, `ok`, `ink`, `warn`, `danger` |
| `modal.tsx` | Sen | the dialog settles from 0.96 and fades out (Sen only faded in); ConfirmDialog `tone` is `danger` \| `brand` |
| `nav-memory.tsx` | Sen | what counts as a panel page comes from `host` (`base`, `doors`) |
| `nav.ts` | Sen `lib/admin/nav.ts` | the types and `roomFor` / `isItemActive` over the provider's rooms; a room may carry `cap` and a live `count`; `foldPath` from ET's `panelPath` |
| `new-record-button.tsx` | XC | one entry per list from the provider (`create`), gated by `can`; without an href it opens `?r=new` on the list (Sen); `hidden` holds it back (Sen's "waits for a branch") |
| `note-box.tsx` | Sen | — |
| `number-stepper.tsx` | Sen | — |
| `number-wheel-guard.tsx` | Sen + `lib/admin/number-wheel-guard.ts` | the pure guard and the listener in one file |
| `other-select.tsx` | ET | — (Señorritas had left it out) |
| `page-header-context.tsx` | Sen | a `context` slot for the top bar's subline (ET drew its JobLine there) |
| `page-size.ts` | Sen `lib/admin/page-size.ts` | `rowsFromValue` for a cookie read on the server |
| `page-size-server.ts` | ET `lib/admin/page-size.ts` | `resolvePageFromCookie` — ET's server read, in a module of its own because `next/headers` is server-only |
| `panel-loader.tsx` | Sen | the tile is the rail's colour and the dot the rail's accent, so it reads in both lights |
| `panel-provider.tsx` | new | `PanelProvider`, `usePanel`, `usePanelT`, `<Tx>`, `fill` (Ecole's i18n shape) |
| `password-input.tsx` | XC | — |
| `phone-field.tsx` | Sen | numbers read and written by `@socialize/team-kit/phone` (Sen's own country list, masks and flag sheet stay the app's: `countries`, `flag`); the country list is the app's order, no "Common" split; the national part is kept as typed |
| `photo-field.tsx` | Sen | — |
| `record-editing.tsx` | Sen | — |
| `record-fields.tsx` | Sen | `inlineFieldClass` moved to `classes.ts`; the focus outline fades in 150ms |
| `record-form.tsx` | Sen | — |
| `record-route.tsx` | XC (ET's) | — |
| `record.tsx` | Sen | no `DrawerHeader` re-export (it made an import cycle); `PANEL_SHELL` moved to `classes.ts` |
| `refresh-if-stale.tsx` | ET | — |
| `row-actions.tsx` | XC (ET's) | — |
| `row-menu.tsx` | Sen + ET `POPOVER_SHELL` | — |
| `rows-calibrator.tsx` | Sen + ET | both ways of paging: `router.refresh()` (ET) or the rows event (Sen), by the provider's `paging` |
| `save-button.tsx` | XC (ET's) | — |
| `seat-strip.tsx` | Sen | `glyphSeat` / `wordSeat` moved to `classes.ts` |
| `segmented.tsx` | XC (ET's) | — |
| `select-menu.tsx` | Sen + ET `POPOVER_SHELL` | — |
| `shell.tsx` | Sen (ET's) | everything app-shaped from the provider: rooms (filtered by `cap`), logo, `railTop` (Sen's branch switch), user, sign-out, `tools` (ET's search, bell and close), `credit`, `lights`; the phone's rail slides in from the start; the rail's glow is the rail accent at 14% |
| `star-rating.tsx` | XC (ET's) | — |
| `stat-strip.tsx` | Sen | — |
| `stat-tile.tsx` | Sen | a linked tile lifts its shadow in 150ms (ET: `hover:shadow-md`) |
| `status-badge.tsx` | Sen | a client module now, reading the provider's `statuses`; a `tone` prop; the common words' tones built in; the stored word reads in sentence case in code (Sen's `capitalize` made Title Case) |
| `switch.tsx` | Sen | the knob wears `brand-ink` when on (a white knob vanished on a lime track) and travels by `--kit-dir` |
| `time-field.tsx` | Sen + ET `POPOVER_SHELL` | — |
| `toast.tsx` | Sen | enters on a transition from `@starting-style` (interruptible; Sen used a keyframe) and fades out before it leaves (Sen vanished) |
| `tx.tsx` | Ecole | — |
| `unsaved-guard.ts` | Sen | — (byte for byte) |
| `use-action-success.ts` | XC (ET's) | — |
| `use-dismiss.ts` | Sen | — |
| `use-panel-pathname.ts` | Sen + ET | folds `host.fold` (ET's `panelPath`) |
| `kit.css` | Sen `kit/theme.css` + HQ `globals.css` | HQ's variable-backed `@theme inline` and `.dark` brand rule; Sen's base rules under `.kit`; the reduced-motion rule scoped to `.kit` (Sen collapsed every animation; HQ kept fades) |
| `bin/panel-kit-check.mjs` | ET + Sen `style-guard.mjs`, HQ `unity-audit.mjs` | one checker: ET's set rules and escape, Sen's caps / colour / popup rules, HQ's per-file counts and baseline; new: `brand-slab`, `font-mono`, `motion`, `dark-in-rooms`, `local-kit-import`, `source-present`, `ai-icons`, `client-exports-class`; config per app |

## Left out, and why

- **Business pieces** — jobs, quotes, money lines, trades, places, signing,
  customer messaging, contacts and files (ET's `job-line`, `line-items`,
  `payment-schedule`, `places-panel`, `send-*`, `contact-*`, `files-panel`,
  `upload-ui`, `amount-lines`, `saved-place-field`…), and each app's own
  rooms.
- **Data-bound shell pieces** — ET's `global-search`, `notification-bell`
  (and its filters and items) and `live-refresh` read the app's own tables and
  actions. They sit in the Shell through `tools`; a later version can take
  their UI once two apps share the data shape.
- **Each app's own words and marks** — XC's `event-trail` (its glyph map is
  X Capital's; the log grammar is `foot-log`), `pdf-link` (papers), ET's
  `option-icons` (trades, and a `Bot` glyph the house bans), Señorritas'
  `brand-glyphs` (its integrations' logos).
- **`reorderable`** — Señorritas' drag list needs `framer-motion`, which is not
  among the kit's peers.
- **ET's create menu** (one + for several kinds of record) — no second app has
  needed it yet.
- **HQ's extras** (totals, grouped rows, settled mode) — ported when HQ moves,
  last, as the plan says.
