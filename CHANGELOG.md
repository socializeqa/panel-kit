# Changelog

## 0.1.15 — 10 Oct 2026

- A list's phone cards are compact: the name with its line, then each detail as its label and value on one line, side by side and wrapping only when the line is full; no divider, tighter padding, a 14px name. A screen holds about twice the records (Damine: "cards for mobile are too big"). Every list gets it.
- The top bar keeps the title whole: when the title and the tools don't fit one line (a phone, a room with many tools), the tools step down to a line of their own at the end. "Candidates" had read "C…" at 400px.
- `HiringTools`: the spreadsheet and let-go seats are framed seats of the top bar's strip, like search and filter beside them (they were bare icons).
- A list on a phone pages exactly the cards that fit the screen: the RowsCalibrator counts the phone cards (`data-card-body`) when the table is hidden, and the measured rows may now go as low as 1, so a short phone gets the one or two cards it holds. A phone kept the desk's 29 rows and scrolled far past the screen.
- `candidateColumns` leaves Papers off the phone card: a candidate's card reads applied, role, fit and stage, the same shape as every other list's.

## 0.1.14 — 10 Oct 2026

The hiring rooms, lifted from the first panel that built them, so every panel that hires shares one copy. The kit owns none of the words: the app hands them in, and every write is the app's callback.

