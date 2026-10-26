# Changelog

## 0.1.21 — 26 Oct 2026

- `ReorderList` (new): an order set by hand (a shop's pieces, a listing's photos). A mouse drags a row by its grip; every row also carries move-to-the-top, up and down seats, so a keyboard and a phone do the same. Nothing saves while moving: Save the order and Put it back appear once the order differs, and Save hands the app the keys in their new order. `moveItem` is exported and tested. First in Lucce's Pieces room.

## 0.1.20 — 26 Oct 2026

- `StageTabs` with `home`: the first cell's key was "all", the same as the **All** cell at the end, and React warned of two children with one key in every list that opens on a home view (the hiring rooms, Lucce's requests). The first cell is keyed "home" now.

- `PhotoList` (new): a record's photos in the website's order, the first the cover, with make-it-the-cover, move and take-off seats and the drop tile; uploads go through the app's own `upload(file)`, the list rides in a hidden field and is saved with the record, and Save waits while photos are on their way. Built in X Capital's properties and copied into Lucce's pieces; one part for both now.
- `DoorSignIn`: `magicLink` is optional. Without it the card is the password form alone, for a panel whose email isn't sending yet (Lucce, before its Resend domain): it no longer offers a link that can't arrive.
- List controls: the second filter menu (a kind, a list, a category) wears a filter's mark (`ListFilter`) instead of the looping arrows, which read as "repeat" to a newcomer (Lucce's guide, 26 Oct 2026).

## 0.1.19 — 18 Oct 2026

- `StageTabs` takes `home`: the view a list opens on, as the strip's first cell (a hiring list's **Active**, everyone not hired or let go), with **All** moved to the end after the ways out, under `allValue` ("all"). The big hiring tools open on the people still in play; the rejected stay one press away (Socialize: "the rejected application keep appearing").

## 0.1.18 — 18 Oct 2026

Interviews in the hiring rooms, and what the first house panel to move its own hiring onto them needed (Socialize; Damine: "of course using unified brain and components").

