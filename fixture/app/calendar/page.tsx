import { officeMinutes, officeToday } from "@socialize/panel-kit/calendar-time";
import { readCalendarAddress } from "@socialize/panel-kit/calendar-views";
import { PageMeta } from "@socialize/panel-kit/page-header-context";
import { CalendarDemo } from "./calendar-demo";

// A server page, the way a calendar room is: it reads the view, the day and a
// search from the address, and today on the office's clock, once.
export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string; q?: string }> }) {
  const today = officeToday();
  const { view, date, q } = readCalendarAddress(await searchParams, today);
  return (
    <>
      <PageMeta title="Calendar" description="The fixture's calendar, every view wired" />
      <CalendarDemo view={view} date={date} q={q} today={today} nowMinutes={officeMinutes()} />
    </>
  );
}
