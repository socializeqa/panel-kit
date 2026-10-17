import type { Translate } from "./panel-provider";
import { dayName, hhmm, monthName, officeClock, type ClockSettings } from "./calendar-time";
import type { CalendarView } from "./calendar-views";

// Every word the calendar, the booking drawer and the phone link draw, in
// English. Each goes through the panel's translator (PanelProvider `t`) as it
// is drawn, so a panel that speaks Arabic translates the English. A panel
// that calls its items something else hands in the words it wants changed
// (`words`): a calendar of meetings says "Search meetings". Blanks read
// `{name}`. Pure, so a server page can build the words too.

export interface CalendarWords {
  views: Record<CalendarView, string>;
  /** What the row of views chooses, for a screen reader. */
  viewsLabel: string;
  earlier: string;
  later: string;
  today: string;
  tomorrow: string;
  yesterday: string;
  earlierWeek: string;
  laterWeek: string;
  /** The title while a search shows. */
  searchTitle: string;
  /** The search box's placeholder and name. */
  search: string;
  clearSearch: string;
  foundOne: string;
  found: string;
  notFound: string;
  comingUp: string;
  before: string;
  freeDay: string;
  freeMonth: string;
  pickSomeone: string;
  people: string;
  /** The people toggles, for a screen reader. */
  whoShows: string;
  showEveryone: string;
  /** The kinds toggles' heading. */
  kinds: string;
  showAll: string;
  more: string;
  allDay: string;
  drive: string;
  leaveBy: string;
  repeats: string;
  away: string;
  someone: string;
  /** The warnings on an item. */
  clash: string;
  noDrive: string;
  awayThen: string;
  /** The warnings strip over the grid. */
  stripLabel: string;
  stripClash: string;
  stripDrive: string;
  stripAway: string;
  stripMore: string;
  /** The year's key, and a day's name for a screen reader. */
  free: string;
  busy: string;
  countOne: string;
  countMany: string;
  countNone: string;
  dayCount: string;
  /** What a move says when the app says nothing. */
  moved: string;
  movedOne: string;
  handedOver: string;
  moveFailed: string;
}

export const CALENDAR_WORDS: CalendarWords = {
  views: { day: "Day", week: "Week", month: "Month", year: "Year", people: "People", list: "List" },
  viewsLabel: "How the calendar shows",
  earlier: "Earlier",
  later: "Later",
  today: "Today",
  tomorrow: "Tomorrow",
  yesterday: "Yesterday",
  earlierWeek: "Earlier week",
  laterWeek: "Later week",
  searchTitle: "Search",
  search: "Search the calendar",
  clearSearch: "Clear the search",
  foundOne: "1 found for “{q}”",
  found: "{n} found for “{q}”",
  notFound: "Nothing matches “{q}”.",
  comingUp: "Coming up",
  before: "Before",
  freeDay: "Nothing booked. A free day.",
  freeMonth: "Nothing booked in {month}.",
  pickSomeone: "Pick someone to see their day side by side.",
  people: "People",
  whoShows: "Whose calendar shows",
  showEveryone: "Show everyone",
  kinds: "What shows",
  showAll: "Show all",
  more: "{n} more",
  allDay: "All day",
  drive: "{n} min drive",
  leaveBy: "Leave by {time} · {n} min drive",
  repeats: "Repeats",
  away: "Away",
  someone: "Someone",
  clash: "{name} has something else then",
  noDrive: "No time to drive from the one before",
  awayThen: "{name} is away then",
  stripLabel: "What clashes",
  stripClash: "{name} has two things at once: {title}, {when}",
  stripDrive: "{name} has no time to drive to {title}, {when}",
  stripAway: "{name} is away during {title}, {when}",
  stripMore: "And {n} more",
  free: "Free",
  busy: "Busy",
  countOne: "1 booked",
  countMany: "{n} booked",
  countNone: "free",
  dayCount: "{date}: {count}",
  moved: "Moved to {when}",
  movedOne: "Moved this one to {when}. The rest of the series stays.",
  handedOver: "Handed to {name}, {when}",
  moveFailed: "That couldn't be moved.",
};

/** The booking drawer's words. The placeholders are samples; a panel gives its own. */
export interface MeetingWords {
  newTitle: string;
  title: string;
  what: string;
  whatPlaceholder: string;
  day: string;
  from: string;
  to: string;
  repeats: string;
  noRepeat: string;
  until: string;
  seriesOne: string;
  seriesMany: string;
  /** The rule of a series being changed. */
  seriesLine: string;
  scopeOne: string;
  scopeFollowing: string;
  scopeLabel: string;
  removeScopeLabel: string;
  who: string;
  clash: string;
  drive: string;
  driveFallback: string;
  away: string;
  someone: string;
  aboutNone: string;
  where: string;
  wherePlaceholder: string;
  travel: string;
  noTravel: string;
  travelBefore: string;
  company: string;
  companyPlaceholder: string;
  guest: string;
  guestPlaceholder: string;
  confirmed: string;
  statusConfirmed: string;
  statusTentative: string;
  notes: string;
  notesPlaceholder: string;
  saving: string;
  save: string;
  saveMany: string;
  book: string;
  bookMany: string;
  remove: string;
  removeOne: string;
  removeMany: string;
  removeBody: string;
  removeBodyMany: string;
  removeConfirm: string;
  removeFailed: string;
  bookedOne: string;
  bookedMany: string;
  savedOne: string;
  savedMany: string;
  removedOne: string;
  removedMany: string;
  /** The read view's "With …". */
  withWho: string;
}

