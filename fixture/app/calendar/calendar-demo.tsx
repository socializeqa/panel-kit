"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, ListChecks, TreePalm, Users } from "lucide-react";
import { Calendar } from "@socialize/panel-kit/calendar";
import type { CalendarSlot } from "@socialize/panel-kit/calendar-grid";
import { isTimed, type CalendarItem, type CalendarPerson } from "@socialize/panel-kit/calendar-layout";
import { addDays, officeMoment } from "@socialize/panel-kit/calendar-time";
import type { CalendarView } from "@socialize/panel-kit/calendar-views";
import { MeetingDrawer, type MeetingDraft, type MeetingOpen, type MeetingRecord } from "@socialize/panel-kit/meeting-drawer";
import { PhoneFeedButton, PhoneFeedDrawer, usePhoneFeed } from "@socialize/panel-kit/phone-feed";
import { useToast } from "@socialize/panel-kit/toast";

// The browser half of the calendar: items of four kinds (meetings, a task,
// time off, a team day), a clash, a drive that doesn't fit and someone
// booked while away, so every view and warning has something to draw. Moves,
// hand-overs and bookings answer ok after a beat and stay in the page, the
// way a server would keep them.

const PEOPLE: CalendarPerson[] = [
  { id: "ana", name: "Ana Lopes", colour: "#1d5f99", subtitle: "Manager" },
  { id: "omar", name: "Omar Farouk", colour: "#7a3e9d", subtitle: "Sales" },
  { id: "sara", name: "Sara Nasser", colour: "#1f7a3a", subtitle: "Office" },
];

const KINDS = [
  { kind: "meeting", label: "Meetings" },
  { kind: "task", label: "Tasks" },
  { kind: "leave", label: "Time off" },
  { kind: "team", label: "Team days" },
];

const ICONS = { meeting: Users, task: ListChecks, leave: TreePalm, team: CalendarCheck };

const wait = () => new Promise((done) => setTimeout(done, 300));

// Everything sits in the days from today, so whatever day the week starts on
// the week shows it all.
function sample(today: string): MeetingRecord[] {
  const day = (n: number) => addDays(today, n);
  const at = (n: number, time: string) => officeMoment(day(n), time);
  return [
    { id: "m1", title: "Site visit", start: at(1, "09:00"), end: at(1, "10:30"), people: ["ana", "omar"], location: "Meeting room", travelMinutes: 20, status: "confirmed" },
    { id: "m2", title: "Supplier call", start: at(1, "10:00"), end: at(1, "10:45"), people: ["ana"], status: "tentative" },
    { id: "m3", title: "Contract review", start: at(1, "11:00"), end: at(1, "12:00"), people: ["omar"], location: "Head office", travelMinutes: 45, status: "confirmed" },
    { id: "m4", title: "Weekly round-up", start: at(0, "14:00"), end: at(0, "15:00"), people: ["ana", "omar", "sara"], status: "confirmed", seriesId: "s1", repeat: "weekly", repeatUntil: day(84) },
    { id: "m5", title: "Interview", start: at(3, "13:00"), end: at(3, "14:00"), people: ["sara"], status: "confirmed" },
  ];
}

const asItem = (m: MeetingRecord): CalendarItem => ({
  id: m.id,
  kind: "meeting",
  title: m.title,
  start: m.start,
  end: m.end,
  people: m.people,
  location: m.location,
  travelMinutes: m.travelMinutes,
  status: m.status,
  editable: true,
  seriesId: m.seriesId,
  repeat: m.repeat,
});

export function CalendarDemo({ view, date, q, today, nowMinutes }: { view: CalendarView; date: string; q: string; today: string; nowMinutes: number }) {
  const toast = useToast();
  const [meetings, setMeetings] = useState<MeetingRecord[]>(() => sample(today));
  const [drawer, setDrawer] = useState<MeetingOpen | null>(null);
  const phone = usePhoneFeed(async () => {
    await wait();
    return { ok: true, url: "https://panel.example.org/ics/sample.ics" };
  });

  const items = useMemo<CalendarItem[]>(() => {
    const others: CalendarItem[] = [
      { id: "t1", kind: "task", title: "Send the quote", allDay: true, day: addDays(today, 2), people: ["omar"], editable: false, colour: "#a15c07" },
      { id: "l1", kind: "leave", title: "Annual leave", allDay: true, day: addDays(today, 3), endDay: addDays(today, 4), people: ["sara"], editable: false, away: true },
      { id: "d1", kind: "team", title: "Team day", allDay: true, day: addDays(today, 4), people: [], editable: false },
    ];
    const all = [...meetings.map(asItem), ...others];
    const term = q.toLowerCase();
    return term ? all.filter((i) => i.title.toLowerCase().includes(term)) : all;
  }, [meetings, today, q]);

  const save = async (draft: MeetingDraft) => {
    await wait();
    const record: MeetingRecord = { id: draft.id ?? `m${Date.now()}`, title: draft.title, start: draft.start, end: draft.end, people: draft.people, location: draft.location, travelMinutes: draft.travelMinutes, status: draft.status };
    setMeetings((cur) => (draft.id ? cur.map((m) => (m.id === draft.id ? { ...m, ...record } : m)) : [...cur, record]));
    return { ok: true as const };
  };

  return (
    <Calendar
      items={items}
      people={PEOPLE}
      view={view}
      date={date}
      today={today}
      nowMinutes={nowMinutes}
      query={q}
      kinds={KINDS}
      kindIcon={(kind) => ICONS[kind as keyof typeof ICONS]}
      permissions={{ canAdd: true, canEdit: true }}
      handOver
      onOpen={(item) => {
        const meeting = meetings.find((m) => m.id === item.id);
        if (meeting) setDrawer({ kind: "edit", meeting });
        else toast(`${item.title}, from its own room`, "info");
      }}
      onSlot={(slot: CalendarSlot) => setDrawer({ kind: "new", day: slot.day, from: slot.from, to: slot.to, people: slot.person ? [slot.person] : undefined })}
      onMove={async (item, move) => {
        await wait();
        if (!isTimed(item)) return { ok: false, error: "Only a timed item moves." };
        setMeetings((cur) =>
          cur.map((m) =>
            m.id === item.id
              ? { ...m, start: move.start, end: move.end, people: move.toPerson ? [...new Set(m.people.map((p) => (p === move.fromPerson ? move.toPerson! : p)))] : m.people }
              : m,
          ),
        );
      }}
      foot={<PhoneFeedButton onClick={phone.show} />}
    >
      <MeetingDrawer
        open={drawer}
        onClose={() => setDrawer(null)}
        people={PEOPLE}
        items={items}
        me="ana"
        adapter={{
          save,
          changeSeries: save,
          remove: async (id) => {
            await wait();
            setMeetings((cur) => cur.filter((m) => m.id !== id));
            return { ok: true, count: 1 };
          },
        }}
        about={{ label: "Client", options: [{ id: "c1", name: "Northwind" }] }}
        onDone={(message) => {
          setDrawer(null);
          toast(message, "success");
        }}
      />
      <PhoneFeedDrawer phone={phone} />
    </Calendar>
  );
}
