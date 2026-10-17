"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, Car, Clock, MapPin, Repeat as RepeatIcon, Trash2, Users } from "lucide-react";
import { ChoicePills } from "./choice-pills";
import { DateField } from "./date-field";
import { Drawer } from "./drawer";
import { Button, FormError, Input, Lbl, Select, Textarea } from "./fields";
import { initials } from "./initials";
import { ConfirmDialog } from "./modal";
import { usePanelT } from "./panel-provider";
import { TimeField } from "./time-field";
import { warnings, type CalendarItem, type CalendarPerson } from "./calendar-layout";
import { REPEATS, repeatLabel, seriesDays, seriesEnd, type Repeat } from "./calendar-repeat";
import { addDays, hhmm, minutesOf, officeClock, officeMoment, type ClockSettings } from "./calendar-time";
import { dateWords, MEETING_WORDS, type MeetingWords } from "./calendar-words";

// A meeting in a drawer: the form to book one (once, or repeating) or change
// it, and its details for someone who may only look. While the form is
// filled it says at once whose day it clashes with, where the drive doesn't
// fit and who is away. The kit holds the form; the app saves (the adapter),
// so the drawer imports no database and no server action.

/** A meeting as the drawer reads it. */
export type MeetingRecord = {
  id: string;
  title: string;
  start: string;
  end: string;
  people: string[];
  location?: string | null;
  travelMinutes?: number;
  status?: "confirmed" | "tentative" | "cancelled";
  /** The option picked in the `about` list (a client). */
  about?: string | null;
  company?: string | null;
  guest?: string | null;
  notes?: string | null;
  seriesId?: string | null;
  repeat?: Repeat | null;
  repeatUntil?: string | null;
};

/** Which meetings of a series a change or a removal reaches. */
export type SeriesScope = "one" | "following";

/** The form as the app receives it: the office's clock as typed, and the same as moments. */
export type MeetingDraft = {
  /** The meeting being changed; null for a new one. */
  id: string | null;
  title: string;
  day: string;
  /** "HH:MM" on the office's clock. */
  from: string;
  to: string;
  start: string;
  end: string;
  people: string[];
  location: string | null;
  travelMinutes: number;
  status: "confirmed" | "tentative";
  /** A new meeting's rule and its last day; null when it doesn't repeat. */
  repeat: Repeat | null;
  until: string | null;
  scope: SeriesScope;
  about: string | null;
  company: string | null;
  guest: string | null;
  notes: string | null;
};

export type MeetingResult = { ok: true; count?: number } | { ok: false; error: string };

/** How the drawer's writes reach the app. */
export interface MeetingAdapter {
  /** Book a new meeting (every one of a series, when it repeats) or save a change to one. */
  save(draft: MeetingDraft): Promise<MeetingResult>;
  /** Save a change to a meeting of a series and every one after it. Without it a change reaches only the one. */
  changeSeries?(draft: MeetingDraft): Promise<MeetingResult>;
  /** Take a meeting off the calendar, or it and the rest of its series. Without it there is no remove. */
  remove?(id: string, scope: SeriesScope): Promise<MeetingResult>;
}

/** What opens the drawer: a slot to book (from the grid, the month or a button), or a meeting. */
export type MeetingOpen = { kind: "new"; day: string; from: number; to?: number; people?: string[] } | { kind: "edit"; meeting: MeetingRecord };

/** The fields a panel's meetings carry beyond the time and the people. All on by default. */
export type MeetingFields = { location?: boolean; travel?: boolean; company?: boolean; guest?: boolean; status?: boolean; notes?: boolean; repeat?: boolean };

const TRAVEL = [0, 10, 15, 20, 30, 45, 60, 90];

type Shared = {
  people: CalendarPerson[];
  about?: { label: string; options: { id: string; name: string }[] };
  fields: Required<MeetingFields>;
  w: MeetingWords;
  clock: ClockSettings;
  hours: { from: number; to: number };
};