export const MEETING_WORDS: MeetingWords = {
  newTitle: "New meeting",
  title: "Meeting",
  what: "What",
  whatPlaceholder: "Site visit",
  day: "Day",
  from: "From",
  to: "To",
  repeats: "Repeats",
  noRepeat: "Doesn't repeat",
  until: "Until",
  seriesOne: "Books one meeting, on {date}.",
  seriesMany: "Books {n} meetings, the last on {date}. The clash check looks at the first one.",
  seriesLine: "{rule}, until {date}",
  scopeOne: "Only this one",
  scopeFollowing: "This and the ones after",
  scopeLabel: "Which meetings this changes",
  removeScopeLabel: "Which meetings to remove",
  who: "Who is in it",
  clash: "{name} has another meeting then: {title} {when}.",
  drive: "{name} has no time to drive from {title} (ends {time}).",
  driveFallback: "the meeting before",
  away: "{name} is away then: {title}.",
  someone: "Someone",
  aboutNone: "None",
  where: "Where",
  wherePlaceholder: "Meeting room",
  travel: "Drive",
  noTravel: "No drive",
  travelBefore: "{n} min drive before",
  company: "With (company)",
  companyPlaceholder: "Company",
  guest: "Guest",
  guestPlaceholder: "Ana",
  confirmed: "Confirmed?",
  statusConfirmed: "Confirmed",
  statusTentative: "Not confirmed yet",
  notes: "Purpose",
  notesPlaceholder: "What the meeting is for, and what to bring",
  saving: "Saving…",
  save: "Save meeting",
  saveMany: "Save these meetings",
  book: "Book meeting",
  bookMany: "Book {n} meetings",
  remove: "Remove meeting",
  removeOne: "Remove this meeting?",
  removeMany: "Remove these meetings?",
  removeBody: "{title}, {date} at {time}. It leaves everyone's calendar.",
  removeBodyMany: "{title}, {date} at {time}, and every one after it. They leave everyone's calendar.",
  removeConfirm: "Remove",
  removeFailed: "That meeting couldn't be removed.",
  bookedOne: "Meeting booked",
  bookedMany: "{n} meetings booked",
  savedOne: "Meeting saved",
  savedMany: "{n} meetings saved",
  removedOne: "Meeting removed",
  removedMany: "{n} meetings removed",
  withWho: "With {names}",
};

/** The phone link's words. */
export interface FeedWords {
  button: string;
  buttonLine: string;
  title: string;
  lead: string;
  addApple: string;
  addGoogle: string;
  copyLabel: string;
  copy: string;
  copied: string;
  copyFailed: string;
  refreshNote: string;
  keepSecret: string;
  renew: string;
  renewTitle: string;
  renewBody: string;
  renewed: string;
  making: string;
}

export const FEED_WORDS: FeedWords = {
  button: "On your phone",
  buttonLine: "Everything here, in your phone’s calendar",
  title: "Your calendar on your phone",
  lead: "Everything here in your phone’s own calendar, beside the rest of your day, kept up to date by itself.",
  addApple: "Add to iPhone or Mac",
  addGoogle: "Add to Google Calendar",
  copyLabel: "Or copy the link into any calendar app",
  copy: "Copy",
  copied: "Link copied",
  copyFailed: "Copy it from the box instead",
  refreshNote: "An iPhone looks for changes about once an hour. Google Calendar can take up to a day.",
  keepSecret: "Keep this link to yourself: anyone who has it can see your calendar. If it gets out, make a new one and the old one stops working.",
  renew: "Make a new link",
  renewTitle: "Make a new link?",
  renewBody: "The calendars that use the old link stop updating. Add the new one to your phone again.",
  renewed: "New link made. Add it to your phone again.",
  making: "Making your link…",
};

/** Dates in words, each name through the translator: "Wednesday 14 October", "14 Oct", "Thu 15 Oct, 10:00". */
export function dateWords(t: Translate, clock: ClockSettings = {}) {
  const month = (day: string) => t(monthName(day));
  const weekdayName = (day: string, short = false) => t(dayName(day, short));
  const short = (day: string, withYear = true) => `${Number(day.slice(8, 10))} ${t(monthName(day).slice(0, 3))}${withYear ? ` ${day.slice(0, 4)}` : ""}`;
  return {
    month,
    weekday: weekdayName,
    short,
    long: (day: string) => `${weekdayName(day)} ${Number(day.slice(8, 10))} ${month(day)}`,
    /** "Thu 15 Oct, 10:00": when a moved item now starts. */
    when: (iso: string) => {
      const { day, minutes } = officeClock(iso, clock);
      return `${weekdayName(day, true)} ${short(day, false)}, ${hhmm(minutes)}`;
    },
  };
}

export type DateWords = ReturnType<typeof dateWords>;
