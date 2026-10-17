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

### 12. The hiring rooms

A panel's candidates and openings are kit pieces too. The kit knows no stage,
letter or score of its own: the app hands its hiring words in as one
`HiringWords` object (`hiring-words`), the stages in walk order with their
labels, short names, tones and step words, the letters and the letter each
stage opens, `letterNeeds` and `fitWord`. Every write is a callback that
returns an `ActionResult` (a server action fits), so the kit imports no
database and no action.

```tsx
// app/(panel)/hiring/candidate.tsx — the app's own client module, because the
// words carry functions and a server page can't hand those to the browser.
"use client";
import { CandidateFile } from "@socialize/panel-kit/candidate-file";
import { LetterComposer } from "@socialize/panel-kit/letter-composer";
import { WORDS, LETTER_FIELDS } from "@/lib/hiring-words";

<CandidateFile
  words={WORDS}
  candidate={c}
  facts={[{ label: "Nationality", value: <Flag … /> }]}
  papers={{ cv: `/hiring/${c.id}/cv` }}
  onMove={(to, why) => moveCandidate(c.id, to, why)}
  onRate={(n) => rateCandidate(c.id, n)}
  onAddNote={(body) => addNote(c.id, body)}
  letters={<LetterComposer words={WORDS} fields={LETTER_FIELDS} draftKey={`letter:${c.id}`} … />}
  …
/>
```

- `StageChip`, `FitChip`, `OpeningChip`: the chips, server-safe.
- `StageMover`: the walk and the way on (next step, back, skip a trial, hire,
  let go, reopen); a hire, a let-go and a reopen ask first.
- `CandidateFile`: one calm column (where they stand, the facts with the
  doors to reach them, the reader's score, their answers, the office's read),
  then the letters and the story as rooms of their own.
- `LetterComposer` and `SentLetters`: write a letter, preview it, send it
  behind a question; the draft is kept in the tab and never dirties the drawer.
  `standardLetterFields({ office })` gives the six usual letters their fields.
- `HiringTools`: the list's spreadsheet seat and the bulk let-go.
- `OpeningForm`: an opening in a drawer, in English and Arabic, with extra
  languages from `locales` and an optional draft of them (`onDraft`).
- `candidateColumns`, `openingColumns`: a list's common columns for
  `DataTable`, with the app's own beside them; server-safe.
- `EventTrail` (any record's story) and `PdfLink` / `PdfHeaderActions` /
  `HeaderLink` (papers that always open fresh) are general, not hiring's.

The fixture's `/hiring` page has every piece wired with words of its own.

### 13. On a phone

A panel becomes a phone app with three settings on PanelProvider, and the
viewport reaching the phone's edges:

```tsx
<PanelProvider
  tabs={["/", "/tasks", "/calendar", "/hiring"]}   // paths in `nav`; four at most
  quick={[{ label: "New task", href: "/tasks?new=1", Icon: ListPlus, cap: "add_tasks" }, …]}
  install={{ name: "Inception" }}                   // the home-screen tip, once
  …
>
// app/layout.tsx
export const viewport: Viewport = { themeColor: "…", viewportFit: "cover" };
```

- The bar, the + sheet and More come with `tabs`; `quick` fills the sheet.
- Every `Drawer` closes with a swipe on a touch screen; `useSwipeTurn(el,
  { page, onTurn })` turns a calendar's days; `useDrag` is the drag under
  both, for a gesture of the app's own.
- `PillTabs` for a room's views, `ContactDoors` for a person's phone and
  email, `FileButton camera` for a photo from the phone.

### 14. The calendar

One calendar for every panel: day, week, month, year, the people side by
side and a list on a desk; the week as a strip over the day's cards, the
month as dots and the list on a phone. It shows the app's items of any kind
(meetings, tasks, posts, time off), warns about clashes, drives that don't fit
and anything booked while someone is away, and lets an item be dragged to
another time, stretched by its foot, drawn on an empty stretch, or (in the
people view, with `handOver`) dragged to another person. The kit imports no
database and no server action: the app hands in the items and saves.

**What the app adds:** the stylesheet after kit.css, and nothing else beyond
the kit's usual setup (the peers, `transpilePackages`, the `@source` line,
`kit` on `<html>` or the Shell, a `ToastProvider` round the Shell, since a
move and a booking answer in a toast):

