# Changelog

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