export function MeetingDrawer({
  open,
  onClose,
  people,
  items,
  me,
  adapter,
  canEdit = true,
  canRemove = true,
  about,
  fields,
  words,
  clock = {},
  hours = { from: 6, to: 24 },
  onDone,
}: {
  open: MeetingOpen | null;
  onClose: () => void;
  /** Who can be in a meeting. */
  people: CalendarPerson[];
  /** What else is on the calendar, for the live clash check. */
  items: CalendarItem[];
  /** The person booking: a new meeting starts with them in it. */
  me?: string;
  adapter: MeetingAdapter;
  /** May this person change meetings? Without it the drawer shows the details only. */
  canEdit?: boolean;
  canRemove?: boolean;
  /** A list to say what a meeting is about (the clients), with its label. Left out, or empty, there is none. */
  about?: { label: string; options: { id: string; name: string }[] };
  fields?: MeetingFields;
  words?: Partial<MeetingWords>;
  clock?: ClockSettings;
  /** The clock's window in the time fields, in whole hours. */
  hours?: { from: number; to: number };
  /** After a save or a removal, with what to tell the person. */
  onDone: (message: string) => void;
}) {
  const t = usePanelT();
  const w = { ...MEETING_WORDS, ...words };
  const editing = open?.kind === "edit" ? open.meeting : null;
  const shared: Shared = {
    people,
    about,
    fields: { location: true, travel: true, company: true, guest: true, status: true, notes: true, repeat: true, ...fields },
    w,
    clock,
    hours,
  };
  const title = open ? (editing ? editing.title : t(w.newTitle)) : t(w.title);
  return (
    <Drawer open={open !== null} onOpenChange={(next) => !next && onClose()} title={title} size="form">
      {open ? (
        editing && !canEdit ? (
          <Details meeting={editing} {...shared} />
        ) : (
          <MeetingForm
            key={editing?.id ?? (open.kind === "new" ? `new-${open.day}-${open.from}-${open.to ?? ""}-${open.people?.join() ?? ""}` : "")}
            open={open}
            items={items}
            me={me}
            adapter={adapter}
            canRemove={canRemove && Boolean(adapter.remove)}
            onDone={onDone}
            {...shared}
          />
        )
      ) : null}
    </Drawer>
  );
}

const text = (form: FormData, key: string) => {
  const value = String(form.get(key) ?? "").trim();
  return value || null;
};

