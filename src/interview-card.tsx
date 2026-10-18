"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CalendarX2, Check, UserRoundCheck, UserRoundX } from "lucide-react";
import type { ActionResult } from "./action-result";
import { DEFAULT_CLOCK, hhmm, longDate, officeClock, officeToday, type ClockSettings } from "./calendar-time";
import { ChoicePills } from "./choice-pills";
import { DateField } from "./date-field";
import { DecisionItem } from "./decision-bar";
import { Button, Field, FieldGroup } from "./fields";
import { Hint } from "./hint";
import { INTERVIEW_LENGTHS, lengthLabel } from "./hiring-words";
import { ConfirmDialog } from "./modal";
import { usePanelT } from "./panel-provider";
import { Section } from "./record-fields";
import { RowMenu } from "./row-menu";
import { Chip } from "./status-badge";
import { TimeField } from "./time-field";
import { useToast } from "./toast";

/** An interview booked with a candidate, as the file shows it. */
export interface BookedInterview {
  /** ISO moments. */
  startsAt: string;
  endsAt: string;
  where?: string | null;
  /** Who sits in it, in words: "Damine and Hussain". */
  withWhom?: string | null;
  /** They said yes (a tap on the invitation, or the office marked it). */
  confirmed: boolean;
}

// The interview booked with a candidate, under where they stand: the day and
// the hours on the office's clock, where, with whom, and whether they said
// yes. Before it, the office marks their yes, moves it or calls it off; each
// is the app's to tell them (the kit only says so). Once it is over and the
// file has not moved on, it asks how it went. The move form opens in place
// and holds the day, the time and the length; nothing moves until Move it.
export function InterviewCard({
  interview,
  name,
  canManage,
  clock = DEFAULT_CLOCK,
  hours = { from: 8, to: 20 },
  askOutcome = false,
  told,
  movedNote = "They get the new time by email, and the invitation in their calendar moves with it.",
  cancelNote = "They get an email that it is off, and it leaves their calendar and ours.",
  onMove,
  onCancel,
  onConfirmed,
  onOutcome,
}: {
  interview: BookedInterview;
  /** The candidate, for the questions. */
  name: string;
  canManage: boolean;
  clock?: ClockSettings;
  /** The clock's window for a new time. */
  hours?: { from: number; to: number };
  /** It is over and the file still waits on it: ask whether they came. */
  askOutcome?: boolean;
  /** A quiet line on what they were told and how ("Invited by email and WhatsApp, 18 Oct"). */
  told?: string;
  movedNote?: string;
  cancelNote?: string;
  onMove: (day: string, time: string, minutes: number) => Promise<ActionResult>;
  /** `line` is the office's own words for them, when it gives any. */
  onCancel: (line?: string) => Promise<ActionResult>;
  onConfirmed?: () => Promise<ActionResult>;
  /** Whether they came: true moves the file on, false notes that they did not. */
  onOutcome?: (came: boolean) => Promise<ActionResult>;
}) {
  const t = usePanelT();
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const at = officeClock(interview.startsAt, clock);
  const end = officeClock(interview.endsAt, clock);
  const minutes = Math.max(5, Math.round((new Date(interview.endsAt).getTime() - new Date(interview.startsAt).getTime()) / 60_000));
  const [moving, setMoving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [day, setDay] = useState(at.day);
  const [time, setTime] = useState(hhmm(at.minutes));
  const [length, setLength] = useState(String(minutes));
  const lengths = [...new Set<number>([...INTERVIEW_LENGTHS, minutes])].sort((a, b) => a - b);

  const run = (act: () => Promise<ActionResult>, done: string, after?: () => void) =>
    start(async () => {
      const res = await act();
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      after?.();
      toast(done);
      router.refresh();
    });

  const openMove = () => {
    setDay(at.day);
    setTime(hhmm(at.minutes));
    setLength(String(minutes));
    setMoving(true);
  };
  const unchanged = day === at.day && time === hhmm(at.minutes) && Number(length) === minutes;

  const status = interview.confirmed ? (
    <Chip dot="bg-ok">{t("Confirmed")}</Chip>
  ) : (
    <Chip dot="bg-warn">{t("Waiting for their yes")}</Chip>
  );

  return (
    <Section plain title="The interview" subtitle={told} action={status}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{t(longDate(at.day))}</p>
        <p className="text-[14px] font-medium tabular-nums text-ink/70" dir="ltr">
          {hhmm(at.minutes)}–{hhmm(end.minutes)}
        </p>
      </div>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-[11px] font-medium text-quiet">{t("Where")}</dt>
          <dd className="mt-0.5 truncate text-[14px] font-medium text-ink">{interview.where || <span className="text-quiet">{t("Not set")}</span>}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium text-quiet">{t("With")}</dt>
          <dd className="mt-0.5 truncate text-[14px] font-medium text-ink">{interview.withWhom || <span className="text-quiet">{t("Not set")}</span>}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-medium text-quiet">{t("Length")}</dt>
          <dd className="mt-0.5 text-[14px] font-medium tabular-nums text-ink">{t(lengthLabel(minutes))}</dd>
        </div>
      </dl>

      {askOutcome && canManage && onOutcome ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/[0.07] pt-4">
          <p className="text-[13px] font-medium text-ink">{t("It is over. Did {name} come?", { name })}</p>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => run(() => onOutcome(false), t("Noted: {name} did not come", { name }))} disabled={pending}>
              <UserRoundX size={14} strokeWidth={2} aria-hidden="true" /> {t("Didn't come")}
            </Button>
            <Button type="button" size="sm" onClick={() => run(() => onOutcome(true), t("{name}: interviewed", { name }))} disabled={pending}>
              <UserRoundCheck size={14} strokeWidth={2} aria-hidden="true" /> {t("They came")}
            </Button>
          </div>
        </div>
      ) : null}

      {canManage && !askOutcome && !moving ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink/[0.07] pt-4">
          <RowMenu label="More about the interview">
            <DecisionItem danger onClick={() => setCancelling(true)} disabled={pending}>
              <CalendarX2 size={15} strokeWidth={2} aria-hidden="true" /> {t("Cancel the interview")}
            </DecisionItem>
          </RowMenu>
          {!interview.confirmed && onConfirmed ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => run(onConfirmed, t("{name} confirmed", { name }))} disabled={pending}>
              <Check size={14} strokeWidth={2} aria-hidden="true" /> {t("They confirmed")}
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="ghost" onClick={openMove} disabled={pending}>
            <CalendarClock size={14} strokeWidth={2} aria-hidden="true" /> {t("Move it")}
          </Button>
        </div>
      ) : null}

      {moving ? (
        <div className="flex flex-col gap-3 border-t border-ink/[0.07] pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Day" htmlFor="interview-day">
              <DateField id="interview-day" value={day} onChange={setDay} min={officeToday(clock)} />
            </Field>
            <Field label="Time" htmlFor="interview-time">
              <TimeField id="interview-time" value={time} onValueChange={setTime} hours={hours} />
            </Field>
          </div>
          <FieldGroup label="Length">
            <ChoicePills wrap ariaLabel={t("Length")} value={length} onChange={(v) => v && setLength(v)} options={lengths.map((n) => ({ value: String(n), label: lengthLabel(n) }))} />
          </FieldGroup>
          <Hint>{movedNote}</Hint>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setMoving(false)} disabled={pending}>
              {t("Keep it as it is")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => run(() => onMove(day, time, Number(length)), t("Interview moved"), () => setMoving(false))}
              disabled={pending || unchanged || !day || !time}
            >
              <CalendarClock size={14} strokeWidth={2} aria-hidden="true" /> {t("Move it")}
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={cancelling}
        onClose={() => setCancelling(false)}
        onConfirm={(line) => run(() => onCancel(line.trim() || undefined), t("Interview cancelled"), () => setCancelling(false))}
        kicker="Before you cancel"
        title={t("Cancel the interview with {name}?", { name })}
        body={t(cancelNote)}
        reason={{ label: "A line for them", placeholder: "Optional: we will write with another time", required: false }}
        confirmLabel="Cancel the interview"
        cancelLabel="Keep it"
        confirmIcon={CalendarX2}
        pendingLabel="Cancelling…"
        tone="danger"
        pending={pending}
      />
    </Section>
  );
}
