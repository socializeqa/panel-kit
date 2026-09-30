# Changelog

## 0.1.3 — 30 Sep 2026

From moving X Capital, whose panel should keep its own look:

- `PanelProvider` takes `logoAlign: "start" | "center"` for the mark's seat on the rail (X Capital's stacked wordmark sits centred), and `barLogo` for the light top bar, where a white rail mark would vanish. Without `barLogo` the bar wears `logo`.
- `DoorPage` takes `headingFont`, a display face for the sign-in heading only (X Capital's Marcellus). Past the door the panel reads in its own face.
- The "Discard changes?" question's way back says "Keep editing"; "Cancel" was the word that had opened it. `ConfirmDialog` takes `cancelLabel`.

## 0.1.2 — 30 Sep 2026

- **Cancel asks before it throws away edits.** A record form's Cancel used to empty the form first, so it was the one way out that lost unsaved work without a word (found moving X Capital). It now asks "Discard changes?" first, like Esc, the scrim and the X, in a drawer and on a page. Keep returns to the edits untouched; Discard empties them. With nothing unsaved it asks nothing.
- The drawer's actions gain `askThen(action)`: run `action`, asking first when there are unsaved edits. Use it for any way out the person chooses.
- The "Discard changes?" question says "Before you leave" with an undo mark, not the delete wording and bin. `ConfirmDialog` takes an optional `kicker`.
- The fixture's drawer holds a record form, so Save, Cancel and the question can be clicked for real.

## 0.1.1 — 30 Sep 2026

The kit stays inside the panel. Found moving X Capital, whose website shares the app:

- Shadows are `shadow-kit-panel`, `-menu`, `-tile`, `-lift` and `-focus` (raw values `--kit-shadow-*`), so an app's own `shadow-lift` is its own. **Rename** `shadow-panel|menu|tile|lift|focus` to `shadow-kit-*` in any room that used them.
- The strong ease-out is set on `.kit` only; the website keeps Tailwind's own `ease-out`.
- The dark values switch on `.kit.dark, .dark .kit` only, so a website's own dark theme no longer turns the kit's tokens. An app that sets its own dark tokens uses the same selector.
- On a phone the room tile steps aside so the page title reads whole.

## 0.1.0 — 29 Sep 2026

The first kit, built from the copies the panels had drifted into.

- **80 modules** of shell, lists, records, fields, feedback and figures, taken
  from Señorritas' copy of the Elite Touch kit with Elite Touch's later shared
  changes (`POPOVER_SHELL`), X Capital's settings-driven + button, door page and
  password field, Ecole's drawer `context` slot, and Socialize's brand maths
  (`brandVars`) and light switch. Where each came from: [SEED.md](SEED.md).
- **`PanelProvider`**: the rooms, lists, permissions, host, logo, translator,
  countries and flags come in from the app; the kit imports nothing of an app's.
- **`kit.css`**: semantic tokens on `:root` and `.dark` behind Tailwind 4's
  `@theme inline`, the curves and the moves, a reduced-motion rule scoped to
  `.kit`, the panel face with its Arabic face under `dir="rtl"`.
- **The house rules built in**: the brand as an accent only, no monospace, no
  all-caps, motion under 300ms on transform and opacity. Elite Touch's five
  motion breaks are fixed: the drawer closes on its own curve (it closed on an
  ease-in), the rail's groups fade instead of easing their height, the writing
  grip moves no longer on `transition-all`, the locked bar's nudge runs 260ms
  (350), and menus leave on an ease-out.
- **`panel-kit-check`**: Elite Touch's style guard, Señorritas' additions and
  Socialize's unity audit in one checker, set up per app by
  `panel-kit.config.mjs`, with a baseline whose counts may only fall.
- **Tests**: the date, time, stepper and Others fields; the brand maths and
  kit.css's contrast; the package's exports and shape; every checker rule.
- **`fixture/`**: a Next 16 app that must build on the kit, and a check that
  its CSS carries the kit's own classes.
