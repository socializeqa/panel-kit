"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Mail, Send } from "lucide-react";
import type { ActionResult } from "./action-result";
import { ChoicePills } from "./choice-pills";
import { ROOM_COLUMN } from "./classes";
import { DateField } from "./date-field";
import { DirtyExempt } from "./drawer";
import { Button, Field, FieldGroup, Input, Textarea } from "./fields";
import { todayIso } from "./format";
import { Hint } from "./hint";
import {
  letterForFile,
  letterGate,
  readDraft,
  sayList,
  startDetails,
  type HiringWords,
  type LetterDetails,
  type LetterDraft,
  type LetterFields,
} from "./hiring-words";
import { ConfirmDialog } from "./modal";
import { usePanel } from "./panel-provider";
import { Section } from "./record-fields";
import { SentLetters, type SentLetter } from "./sent-letters";
import { TimeField } from "./time-field";
import { useToast } from "./toast";

/** What a preview answers: the letter exactly as it would arrive, or why it can't be shown. */
export type LetterPreview = { ok: true; subject: string; html: string } | { ok: false; error: string };

// A draft is kept in the tab (sessionStorage), per candidate, so switching to
// another room of the file and back, or closing the drawer, loses nothing. It
// goes once the letter is sent. Storage can be blocked (a private window), so
// every read and write is allowed to fail: the letter just starts over.
function keep(key: string, draft: LetterDraft | null) {
  try {
    if (draft) sessionStorage.setItem(key, JSON.stringify(draft));
    else sessionStorage.removeItem(key);
  } catch {
    // Blocked storage keeps nothing.
  }
}
function kept(key: string, words: HiringWords): LetterDraft | null {
  try {
    return readDraft(sessionStorage.getItem(key), words);
  } catch {
    return null;
  }
}