- `InterviewCard` (new): the interview booked with a candidate, under where they stand in `CandidateFile` (its new `interview` slot): the day and the hours on the office's clock, where, with whom, how long, and whether they said yes. Before it: **They confirmed**, **Move it** (a form in place for the day, the time and the length; nothing moves until pressed) and **Cancel the interview** behind ⋯, asking first with an optional line for them. Once it is over and the file still waits on it: **Didn't come** or **They came**. Every act is the app's callback; the app tells the candidate.
- `interviewColumns` and `InterviewChip` (new, server-safe): an interviews list (candidate, when, role, with, where, standing).
- Letter fields take `kind: "choice"` with `options`, and `many` for several (who sits in an interview; the values travel joined by commas, `manyOf` reads them). `INTERVIEW_LENGTHS` and `lengthLabel` in `hiring-words`.
- `LetterComposer`: `confirmBody` (what the send question says goes, for a panel whose letters ride WhatsApp too) and `previewAside` (the panel's own view under the email preview, from what its preview answers in `extra`: the same letter on the phone).
- `StageMover` and `CandidateFile` take `onHire`: the panel's own hire step in place of the kit's question (a hire that asks the salary and the first day). `HiringWords.hireIsFinal`: a hire never reopens, and its walk takes no press.
- `HiringTools` takes `onExport`: the spreadsheet made on the press, for a list paged in the browser whose filters the address can't carry.
- `OpeningForm` takes `responsibilities={false}` (no "What you'll do" list, for role pages without one) and `recordHref` (where a new opening opens, for a panel whose drawers open from a search param).
- The candidate's story gives interview and WhatsApp lines their own glyphs. `SentLetters` counts letters, not emails: a panel's letters may go by WhatsApp too.

## 0.1.17 — 17 Oct 2026

One calendar for every panel, lifted from the first panel that built one and made to show items of any kind. The kit owns the views, the gestures, the warnings and the booking form; the app owns the items and every write.

- `Calendar` (new): day, week, month, year, the people side by side and a list on a desk; on a phone the week as a strip over the day's cards (a swipe turns the day), the month as dots, and the list. The toolbar's views are `PillTabs`; the side holds the search, a small month, the people with how many items each has in view, the kinds ("What shows") when there are two or more, and the app's own seat (`foot`, the phone link). A line over the grid names what clashes in view (`strip`, on by default). Items are `CalendarItem`s of any `kind`, each in its own colour, its person's, or the brand.
- An all-day lane over the time grid: an all-day item is a bar across its days, stacked in as few rows as keep them apart; in the people view a bar sits in its own people's columns.
- Time off (`away`): hatched wherever it is drawn, a person's column hatched behind their day in the people view, and a warning on anything of theirs booked inside it.
- Drag to move by quarter hours, pull the foot to change the end, draw on an empty stretch to book. An item with `editable: false` opens on a press and never drags. In the people view with `handOver`, a drop in another person's column reports `fromPerson` and `toPerson`. The move shows at once and goes back, with the reason, if the app says no.
- `MeetingDrawer` (new): the booking form (what, the day and hours, a repeat until a day, the people, where, the drive, the company, a guest, confirmed or not, the purpose), a live check for clashes, drives that don't fit and people away, a series' "only this one" or "this and the ones after", and a read view for someone who may only look. It saves through an adapter (`save`, `changeSeries`, `remove`); the fields and the words are the app's to change.
- `PhoneFeedButton`, `PhoneFeedDrawer` and `usePhoneFeed` (new): a person's calendar on their phone, one tap for an iPhone or a Mac, one for Google Calendar, or a link to copy, and a new link when the old one got out. `calendarFile` (in `calendar-ics`) writes the RFC 5545 file, with the app's own PRODID, UID domain and links; all-day items go out as dates.
- Pure, for the server, the browser and the tests: `calendar-time` (the office's clock: an offset or a zone with summer time, the week's first day and the weekend, Doha's by default), `calendar-layout` (`placeDay`, `placeAllDay`, `warnings` with `clash`, `drive` and `away`, `dropAt`, `moveOf`), `calendar-repeat` (working days follow the weekend), `calendar-views` (the address, what a view shows and what a page loads), `calendar-words` (every word, in English, through the panel's translator), and `due`: a task list's groups (late, today, tomorrow, this week, later, no date), `lateDays` and the words on a due pill.
- An item that ends at midnight stays in its day: the first panel drew a quarter-hour stub of it at the top of the next.
- A drag let go at the same time saves nothing. The first panel compared the times as text, and a database writes "+00:00" where the clock writes "Z", so a small nudge saved the meeting again and told everyone in it that it had moved.
- `calendar.css` (new, its own import after kit.css): the calendar's look, in Tailwind's `components` layer so a utility on the same element wins. Unlayered, `.cal-round`'s own display beat `lg:hidden`, and a room wrapped the button in a div to hide it. The fixture's CSS proof now checks the layer.
- The fixture has a `/calendar` page with every piece wired.

## 0.1.16 — 11 Oct 2026

The panel on a phone, like an app (Inception first). Every piece is one shared copy, and the arithmetic behind it is plain functions with tests.

- `PhoneBar` (new), from PanelProvider `tabs` and `quick`: below lg the shell ends in a bottom bar — the rooms a thumb reaches most (by their path in `nav`, each keeping its icon, name, capability and count), a round + in the middle that opens a sheet of quick actions (each behind its capability), and More, which opens the rail. With a bar the top bar's menu button steps aside. The bar is the column's last row, so a list's calibrator measures the room really left.
- `Sheet` (new, in `modal`): a phone sheet that rises from the bottom under a grab bar and drops with a swipe down, a tap on the scrim or Escape.
- The `Drawer` closes with a swipe toward its own edge on a touch screen: 1:1 under the thumb, a flick or a third of the way lets it go, the other way only rubber-bands, a short drag settles back, unsaved work still asks first. `kit-drawer-out` and `kit-fade-out` lost their `from`, so a close starts wherever a swipe left the drawer and its scrim.
- `useSwipeTurn` (new): swipe sideways to turn a page (a calendar's day); the old page leaves the way it was pushed and the new one comes in from the other side once its `page` key changes. Reduced motion keeps the fade and drops the travel.
- `useDrag` (new): the one thumb drag under all three. Touch events, not pointer events: a drawer's form scrolls in boxes of its own, and a scroll box hands a sideways pointer drag to the browser before the drawer hears it. A drag never starts on a field, a slider, `[data-no-swipe]` or anything that scrolls along its axis.
- `gesture` (new, pure): `lockAxis`, `rubberband`, `velocityOf`, `commits` (a flick past 0.11 px/ms, or past a share of the way), `SLOP`, `FLICK`.
- `InstallTip` (new), from PanelProvider `install`: once, on the home page of a phone not running the panel from its home screen, how to put it there in that phone's steps (Safari's Share on an iPhone, where alerts need it; the browser's own offer on Android). Gone for good once closed or done. `device` (new, pure): `installWay`, `appleTouch`, and `standalone()` for browser code.
- `PillTabs` (new): a room's views on a soft track with a white pill that slides to the open one; every tab as wide as the widest. A row wider than the screen scrolls, fades on the side that has more, and keeps the open tab in view. Links or buttons; a count, or an alert badge.
- `ContactDoors` (new): Call, WhatsApp, Email in the house order, as equal buttons that open the phone's apps, with the real WhatsApp glyph (`brand-glyphs`, new). `contact` (new, pure): `contactLinks` on team-kit's phone helpers, and `internationalDigits` — a number typed without its country is read in Qatar, never as whatever country its first digits spell. `CandidateFile` uses it in place of its own three links.
- `FileButton` (new): the real button for the hidden file box every upload sits behind; `camera` opens a phone's back camera straight away.
- `initials` (new, pure): a word that doesn't start with a letter is skipped — the rail's foot read "D(" for "Dev (verification)".
- Every typing box is 16px on a phone (sm and up keep 14 and 13): an iPhone zooms the page into a smaller field the moment it is tapped. The search bar, the phone, date, time and number boxes too.
- `TAP` (new, in `classes`): an invisible margin round a small control on a touch screen, so a 28px arrow answers a 48px thumb; on the pager arrows, a section's fold, the switch. The guide's chips are 40px tall on a phone.
- The shell, the drawer, the sheet and the phone rail pad an iPhone's status bar and home bar (`env(safe-area-inset-*)`, live once the app's viewport says `viewportFit: "cover"`).

## 0.1.15 — 10 Oct 2026

- A list's phone cards are compact: the name with its line, then each detail as its label and value on one line, side by side and wrapping only when the line is full; no divider, tighter padding, a 14px name. A screen holds about twice the records (Damine: "cards for mobile are too big"). Every list gets it.
- The top bar keeps the title whole: when the title and the tools don't fit one line (a phone, a room with many tools), the tools step down to a line of their own at the end. "Candidates" had read "C…" at 400px.
- `HiringTools`: the spreadsheet and let-go seats are framed seats of the top bar's strip, like search and filter beside them (they were bare icons).
- A list on a phone pages exactly the cards that fit the screen: the RowsCalibrator counts the phone cards (`data-card-body`) when the table is hidden, and the measured rows may now go as low as 1, so a short phone gets the one or two cards it holds. A phone kept the desk's 29 rows and scrolled far past the screen. The calibrator now watches the list's box and measures once it settles (and again when it resizes, replacing the window resize listener), so a room's buttons arriving in the top bar a beat later and wrapping it onto a second line no longer leave the last card cut off.
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
