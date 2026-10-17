"use client";

import { createContext, useContext } from "react";
import type { LucideIcon } from "lucide-react";
import type { CalendarItem, CalendarWarning } from "./calendar-layout";
import type { ClockSettings } from "./calendar-time";
import type { CalendarView } from "./calendar-views";
import type { CalendarWords, DateWords } from "./calendar-words";
import type { Translate } from "./panel-provider";

// What the calendar's pieces share, set once by <Calendar>: the words, the
// clock, the addresses, the colours and names, the warnings and the way an
// item opens. The views read it instead of passing ten props down each.

export interface CalendarShared {
  t: Translate;
  /** The words, the app's over the kit's. */
  w: CalendarWords;
  say: DateWords;
  clock: ClockSettings;
  href: (view: CalendarView, date: string, q?: string) => string;
  /** The colour an item wears: its own, its first person's, or the brand. */
  colourOf: (item: CalendarItem) => string;
  personColour: (id: string) => string;
  /** A person's name, and their first name. */
  nameOf: (id: string) => string;
  firstName: (id: string) => string;
  warned: Map<string, CalendarWarning[]>;
  kindIcon?: (kind: string) => LucideIcon | null | undefined;
  onOpen: (item: CalendarItem) => void;
}

export const CalendarContext = createContext<CalendarShared | null>(null);

export function useCalendar(): CalendarShared {
  const shared = useContext(CalendarContext);
  if (!shared) throw new Error("A calendar piece was drawn outside <Calendar>.");
  return shared;
}