// Writing to a candidate: pick the letter (the one their stage sends comes
// first), fill only what that letter carries (an interview its day and place,
// an offer its start and salary), preview it exactly as it will arrive, then
// send it behind a question. The send stays shut while the letter still needs
// something (letterNeeds, in the app's words) or the panel's mail is not set
// up. Writing is a draft, not the file's unsaved work: it lights no Save and
// closing the drawer does not ask about it.
export function LetterComposer({
  words,
  fields,
  stage,
  name,
  email,
  language,
  draftKey,
  canSend,
  mailReady = true,
  notReady = "Letters can be written and previewed now. Sending opens once the panel's email is set up.",
  subtitle,
  sent = [],
  hours = { from: 8, to: 20 },
  onPreview,
  onSend,
}: {
  words: HiringWords;
  /** What each letter asks for (standardLetterFields, or the app's own). */
  fields: LetterFields;
  /** The candidate's stage, which picks the letter a fresh draft opens on. */
  stage: string;
  name: string;
  email: string;
  /** The language their letters go out in, as its name ("French"). */
  language?: string;
  /** Where the draft is kept in the tab: one key per candidate (`letter:<id>`). */
  draftKey: string;
  canSend: boolean;
  /** Whether the panel's mail is set up; until it is, letters are written and previewed only. */
  mailReady?: boolean;
  notReady?: string;
  /** The line under the heading; "By email to … in …" when left out. */
  subtitle?: string;
  /** What went already, newest first. */
  sent?: SentLetter[];
  /** The clock's window for an interview time. */
  hours?: { from: number; to: number };
  onPreview?: (letter: string, details: LetterDetails) => Promise<LetterPreview>;
  onSend: (letter: string, details: LetterDetails) => Promise<ActionResult>;
}) {
  const { t, timeZone } = usePanel();
  const router = useRouter();
  const toast = useToast();
  // Read once, on the first draw. The letters room mounts when it is opened,
  // in the browser, so the kept draft is there to read.
  const [draft, setDraft] = useState<LetterDraft>(() => {
    const was = typeof window === "undefined" ? null : kept(draftKey, words);
    if (was) return was;
    const letter = letterForFile(words, stage);
    return { letter, details: startDetails(fields, letter) };
  });
  const { letter, details } = draft;
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => keep(draftKey, draft), [draftKey, draft]);

  const { missing, sendable } = letterGate(words, letter, details, { canSend, mailReady });
  const letterName = t(words.letters.find((l) => l.value === letter)?.label ?? letter);

  // Any change and the preview goes: it never shows a version that would not be sent.
  const write = (key: string, value: string) => {
    setDraft((d) => ({ ...d, details: { ...d.details, [key]: value } }));
    setPreview(null);
  };
  const pick = (next: string) => {
    setDraft({ letter: next, details: startDetails(fields, next) });
    setPreview(null);
  };

  const show = () => {
    if (!onPreview) return;
    start(async () => {
      const res = await onPreview(letter, details);
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      setPreview({ subject: res.subject, html: res.html });
    });
  };

  const send = () =>
    start(async () => {
      const res = await onSend(letter, details);
      setConfirming(false);
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      toast(t("{letter} sent to {name}", { letter: letterName, name }));
      keep(draftKey, null);
      setDraft({ letter, details: startDetails(fields, letter) });
      setPreview(null);
      router.refresh();
    });

  const today = todayIso(timeZone);

  return (
    <DirtyExempt>
      <div data-dirty-exempt className={ROOM_COLUMN}>
        <SentLetters sent={sent} />
        <Section
          icon={<Mail size={15} strokeWidth={2} aria-hidden="true" />}
          title="Write to them"
          subtitle={
            subtitle ??
            (language ? t("By email to {email}, in {language}", { email, language: t(language) }) : t("By email to {email}", { email }))
          }
        >
          <FieldGroup label="Letter">
            <ChoicePills
              wrap
              ariaLabel="Letter"
              value={letter}
              onChange={(v) => v && pick(v)}
              options={words.letters.map((l) => ({ value: l.value, label: l.label }))}
            />
          </FieldGroup>
          {(fields[letter] ?? []).map((f) => {
            const id = `letter-${f.key}`;
            const value = details[f.key] ?? "";
            const placeholder = f.placeholder ? t(f.placeholder) : undefined;
            return (
              <Field key={f.key} label={f.label} htmlFor={id}>
                {f.kind === "day" ? (
                  <DateField id={id} value={value} onChange={(v) => write(f.key, v)} min={today} />
                ) : f.kind === "time" ? (
                  <TimeField id={id} value={value} onValueChange={(v) => write(f.key, v)} hours={hours} />
                ) : f.kind === "long" ? (
                  <Textarea id={id} rows={4} placeholder={placeholder} value={value} onChange={(e) => write(f.key, e.target.value)} />
                ) : (
                  <Input id={id} placeholder={placeholder} value={value} onChange={(e) => write(f.key, e.target.value)} />
                )}
              </Field>
            );
          })}
          {missing.length ? <Hint>{t("It still needs {things}.", { things: sayList(missing.map((m) => t(m)), t("and")) })}</Hint> : null}
          {!mailReady ? <Hint>{t(notReady)}</Hint> : null}
          <div className="flex flex-wrap gap-2">
            {onPreview ? (
              <Button type="button" size="sm" variant="ghost" onClick={show} disabled={pending}>
                <Eye size={14} strokeWidth={2} aria-hidden="true" /> {t("Preview")}
              </Button>
            ) : null}
            {canSend ? (
              <Button type="button" size="sm" onClick={() => setConfirming(true)} disabled={pending || !sendable}>
                <Send size={14} strokeWidth={2} aria-hidden="true" /> {t("Send")}
              </Button>
            ) : null}
          </div>
        </Section>

        {preview ? (
          <Section icon={<Eye size={15} strokeWidth={2} aria-hidden="true" />} title={preview.subject} subtitle="Exactly what they would receive">
            {/* White whatever the panel's light: an email is read on white, and
                most letters set no page colour of their own. Sandboxed, so the
                letter's markup can run nothing. */}
            <iframe title={t("Letter preview")} srcDoc={preview.html} sandbox="" className="h-[560px] w-full rounded-control border border-ink/10 bg-white" />
          </Section>
        ) : null}

        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={send}
          title={t("Send the {letter} to {name}?", { letter: letterName.toLowerCase(), name })}
          body={t("It goes by email to {email} now, and lands in their story.", { email })}
          confirmLabel="Send"
          confirmIcon={Send}
          pendingLabel="Sending…"
          tone="brand"
          pending={pending}
        />
      </div>
    </DirtyExempt>
  );
}