- `hiring-words` (new): the `HiringWords` an app hands in (the stages in walk order with their labels, short names, tones, step words and the stage a trial can be skipped over; the letters and the letter each stage opens; `letterNeeds`; `fitWord`, with an optional `fitTone` and `fitCutoffs`; a `hireNote` for the hire question), and the rules the rooms share, held by tests: `offeredMoves` (what a file offers at its stage), `walkPick` (what a press on the walk means), `letterGate` (the send stays shut until a letter has what it needs and the mail is set up), `readDraft`, `startDetails`, `standardLetterFields({ office, placeholders })` and `questionCount`. Server-safe.
- `StageChip`, `FitChip`, `OpeningChip` (new): the chips, the same in a row and a drawer, server-safe.
- `StageMover` (new): the walk with the next step as its one door; back a step, skip a trial, hire early and let go behind the menu; a settled file reopens. A hire, a let-go (with a reason) and a reopen ask first. `onMove(to, reason?)`.
- `CandidateFile` (new): one candidate in one calm column: where they stand, the facts (Email and Phone, then the panel's own `facts`, then the CV and portfolio) with Email, Call and WhatsApp in equal thirds, the reader's score with its two cut-offs, their answers, the rating and the notes; the letters and the story as rooms under the header; delete behind the header's ⋯ when the app allows it. `onRate`, `onAddNote`, `language.onChange`.
- `LetterComposer` and `SentLetters` (new): pick the letter (the stage's comes first), fill only what it carries (the calendar and the clock for an interview), preview it as it arrives, send it behind a question. The draft is kept in the tab under the app's `draftKey` and never marks the drawer dirty. The sent list shows each letter's fate in the app's words.
- The composer keeps a draft only once something is written or picked, and an untouched one follows the candidate's stage: moved to Invited, the letters room opens on the invitation. (Found wiring the first app: the default letter was kept the moment the drawer opened, so a stage move left the composer on the old stage's letter.)
- `OpeningForm` and `RecordEditingProvider` take `canEdit`: a role that may only look gets no pencil, and the view bar says "Your role can't change it." instead of offering Switch to edit. The view bar's line no longer uses a dash.
- `HiringTools` (new): the list's spreadsheet seat (`exportHref`) and letting many go at once, with a reason and an optional regret letter. `onLetGo(ids, reason, sendLetter)`.
- `OpeningForm` (new): an opening in a drawer on the one save model: the role (and the panel's own fields in `extra`), the page's words, Arabic (`arabic={false}` for a site without it), the salary in the panel's `currency`, up to `maxQuestions` screening questions with their Arabic lines, the status, and the extra languages from `locales` with an optional `onDraft`. Cancel now also drops a draft of the languages.
- `candidateColumns`, `openingColumns` (new): a list's common columns for `DataTable`, the app's own beside them, server-safe; icon seats are named in words the panel translates.
- `EventTrail` (new): any record's story in the FootLog grammar; the glyphs per kind are a prop.
- `PdfLink`, `PdfHeaderActions`, `HeaderLink` (new): papers that always open fresh, and their seats in a drawer header. A press with a modifier key is left to the browser.
- `ROOM_COLUMN` in `classes`: a record's room read top to bottom. Its cards never shrink: with `min-h-full` alone a long file squeezed every card to the screen's height (each clips what overflows it) instead of scrolling. A panel with its own copy of these rooms has the same squeeze on a short screen.
- The fixture has a `/hiring` page with every piece wired.

## 0.1.13 — 8 Oct 2026

- A drawer takes focus itself as it opens, instead of Radix putting it on the first control (mostly the close button). Chrome draws a focus given on opening as a keyboard focus even after a click, so 0.1.12's keyboard-only frame still showed on every mouse open. Focus stays inside the drawer (Tab and Esc work as before), and a field that asks for focus (`autoFocus`) keeps it.

## 0.1.12 — 8 Oct 2026

- A header seat (a list control, a record's ⋯, the drawer's close) frames itself for the keyboard only. A drawer focuses its close button as it opens, so every mouse user saw a maroon frame on it; fields still frame on any focus.
- The home room's "?" lands on its own part of the guide: `helpAnchor(href, label)` gives the home room ("/") its name ("Today" is `today`), where it gave nothing and the guide opened at its top.
- The door's links by email are answered first and looked up after (Next's `after`): the time a reset or sign-in link request takes no longer tells a login that exists from one that doesn't. Outside a request it mails at once, as before.

## 0.1.11 — 7 Oct 2026

One door for every panel (Damine: "a premium login page ... with phone or username or mobile number, remember me, forget password and magic link ... unified for all our customers"):

- `door-server` (new): the server half of the door, once for everyone. `door(deps)` returns `signIn`, `forgot`, `magicLink` and `land`; a panel hands in its own lookup, sign-in server, link tokens, mail, "keep me signed in" cookie and wrong-tries counter, and wraps the actions in its own "use server" file. A wrong login and a wrong password get the same answer; links go only to a real inbox, and the answer is the same "sent" whoever asked; a link lands as a path, never an address. This is X Capital's door (its login actions, `staff-login.ts`, the confirm route) moved into the kit.
- Usernames: `readLogin(raw, dial, localLength, usernames)` reads a username (a letter, then letters, digits, dots, dashes or underscores, 3 to 32) when the panel opts in; a panel that doesn't reads words as nothing, as before. `USERNAME`, `loginWords()` (the box's label and the door's answers by what the panel takes) and `waitWords()`.
- The door in Apple's glass (Damine: "it must be like iPhone iOS"): with a scene, the form floats on one card with round corners, the light catching its rim and a sheen down its face, arriving as a material (it sharpens and settles). The fields stand in one rounded block, each row as tall as the Password / Email link control and the pill (48 px), the field's name its placeholder; "Keep me signed in" is an iOS switch over a real checkbox; the way in is a white pill pressed in under the finger; a refusal is a soft red note. The cut-corner glass, underline fields and light bar are gone. `DoorScene` takes `glass` (the card's tint), `accent` (the client's colour, whole, for the pill's text and the switch's knob: the dark theme lightens brand tones, and a lightened maroon is pink) and `veil` (off for a drawn ground). The door's colours are variables (`--door-field`, `--door-track`, `--door-thumb`, `--door-switch-off`, `--door-sheen`) a panel may set. Reduced motion fades; reduced transparency makes the glass near solid.
- `DoorSignIn` (new): both ways in on one card, a password or a sign-in link by email, behind a sliding control, at one height so the card never jumps. The login a person typed survives a refused password.
- `Drawer` takes `size="form"` (640 px), for a single form like a meeting, so its fields don't stretch across a desk screen; the record width stays the default.
- A calendar's week starts where the office's does: `PanelProvider` takes `weekStartsOn` (6 Saturday, the default; 0 Sunday; 1 Monday), and `CalendarPanel` and `DateField` follow it. `CalendarPanel` takes `clearable={false}` for a calendar that moves to a day instead of filling a field (a calendar room's small month), so it shows no Clear.
- `MagicLinkForm` (new): one box, "Email me a sign-in link", then the same answer whoever asked. `SignInForm` takes `magicHref` (a quiet "Email me a sign-in link instead" under the button), `label`, and `notice` (the line after a spent link brought someone back); `ForgotForm` takes `label`. `ForgotState` is now `LinkState`, from `staff-door`.

## 0.1.10 — 4 Oct 2026

- `HelpGuide` sets every part on one grid (Damine, of 0.1.9 on his 3072 px desk: "not professionally aligned and weird"): the part's title across the top, then two columns, five to seven, that start on the same line, and whatever stands in the second column starts on the same edge part after part. A picture stands there beside the words; a list's wide picture (wider than twice its height) goes under them across the part, and back beside them once the card is desk-wide (100rem). With no picture, what to know stands beside the steps, and a long list with nothing beside it is split in two halves, one per column, still counting. A picture never shows larger than it was taken, so the panel's type in it stays the panel's size. Apps should cut their pictures to what they show; a whole window of white is what made the old pages look empty.
- The contents card stands the full height of the screen and stays as the guide scrolls (Damine: "full height ... and centered vertically"): the page's own 20 px gap above and below, its word at the head, the rooms in the card's true middle like the rail's menu. Its height is read from the shell's scrolling area, so it fits whatever height the top bar takes.

## 0.1.9 — 4 Oct 2026

- `HelpGuide` takes the whole width of the page (Damine: "must be full width"). The contents stand in their own card, their top on the first section's top; on a card wide enough (a container query) each part puts its picture beside its steps. Steps, points and the tip open on one 24 px slot, so their words share one left edge.

## 0.1.8 — 4 Oct 2026

- The panel's guide is named in words: with `help` set, the rail's foot has a **How to use** row above the person's name, lit like a room while the guide is open. The "?" glyph alone at the foot went unseen (X Capital). The top bar's "?" now reads "How to use this page".

## 0.1.7 — 4 Oct 2026

- `ForgotForm` takes `mobileOnly`: the line after a reset request for staff who sign in with a mobile only and get no link, so each panel can say who really sets their password. The default is the line it always said ("Ask your manager…"); at X Capital only an owner can, so its door says so.

## 0.1.6 — 4 Oct 2026

The panel's own guide, from X Capital (Damine: a "how to use" in the panel, "so we know how it works"):

- `HelpGuide`: a help page drawn from plain data the app writes: sections, each with parts (steps, points, a picture of the panel, a tip). A section tied to a room (`room: "/hiring"`) takes the room's name and icon from the rail and shows only to someone who can open that room; a part with a `cap` shows only to someone who holds it, so each person reads only what their role can do. Contents down the side on a wide screen, as a row of words on a narrow one.
- `PanelProvider` takes `help` (the guide's path): every room's top bar gets a "?" seat that opens that room's part of the guide (`#hiring` for `/hiring`, `helpAnchor`), and the rail's foot a way in.
- `HelpPrintSeat`, and the shell prints clean: on paper there is no rail and no top bar, and the page runs on instead of scrolling in its frame. The guide prints a section a page, so "save as PDF" is the guide a new hire is sent.

## 0.1.5 — 3 Oct 2026

Staff doors, from X Capital (Damine: sign in "by phone or email", a starting password changed at the first sign-in, and a forgot-password that works by email):

- `staff-door`: `readLogin` reads the door's one box as an email or a mobile; `staffPhone` keeps a mobile as digits with the country code, so "+974 5512 3456", "00974…" and a bare "5512 3456" are one person; `phoneLoginEmail` makes the sign-in address of a mobile-only login at the panel's staff domain; `passwordProblem` is the house rule (10 characters, a capital, a small letter and a number, at most 72) and refuses a password the person was handed; `PASSWORD_DOOR` holds the words for the four ways to a new password (first sign-in, reset link, change, invite).
- `door-forms`: `SignInForm` (email or mobile, the password, keep me signed in, "Forgot password?"), `ForgotForm` (one box, then the same answer whoever asked, and a word for mobile-only staff) and `NewPasswordForm` (the rule under the field; the current password first when it is a change). Each takes the app's own server action.
- `PanelProvider` `user` takes `href`: the rail's name block then opens the person's own account.

Stages you can see, from X Capital's candidates (Damine: "i dont see phases"):

- `StageTabs`: a list's stages as one strip across its head, each with its count: All, the path left to right, the ways out set apart. Each stage is a link that filters the list and keeps its other filters. It replaces a row of figures when the stages are the figures.
- `StageWalk`: where one record stands on its path, as points on a line (done, here, ahead), the way out apart at the end. With `onPick` each point moves the record; the app decides what a pick means. In a narrow seat (a phone) only the current stage keeps its name under its point.
- `Section` takes `plain`: a calm card for a long record read top to bottom, a small grey title with its hint and action across from it, no glyph and no band (Damine's pick of three for X Capital's candidate file).
- `DrawerTabs` takes `under`: the rooms on their own line under the title, centred, each a word with a mark under the open one.
From the hiring audit (4 Oct 2026):

- **The whole row opens the record.** A row link stretched over its positioned parent, and the first cell is pinned for sideways scrolling, so only that one cell opened anything (pressing a name did nothing). `ClickRow` now takes the pointer anywhere on the row; the first cell keeps its link for the keyboard; the row's own buttons and links, a text selection and a modifier press are left alone. Every panel gets this with the version.
- `CheckList`: a list to tick for an act on many records, All and None on top, the kit's own ticks (a screen reader hears checkboxes).
- Icon buttons and the drawer's seats show the kit's brand ring for the keyboard, never the browser's black box after a press.
- A drawer's title wraps to two lines in a narrow drawer instead of cutting the name to a few letters.

- `RecordForm` takes `top`: a long record in a drawer starts at the top instead of sitting in the middle (X Capital's candidate file opened on an empty band).

## 0.1.4 — 3 Oct 2026

From X Capital's door, which Damine wanted richer:

- `DoorPage` takes `scene`: a picture of the client's world (`picture`, the app's own `<Image fill>`), its `mark` drawn light, and an optional `caption`. The picture fills the screen under a warm veil (`door-veil`); the mark, heading and form sit on frosted glass cut at two corners (`door-glass`), where the fields read as single lines and the way in is a light bar; the caption and "Powered by" share the foot. Damine's pick of three looks for X Capital. Without a scene the door is the centred one it was.
- Every door ends on a small "Powered by" with Socialize's mark, linked to socialize.qa.
- `SocializeMark`: the house wordmark from its own file, in the colour of the words around it.

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