```css
@import "tailwindcss";
@import "@socialize/panel-kit/kit.css";
@import "@socialize/panel-kit/calendar.css";
@source "../node_modules/@socialize/panel-kit/src";
```

calendar.css sits in Tailwind's `components` layer, so a utility on the same
element wins (`lg:hidden` hides a `.cal-round`). An app's own unlayered rules
win over it too: a room that reuses `.cal-card` or `.cal-avatar` can adjust
them. Each item's colour is `--c`; the lines are `--cal-line` and
`--cal-line-soft`, set on `.cal`, the calendar's root.

**The page** (a server component) reads the address and loads what the view
shows:

```tsx
import { officeMinutes, officeToday, officeMoment } from "@socialize/panel-kit/calendar-time";
import { readCalendarAddress, viewWindow } from "@socialize/panel-kit/calendar-views";

const today = officeToday(CLOCK);
const { view, date, q } = readCalendarAddress(await searchParams, today);
const [from, to] = viewWindow(view, date, CLOCK);           // the days to load
const rows = q ? await search(q) : await load(officeMoment(from, 0, CLOCK), officeMoment(to, 0, CLOCK));
return <CalendarRoom view={view} date={date} q={q} today={today} nowMinutes={officeMinutes(CLOCK)} rows={rows} … />;
```