function MeetingForm({
  open,
  items,
  me,
  adapter,
  canRemove,
  onDone,
  people,
  about,
  fields,
  w,
  clock,
  hours,
}: Shared & {
  open: MeetingOpen;
  items: CalendarItem[];
  me?: string;
  adapter: MeetingAdapter;
  canRemove: boolean;
  onDone: (message: string) => void;
}) {
  const t = usePanelT();
  const say = dateWords(t, clock);
  const meeting = open.kind === "edit" ? open.meeting : null;
  const start = meeting ? officeClock(meeting.start, clock) : { day: open.kind === "new" ? open.day : "", minutes: open.kind === "new" ? open.from : 540 };
  const end = meeting ? officeClock(meeting.end, clock) : { day: start.day, minutes: open.kind === "new" && open.to ? open.to : start.minutes + 60 };
  const latest = hours.to * 60 - 15;
  const startPeople = meeting?.people ?? (open.kind === "new" && open.people?.length ? open.people : me && people.some((p) => p.id === me) ? [me] : []);

  const [day, setDay] = useState(start.day);
  const [from, setFrom] = useState(hhmm(start.minutes));
  const [to, setTo] = useState(hhmm(Math.min(end.minutes, latest)));
  const [who, setWho] = useState<string[]>(startPeople);
  const [travel, setTravel] = useState(String(meeting?.travelMinutes ?? 0));
  const [repeat, setRepeat] = useState<Repeat | "">("");
  const [until, setUntil] = useState("");
  const [scope, setScope] = useState<SeriesScope>("one");
  const [confirming, setConfirming] = useState(false);
  const [removeScope, setRemoveScope] = useState<SeriesScope>("one");
  const [removing, startRemove] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);
  const inSeries = Boolean(meeting?.seriesId && meeting.repeat);

  const [result, formAction, pending] = useActionState<{ done: MeetingResult; following: boolean } | null, FormData>(async (_, form) => {
    const draft: MeetingDraft = {
      id: meeting?.id ?? null,
      title: text(form, "title") ?? "",
      day,
      from,
      to,
      start: day && from ? officeMoment(day, from, clock) : "",
      end: day && to ? officeMoment(day, to, clock) : "",
      people: who,
      location: text(form, "location"),
      travelMinutes: Number(travel) || 0,
      status: form.get("status") === "tentative" ? "tentative" : "confirmed",
      repeat: !meeting && repeat ? repeat : null,
      until: !meeting && repeat ? until || null : null,
      scope: inSeries ? scope : "one",
      about: text(form, "about"),
      company: text(form, "company"),
      guest: text(form, "guest"),
      notes: text(form, "notes"),
    };
    const following = draft.scope === "following" && Boolean(adapter.changeSeries);
    return { done: await (following ? adapter.changeSeries!(draft) : adapter.save(draft)), following };
  }, null);

  useEffect(() => {
    if (!result?.done.ok) return;
    const n = result.done.count ?? 1;
    if (meeting) onDone(n === 1 ? t(w.savedOne) : t(w.savedMany, { n }));
    else onDone(n === 1 ? t(w.bookedOne) : t(w.bookedMany, { n }));
    // The words and the translator are steady; the result is what moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, meeting, onDone]);

  // Changing the start keeps the meeting's length.
  const moveFrom = (next: string) => {
    if (!next) return setFrom(next);
    const length = minutesOf(to) - minutesOf(from);
    setFrom(next);
    if (length > 0) setTo(hhmm(Math.min(latest, minutesOf(next) + length)));
  };

  // The days a new repeating meeting will be booked on, as the form stands.
  const series = useMemo(() => (repeat && day && until && until >= day ? seriesDays(day, repeat, until, clock) : []), [repeat, day, until, clock]);

  // What this meeting would run into, as the form stands.
  const clashes = useMemo(() => {
    if (!day || !from || !to || to <= from || !who.length) return [];
    const draft: CalendarItem = {
      id: meeting?.id ?? "draft",
      kind: "meeting",
      title: "",
      start: officeMoment(day, from, clock),
      end: officeMoment(day, to, clock),
      people: who,
      travelMinutes: Number(travel),
      editable: true,
    };
    const others = items.filter((i) => i.id !== draft.id);
    return warnings([...others, draft], clock).filter((x) => x.itemId === draft.id);
  }, [day, from, to, who, travel, items, meeting?.id, clock]);

  const byId = new Map(items.map((i) => [i.id, i]));
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name.split(" ")[0] ?? t(w.someone);
  const timeOf = (iso: string) => hhmm(officeClock(iso, clock).minutes);
  const offerFollowing = inSeries && Boolean(adapter.changeSeries);
  const scopes = [
    { value: "one", label: w.scopeOne },
    { value: "following", label: w.scopeFollowing },
  ];
  const error = result && !result.done.ok ? result.done.error : removeError;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {inSeries ? (
        <div className="cal-series">
          <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
            <RepeatIcon className="size-4 text-quiet" strokeWidth={2} />
            {t(w.seriesLine, { rule: t(repeatLabel(meeting!.repeat!, officeClock(meeting!.start, clock).day, clock)), date: meeting!.repeatUntil ? say.long(meeting!.repeatUntil) : "" })}
          </p>
          {offerFollowing ? <ChoicePills name="scope" options={scopes} value={scope} onChange={(v) => setScope((v || "one") as SeriesScope)} ariaLabel={w.scopeLabel} /> : null}
        </div>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <Lbl>{t(w.what)}</Lbl>
        <Input name="title" defaultValue={meeting?.title ?? ""} placeholder={t(w.whatPlaceholder)} required autoFocus={!meeting} maxLength={160} />
      </label>

      <label className="flex flex-col gap-1.5">
        <Lbl>{t(w.day)}</Lbl>
        <DateField name="day" value={day} onChange={setDay} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <Lbl>{t(w.from)}</Lbl>
          <TimeField name="from" value={from} onValueChange={moveFrom} hours={{ from: hours.from, to: hours.to - 1 }} />
        </label>
        <label className="flex flex-col gap-1.5">
          <Lbl>{t(w.to)}</Lbl>
          <TimeField name="to" value={to} onValueChange={setTo} hours={hours} />
        </label>
      </div>

      {!meeting && fields.repeat ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <Lbl>{t(w.repeats)}</Lbl>
            <Select
              name="repeat"
              value={repeat}
              onChange={(e) => {
                const next = e.target.value as Repeat | "";
                setRepeat(next);
                if (next && !until) setUntil(addDays(day, 91));
              }}
              options={[{ value: "", label: t(w.noRepeat) }, ...REPEATS.map((r) => ({ value: r, label: t(repeatLabel(r, day || start.day, clock)) }))]}
            />
          </label>
          {repeat ? (
            <label className="flex flex-col gap-1.5">
              <Lbl>{t(w.until)}</Lbl>
              <DateField name="until" value={until} onChange={setUntil} min={day} max={day ? seriesEnd(day) : undefined} />
            </label>
          ) : null}
          {repeat && series.length ? (
            <p className="text-[13px] text-quiet sm:col-span-2">
              {(() => {
                const last = series.at(-1)!;
                const date = `${say.long(last)}${last.slice(0, 4) !== day.slice(0, 4) ? ` ${last.slice(0, 4)}` : ""}`;
                return series.length === 1 ? t(w.seriesOne, { date }) : t(w.seriesMany, { n: series.length, date });
              })()}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Lbl>{t(w.who)}</Lbl>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t(w.who)}>
          {people.map((p) => {
            const on = who.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                onClick={() => setWho((cur) => (on ? cur.filter((x) => x !== p.id) : [...cur, p.id]))}
                className="cal-person"
                style={{ "--c": p.colour ?? "var(--brand)" } as React.CSSProperties}
              >
                <span className="cal-avatar">{initials(p.name)}</span>
                {p.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {clashes.length ? (
        <div className="cal-clash" role="status">
          <AlertTriangle className="size-4 shrink-0" strokeWidth={2.2} />
          <div className="flex flex-col gap-0.5">
            {clashes.map((c, i) => {
              const other = byId.get(c.otherId);
              const name = nameOf(c.person);
              const timed = other && !other.allDay ? other : null;
              if (c.kind === "away") return <span key={i}>{t(w.away, { name, title: other?.title ?? "" })}</span>;
              if (c.kind === "clash") return <span key={i}>{t(w.clash, { name, title: other?.title ?? "", when: timed ? `${timeOf(timed.start)}–${timeOf(timed.end)}` : "" })}</span>;
              return <span key={i}>{t(w.drive, { name, title: other?.title ?? t(w.driveFallback), time: timed ? timeOf(timed.end) : "" })}</span>;
            })}
          </div>
        </div>
      ) : null}

      {about?.options.length ? (
        <label className="flex flex-col gap-1.5">
          <Lbl>{t(about.label)}</Lbl>
          <Select name="about" defaultValue={meeting?.about ?? ""} options={[{ value: "", label: t(w.aboutNone) }, ...about.options.map((o) => ({ value: o.id, label: o.name }))]} />
        </label>
      ) : null}

      {fields.location || fields.travel || fields.company || fields.guest ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.location ? (
            <label className="flex flex-col gap-1.5">
              <Lbl>{t(w.where)}</Lbl>
              <Input name="location" defaultValue={meeting?.location ?? ""} placeholder={t(w.wherePlaceholder)} maxLength={300} />
            </label>
          ) : null}
          {fields.travel ? (
            <label className="flex flex-col gap-1.5">
              <Lbl>{t(w.travel)}</Lbl>
              <Select
                name="travel"
                value={travel}
                onChange={(e) => setTravel(e.target.value)}
                options={TRAVEL.map((m) => ({ value: String(m), label: m ? t(w.travelBefore, { n: m }) : t(w.noTravel) }))}
              />
            </label>
          ) : null}
          {fields.company ? (
            <label className="flex flex-col gap-1.5">
              <Lbl>{t(w.company)}</Lbl>
              <Input name="company" defaultValue={meeting?.company ?? ""} placeholder={t(w.companyPlaceholder)} maxLength={300} />
            </label>
          ) : null}
          {fields.guest ? (
            <label className="flex flex-col gap-1.5">
              <Lbl>{t(w.guest)}</Lbl>
              <Input name="guest" defaultValue={meeting?.guest ?? ""} placeholder={t(w.guestPlaceholder)} maxLength={300} />
            </label>
          ) : null}
        </div>
      ) : null}

      {fields.status ? (
        <div className="flex flex-col gap-1.5">
          <Lbl>{t(w.confirmed)}</Lbl>
          <ChoicePills
            name="status"
            options={[
              { value: "confirmed", label: w.statusConfirmed },
              { value: "tentative", label: w.statusTentative },
            ]}
            defaultValue={meeting?.status === "tentative" ? "tentative" : "confirmed"}
            ariaLabel={w.confirmed}
          />
        </div>
      ) : null}

      {fields.notes ? (
        <label className="flex flex-col gap-1.5">
          <Lbl>{t(w.notes)}</Lbl>
          <Textarea name="notes" defaultValue={meeting?.notes ?? ""} rows={3} placeholder={t(w.notesPlaceholder)} maxLength={2000} />
        </label>
      ) : null}

      <FormError error={error} />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="h-11 flex-1">
          {pending
            ? t(w.saving)
            : meeting
              ? t(offerFollowing && scope === "following" ? w.saveMany : w.save)
              : series.length > 1
                ? t(w.bookMany, { n: series.length })
                : t(w.book)}
        </Button>
        {meeting && canRemove ? (
          <Button type="button" variant="danger" className="h-11 px-4" onClick={() => setConfirming(true)} aria-label={t(w.remove)}>
            <Trash2 className="size-4" strokeWidth={2} />
          </Button>
        ) : null}
      </div>

      {meeting && canRemove ? (
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          title={inSeries && removeScope === "following" ? w.removeMany : w.removeOne}
          body={t(inSeries && removeScope === "following" ? w.removeBodyMany : w.removeBody, {
            title: meeting.title,
            date: say.long(officeClock(meeting.start, clock).day),
            time: timeOf(meeting.start),
          })}
          confirmLabel={w.removeConfirm}
          pending={removing}
          onConfirm={() =>
            startRemove(async () => {
              const out = await adapter.remove!(meeting.id, inSeries ? removeScope : "one");
              setConfirming(false);
              if (out.ok) {
                const n = out.count ?? 1;
                onDone(n === 1 ? t(w.removedOne) : t(w.removedMany, { n }));
              } else setRemoveError(out.error || t(w.removeFailed));
            })
          }
        >
          {inSeries ? (
            <ChoicePills options={scopes} value={removeScope} onChange={(v) => setRemoveScope((v || "one") as SeriesScope)} ariaLabel={w.removeScopeLabel} />
          ) : null}
        </ConfirmDialog>
      ) : null}
    </form>
  );
}

/** A meeting for someone who may only look. */
function Details({ meeting, people, about, w, clock }: Shared & { meeting: MeetingRecord }) {
  const t = usePanelT();
  const say = dateWords(t, clock);
  const start = officeClock(meeting.start, clock);
  const end = officeClock(meeting.end, clock);
  const rows: [React.ReactNode, string | null][] = [
    [<Clock key="c" className="size-4" />, `${say.long(start.day)}, ${hhmm(start.minutes)}–${hhmm(end.minutes)}`],
    [
      <RepeatIcon key="r" className="size-4" />,
      meeting.repeat && meeting.repeatUntil ? t(w.seriesLine, { rule: t(repeatLabel(meeting.repeat, start.day, clock)), date: say.long(meeting.repeatUntil) }) : null,
    ],
    [<MapPin key="m" className="size-4" />, meeting.location ?? null],
    [<Car key="d" className="size-4" />, meeting.travelMinutes ? t(w.travelBefore, { n: meeting.travelMinutes }) : null],
    [<Users key="u" className="size-4" />, meeting.people.map((id) => people.find((p) => p.id === id)?.name).filter(Boolean).join(", ") || null],
  ];
  const withWho = [about?.options.find((o) => o.id === meeting.about)?.name, meeting.company, meeting.guest].filter(Boolean).join(", ");
  return (
    <div className="flex flex-col gap-3 text-[14px] text-ink">
      {rows
        .filter(([, line]) => line)
        .map(([icon, line], i) => (
          <p key={i} className="flex items-start gap-2.5">
            <span className="mt-0.5 text-quiet">{icon}</span>
            {line}
          </p>
        ))}
      {withWho ? <p className="text-quiet">{t(w.withWho, { names: withWho })}</p> : null}
      {meeting.notes ? <p className="whitespace-pre-line">{meeting.notes}</p> : null}
    </div>
  );
}