**The room** (the app's client module) maps its rows to `CalendarItem`s and
wires the callbacks:

```tsx
"use client";
import { Calendar } from "@socialize/panel-kit/calendar";
import { MeetingDrawer, type MeetingOpen } from "@socialize/panel-kit/meeting-drawer";
import { PhoneFeedButton, PhoneFeedDrawer, usePhoneFeed } from "@socialize/panel-kit/phone-feed";

const phone = usePhoneFeed(phoneCalendar);                  // (fresh) => { ok, url } | { ok: false, error }
<Calendar
  items={rows.map(toItem)}                                  // CalendarItem[]
  people={people}                                           // { id, name, colour?, subtitle? }[]
  view={view} date={date} query={q} today={today} nowMinutes={nowMinutes}
  basePath="/calendar"                                      // or href={(view, date, q) => …}
  kinds={[{ kind: "meeting", label: "Meetings" }, { kind: "leave", label: "Time off" }]}
  kindIcon={(kind) => ICONS[kind]}                          // a lucide icon, or nothing
  permissions={{ canAdd, canEdit }}
  onOpen={(item) => …}                                      // open the app's drawer for it
  onSlot={(slot) => setDrawer({ kind: "new", ...slot })}    // { day, from, to?, person? }
  onMove={(item, move) => moveIt(item.id, move)}            // { start, end, fromPerson?, toPerson? } → ActionResult
  words={{ search: "Search meetings" }}                     // only the words that change
  clock={CLOCK}
  foot={<PhoneFeedButton onClick={phone.show} />}
>
  <MeetingDrawer open={drawer} onClose={…} people={people} items={items} me={me}
    adapter={{ save, changeSeries, remove }} canEdit={canEdit} canRemove={canRemove}
    about={{ label: "Client", options: clients }} onDone={(message) => { close(); toast(message); router.refresh(); }} />
  <PhoneFeedDrawer phone={phone} />
</Calendar>
```

- **An item** is timed (`start`, `end`, ISO moments) or `allDay` (`day`,
  `endDay`). It carries `kind`, `title`, `people`, and may carry its own
  `colour` (else its first person's, else the brand), `subtitle`,
  `location`, `travelMinutes`, `status`, `seriesId`, `repeat`. `editable:
  false` opens on a press but never drags; `away: true` is time off: it
  hatches, hatches its person's column in the people view, and warns about
  anything of theirs inside it.
- **A move** shows at once; a result that isn't ok puts it back and says why
  in a toast, and a message on success replaces the calendar's own ("Moved to
  Thu 15 Oct, 10:00"). The page then refreshes.
- **The words** are English and go through PanelProvider's `t` as they are
  drawn (`calendar-words`: `CALENDAR_WORDS`, `MEETING_WORDS`, `FEED_WORDS`).
  Hand in only the ones that change.
- **The clock** (`calendar-time`) is the office's, Doha's by default: +03:00
  all year, the week from Sunday, Friday and Saturday off. `ClockSettings`
  takes `offsetMinutes`, or `timeZone` for a clock that moves for summer,
  `weekStartsOn` and `weekend`. Inside `<Calendar>` the week starts where
  PanelProvider's `weekStartsOn` says, so the small month agrees; give the
  same settings to the page's `viewWindow`.
- **The booking drawer** holds the form (what, the day and hours, a repeat
  until a day, the people, where, the drive, the company, a guest, confirmed
  or not, the purpose) and checks for clashes as it is filled. It saves
  through `adapter.save(draft)`, a series' later meetings through
  `adapter.changeSeries(draft)` and removes through `adapter.remove(id,
  scope)`; leave one out and the drawer doesn't offer it. `fields` turns
  parts off.
- **The phone feed**: `calendarFile({ name, prodId, uidDomain, tzName,
  linkFor, events, people, now })` writes the iCalendar file the app serves
  at the link `usePhoneFeed` asks for.
- **Pure helpers** for the server and the tests: `calendar-layout`
  (`placeDay`, `placeAllDay`, `warnings`, `dropAt`, `moveOf`),
  `calendar-repeat` (`seriesDays`, `repeatLabel`, working days from the
  weekend), `calendar-views` (`readCalendarAddress`, `viewSpan`,
  `viewWindow`, `calendarHref`) and `due` (`dueGroup`, `dueText`, `lateDays`,
  `DUE_GROUP_NAMES`), the task list's groups: late, today, tomorrow, this
  week, later, no date.

The fixture's `/calendar` page has every piece wired, with four kinds, a
clash, a drive that doesn't fit and someone booked while away.

## What's in it

| | |
|---|---|
| **Phone** | `phone-bar`, `install-tip`, `use-drag`, `use-swipe-turn`, `gesture`, `device`, `contact`, `contact-doors`, `brand-glyphs`, `file-button`, `pill-tabs`, `initials` |
| **Shell** | `shell`, `panel-provider`, `nav`, `page-header-context` (PageMeta), `back-door`, `nav-memory`, `collapse-button`, `new-record-button`, `header-control`, `header-fold`, `lights-toggle`, `use-panel-pathname`, `number-wheel-guard`, `rows-calibrator`, `refresh-if-stale`, `door-page`, `door-forms`, `grain` |
| **Lists** | `data-table`, `stage-tabs`, `list-config`, `list-controls` (search, filter, sort, the chips), `filter-drawer`, `list-options-context`, `page-size`, `page-size-server`, `link-row`, `row-actions`, `row-menu`, `decision-bar` |
| **Records** | `drawer`, `drawer-header`, `drawer-tabs`, `record`, `record-fields` (Section), `record-form`, `record-editing`, `record-route`, `stage-walk`, `unsaved-guard`, `delete-button`, `save-button`, `use-action-success`, `foot-log`, `event-trail`, `pdf-link` |
| **Calendar** | `calendar` (the room), `calendar-grid`, `calendar-month`, `calendar-list`, `calendar-side`, `calendar-context`, `meeting-drawer`, `phone-feed`, and pure: `calendar-time`, `calendar-layout`, `calendar-repeat`, `calendar-views`, `calendar-words`, `calendar-ics`, `due`; the look in `calendar.css` |
| **Hiring** | `hiring-words`, `stage-chip`, `fit-chip`, `stage-mover`, `candidate-file`, `letter-composer`, `sent-letters`, `hiring-tools`, `candidate-columns`, `opening-form`, `opening-chip`, `opening-columns` |
| **Fields** | `fields`, `select-menu`, `other-select`, `choice-pills`, `segmented`, `switch`, `number-stepper`, `date-field`, `time-field`, `phone-field`, `password-input`, `note-box`, `grab-resize`, `caret-safe`, `joined-row`, `media-drop-zone`, `photo-field`, `star-rating` |
| **Feedback** | `modal` (ConfirmDialog, PromptDialog, PickDialog, Sheet), `toast`, `hint`, `empty-state`, `panel-loader`, `load-error` |
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
