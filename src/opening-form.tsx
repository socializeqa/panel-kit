"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Briefcase, ExternalLink, Globe, Languages, ListChecks, ScrollText, type LucideIcon } from "lucide-react";
import type { ActionResult } from "./action-result";
import { ChoicePills } from "./choice-pills";
import { buttonClass } from "./classes";
import { DeleteButton } from "./delete-button";
import { useDrawerActions, useDrawerDirty } from "./drawer";
import { DrawerHeader } from "./drawer-header";
import { Button, Field, FieldGroup, Input } from "./fields";
import { Hint } from "./hint";
import { questionCount, sayList } from "./hiring-words";
import { NoteBox } from "./note-box";
import { OpeningChip } from "./opening-chip";
import { usePanelT } from "./panel-provider";
import { RecordEditingProvider, useRecordEditing } from "./record-editing";
import { RecordForm } from "./record-form";
import { Section } from "./record-fields";
import { Segmented } from "./segmented";
import { useToast } from "./toast";

/** A screening question, asked in English and, where it has one, in Arabic. */
export interface OpeningQuestion {
  prompt: string;
  prompt_ar?: string;
}

/** A role in one of the extra languages, as the opening keeps it. */
export interface RoleWords {
  title?: string;
  department?: string;
  location?: string;
  summary?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  salary_note?: string | null;
  /** The screening questions, in the English order. */
  questions?: string[];
  /** The English questions these were written for (the app's save keeps it; the form leaves it be). */
  questions_from?: string[];
  /** A mark of the English these were written from; when it differs from today's, the English changed since. */
  source?: string;
}

/** The opening's English words, the ones the other languages are written from. */
export interface OpeningEnglish {
  title: string;
  department: string | null;
  location: string;
  summary: string;
  description: string;
  responsibilities: string;
  requirements: string;
  salary_note: string | null;
  questions: OpeningQuestion[];
}

// The fields keep the names of the form's fields and of the app's columns
// (snake_case), so an app hands its row straight in and its save reads the
// form as it always has.
export interface OpeningRecord {
  id: string;
  slug: string;
  title: string;
  title_ar?: string | null;
  department?: string | null;
  department_ar?: string | null;
  employment_type: string;
  location?: string | null;
  location_ar?: string | null;
  summary?: string | null;
  summary_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  responsibilities?: string | null;
  responsibilities_ar?: string | null;
  requirements?: string | null;
  requirements_ar?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_note?: string | null;
  salary_note_ar?: string | null;
  questions?: OpeningQuestion[];
  /** The extra languages, each where it has been written. */
  translations?: Partial<Record<string, RoleWords>>;
  status: string;
  /** How many applied, and how many of them are new. */
  applicants?: number;
  waiting?: number;
}

/** What a save answers: a new opening's id comes back so the drawer can walk onto it. */
export type OpeningSaveResult = ActionResult & { id?: string };

/** What a draft of the extra languages answers. */
export type OpeningDraft = { ok: true; words: Partial<Record<string, RoleWords>> } | { ok: false; error: string };

/** A status the opening can stand in, with the line that says what it means on the site. */
export interface OpeningStatus {
  value: string;
  label: string;
  hint?: string;
}

const STATUSES: OpeningStatus[] = [
  { value: "draft", label: "Draft", hint: "A draft: only the office sees it" },
  { value: "open", label: "Open", hint: "Open: anyone can read it and apply" },
  { value: "closed", label: "Closed", hint: "Closed: off the site, no new applicants" },
];

const glyph = (Icon: LucideIcon) => <Icon size={15} strokeWidth={2} aria-hidden="true" />;

type OpeningFormProps<R extends OpeningSaveResult> = {
  /** The opening on file, or null for a new one. */
  opening: OpeningRecord | null;
  /** The save, one for create and update (an `id` in the form means update). */
  action: (prev: R | null, fd: FormData) => Promise<R>;
  /** The openings list: a new opening walks onto `${listHref}/${id}`, a deleted one lands here. */
  listHref: string;
  employmentTypes: { value: string; label: string }[];
  /** The statuses and what each means on the site; draft, open and closed when left out. */
  statuses?: OpeningStatus[];
  /** The status that puts the role on the site. */
  live?: string;
  /** The currency the salary is in, as it reads in a label. */
  currency?: string;
  /** How many screening questions the save keeps. */
  maxQuestions?: number;
  /** Where a new opening starts out. */
  defaultLocation?: string;
  /** The examples in the boxes, for a panel that wants its own trade's words. */
  placeholders?: { title?: string; department?: string; location?: string; questions?: string };
  /** Fields of the panel's own, under the department (a branch, a team). Their names post with the form. */
  extra?: React.ReactNode;
  /** The Arabic fields; on unless the panel's site has no Arabic. */
  arabic?: boolean;
  /** Languages beyond English and Arabic, each by its name ("French"); none when left out. */
  locales?: { value: string; label: string }[];
  /** Write the extra languages from the English as it stands; no button when left out. */
  onDraft?: (english: OpeningEnglish) => Promise<OpeningDraft>;
  /** A mark of the English, to say when a language was written from older words. */
  englishMark?: (english: OpeningEnglish) => string;
  /** The live page's address for a slug; no link when left out. */
  publicUrl?: (slug: string) => string;
  /** Delete, when this person may and the opening may go (nobody applied to it, say). */
  remove?: { action: (formData: FormData) => void | Promise<void | ActionResult> };
};

// An opening, new or on file, for a drawer, on the kit's one save model: what
// the role is, what the careers page says about it in English and Arabic, the
// salary if it is shown, the questions the form asks, the extra languages and
// whether it is live. A new opening starts as a draft (an unfinished page never
// shows) and open for writing; one on file opens to be read, and the pencil
// unlocks it.
export function OpeningForm<R extends OpeningSaveResult>(props: OpeningFormProps<R>) {
  return (
    <RecordEditingProvider initial={!props.opening} noun="opening">
      <OpeningFields {...props} />
    </RecordEditingProvider>
  );
}

function OpeningFields<R extends OpeningSaveResult>({
  opening,
  action,
  listHref,
  employmentTypes,
  statuses = STATUSES,
  live = "open",
  currency = "QAR",
  maxQuestions = 10,
  defaultLocation = "",
  placeholders = {},
  extra,
  arabic = true,
  locales = [],
  onDraft,
  englishMark,
  publicUrl,
  remove,
}: OpeningFormProps<R>) {
  const t = usePanelT();
  const router = useRouter();
  const toast = useToast();
  const { markDirty, markClean } = useDrawerDirty();
  const { closeTo, inDrawer } = useDrawerActions();
  const { editing, setEditing } = useRecordEditing();
  const fieldsRef = useRef<HTMLDivElement>(null);
  // Bumped by Cancel: the form is drawn again from the opening on file.
  const [round, setRound] = useState(0);
  const [type, setType] = useState(opening?.employment_type ?? employmentTypes[0]?.value ?? "");
  const [status, setStatus] = useState(opening?.status ?? statuses[0]?.value ?? "draft");
  const [asked, setAsked] = useState(questionCount((opening?.questions ?? []).map((q) => q.prompt).join("\n")));
  const [lang, setLang] = useState(locales[0]?.value ?? "");
  const [words, setWords] = useState<Partial<Record<string, RoleWords>>>(opening?.translations ?? {});
  // Drawn again from `words` when a draft arrives: otherwise the fields keep their own typing.
  const [drawn, setDrawn] = useState(0);
  const [drafting, startDraft] = useTransition();
  const apps = opening?.applicants ?? 0;
  // The page is on the site only while the SAVED opening is live.
  const liveUrl = opening && publicUrl && opening.status === live ? publicUrl(opening.slug) : null;
  const statusLabel = (value: string) => statuses.find((s) => s.value === value)?.label;

  const englishOf = (o: OpeningRecord): OpeningEnglish => ({
    title: o.title,
    department: o.department ?? null,
    location: o.location ?? "",
    summary: o.summary ?? "",
    description: o.description ?? "",
    responsibilities: o.responsibilities ?? "",
    requirements: o.requirements ?? "",
    salary_note: o.salary_note ?? null,
    questions: o.questions ?? [],
  });
  // The English the saved languages were written from, to say when it changed since.
  const savedMark = opening && englishMark ? englishMark(englishOf(opening)) : null;

  // The English as it stands in the form now, saved or not, for a draft.
  const englishNow = (): OpeningEnglish => {
    const read = (name: string) =>
      (fieldsRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)?.value ?? "").trim();
    return {
      title: read("title"),
      department: read("department") || null,
      location: read("location"),
      summary: read("summary"),
      description: read("description"),
      responsibilities: read("responsibilities"),
      requirements: read("requirements"),
      salary_note: read("salary_note") || null,
      questions: read("questions")
        .split(/\r?\n/)
        .map((prompt) => prompt.trim())
        .filter(Boolean)
        .map((prompt) => ({ prompt })),
    };
  };

  const draft = () => {
    if (!onDraft) return;
    startDraft(async () => {
      const res = await onDraft(englishNow());
      if (!res.ok) {
        toast(res.error, "error");
        return;
      }
      setWords((had) => ({ ...had, ...res.words }));
      setDrawn((n) => n + 1);
      // A fill in code fires no input event, but it is unsaved work all the same.
      markDirty();
      const n = Object.keys(res.words).length;
      toast(n === 1 ? t("Drafted in one language. Read it, then save.") : t("Drafted in {n} languages. Read them, then save.", { n }));
    });
  };

  // A choice by a click fires no input event, so it reports itself.
  const choose = (set: (v: string) => void) => (v: string) => {
    if (!v) return;
    set(v);
    markDirty();
  };

  const languageNames = locales.map((l) => t(l.label));
  const questionsLine = t("Asked on the form, up to {n}", { n: maxQuestions });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <DrawerHeader
        title={opening ? opening.title : "New opening"}
        sub={
          opening
            ? [apps === 1 ? t("1 applicant") : t("{n} applicants", { n: apps }), opening.waiting ? t("{n} new", { n: opening.waiting }) : ""]
                .filter(Boolean)
                .join(", ")
            : "A role for the careers page"
        }
        badge={opening ? <OpeningChip status={opening.status} label={statusLabel(opening.status)} live={live} /> : undefined}
        editable={Boolean(opening)}
        actions={
          opening && remove ? (
            <DeleteButton
              menu
              id={opening.id}
              action={remove.action}
              afterHref={listHref}
              label="Delete opening"
              title="Delete this opening?"
              body="It leaves the list and the careers page."
              confirmLabel="Delete opening"
            />
          ) : undefined
        }
      />
      <RecordForm<R>
        key={round}
        action={action}
        hidden={{ id: opening?.id ?? "", employment_type: type, status }}
        submitLabel={opening ? "Save changes" : "Create the opening"}
        pendingLabel={opening ? "Saving…" : "Creating…"}
        savedMessage={opening ? "Opening saved" : "Opening created"}
        alwaysSavable={!opening}
        readOnly={Boolean(opening) && !editing}
        onCancel={
          opening
            ? () => {
                setRound((n) => n + 1);
                setType(opening.employment_type);
                setStatus(opening.status);
                setWords(opening.translations ?? {});
                setAsked(questionCount((opening.questions ?? []).map((q) => q.prompt).join("\n")));
                markClean();
                setEditing(false);
              }
            : undefined
        }
        onSaved={(r) => {
          if (!r.ok) return;
          if (opening) {
            router.refresh();
            setEditing(false);
            return;
          }
          const target = r.id ? `${listHref}/${r.id}` : listHref;
          if (inDrawer) closeTo(target);
          else router.replace(target);
        }}
      >
        <div ref={fieldsRef} className="contents">
          <Section icon={glyph(Globe)} title="On the careers page" subtitle={statuses.find((s) => s.value === status)?.hint}>
            <FieldGroup label="Status">
              <ChoicePills ariaLabel="Status" value={status} onChange={choose(setStatus)} options={statuses.map((s) => ({ value: s.value, label: s.label }))} />
            </FieldGroup>
            {liveUrl ? (
              <div className="flex flex-wrap items-center gap-2">
                <a href={liveUrl} target="_blank" rel="noreferrer" className={buttonClass({ variant: "ghost", size: "sm" })}>
                  <ExternalLink size={14} strokeWidth={2} aria-hidden="true" /> {t("See it on the website")}
                </a>
                <span dir="ltr" className="truncate text-[12px] text-quiet">
                  {liveUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
              </div>
            ) : opening && publicUrl ? (
              <Hint>{t("It shows on the website once it is {status} and saved.", { status: (statusLabel(live) ?? live).toLowerCase() })}</Hint>
            ) : null}
          </Section>

          <Section icon={glyph(Briefcase)} title="The role" subtitle="What it is and where" collapsible>
            <Field label="Title" htmlFor="opening-title">
              <Input
                id="opening-title"
                name="title"
                required
                minLength={2}
                maxLength={120}
                defaultValue={opening?.title ?? ""}
                placeholder={t(placeholders.title ?? "Office Manager")}
              />
            </Field>
            <Field label="Department" htmlFor="opening-department">
              <Input
                id="opening-department"
                name="department"
                maxLength={80}
                defaultValue={opening?.department ?? ""}
                placeholder={t(placeholders.department ?? "Operations")}
              />
            </Field>
            {extra}
            <FieldGroup label="Type">
              <ChoicePills ariaLabel="Employment type" value={type} onChange={choose(setType)} options={employmentTypes} />
            </FieldGroup>
            <Field label="Location" htmlFor="opening-location">
              <Input
                id="opening-location"
                name="location"
                required
                maxLength={120}
                defaultValue={opening ? (opening.location ?? "") : defaultLocation}
                placeholder={t(placeholders.location ?? "Doha, Qatar")}
              />
            </Field>
          </Section>

          <Section icon={glyph(ScrollText)} title="What the page says" subtitle="The list's one line, then the role page" collapsible>
            <Field label="One-line summary" htmlFor="opening-summary">
              <NoteBox id="opening-summary" name="summary" rows={2} defaultValue={opening?.summary ?? ""} placeholder={t("The line under the title on the careers list.")} />
            </Field>
            <Field label="About the role" htmlFor="opening-description">
              <NoteBox id="opening-description" name="description" rows={7} defaultValue={opening?.description ?? ""} placeholder={t("What the role is and what a day looks like.")} />
            </Field>
            <Field label="What you'll do" htmlFor="opening-responsibilities">
              <NoteBox
                id="opening-responsibilities"
                name="responsibilities"
                rows={6}
                defaultValue={opening?.responsibilities ?? ""}
                placeholder={t("One per line:\nKeep the office running day to day\nLook after visitors and calls")}
              />
            </Field>
            <Field label="What we look for" htmlFor="opening-requirements">
              <NoteBox
                id="opening-requirements"
                name="requirements"
                rows={6}
                defaultValue={opening?.requirements ?? ""}
                placeholder={t("One per line:\nTwo years running an office\nClear written English")}
              />
            </Field>
            <Hint>A blank line starts a new paragraph. In the two lists, each line is one point.</Hint>
          </Section>

          {arabic ? (
            <Section
              icon={glyph(Languages)}
              title="In Arabic"
              subtitle="Leave a field empty and the Arabic page shows the English"
              collapsible
              defaultOpen={Boolean(opening?.title_ar)}
            >
              <Field label="Title in Arabic" htmlFor="opening-title-ar">
                <Input id="opening-title-ar" name="title_ar" dir="rtl" maxLength={120} defaultValue={opening?.title_ar ?? ""} placeholder="مدير مكتب" />
              </Field>
              <Field label="Department in Arabic" htmlFor="opening-department-ar">
                <Input id="opening-department-ar" name="department_ar" dir="rtl" maxLength={80} defaultValue={opening?.department_ar ?? ""} />
              </Field>
              <Field label="Location in Arabic" htmlFor="opening-location-ar">
                <Input id="opening-location-ar" name="location_ar" dir="rtl" maxLength={120} defaultValue={opening?.location_ar ?? ""} placeholder="الدوحة، قطر" />
              </Field>
              <Field label="Summary in Arabic" htmlFor="opening-summary-ar">
                <NoteBox id="opening-summary-ar" name="summary_ar" dir="rtl" rows={2} defaultValue={opening?.summary_ar ?? ""} />
              </Field>
              <Field label="About the role in Arabic" htmlFor="opening-description-ar">
                <NoteBox id="opening-description-ar" name="description_ar" dir="rtl" rows={6} defaultValue={opening?.description_ar ?? ""} />
              </Field>
              <Field label="What you'll do in Arabic" htmlFor="opening-responsibilities-ar">
                <NoteBox id="opening-responsibilities-ar" name="responsibilities_ar" dir="rtl" rows={5} defaultValue={opening?.responsibilities_ar ?? ""} />
              </Field>
              <Field label="What we look for in Arabic" htmlFor="opening-requirements-ar">
                <NoteBox id="opening-requirements-ar" name="requirements_ar" dir="rtl" rows={5} defaultValue={opening?.requirements_ar ?? ""} />
              </Field>
            </Section>
          ) : null}

          <Section
            icon={glyph(Banknote)}
            title="Salary"
            subtitle="Leave it empty to keep the salary off the page"
            collapsible
            defaultOpen={Boolean(opening?.salary_min || opening?.salary_max || opening?.salary_note)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("From ({currency} a month)", { currency })} htmlFor="opening-salary-min">
                <Input id="opening-salary-min" name="salary_min" inputMode="numeric" defaultValue={opening?.salary_min ?? ""} placeholder="6,000" />
              </Field>
              <Field label={t("To ({currency} a month)", { currency })} htmlFor="opening-salary-max">
                <Input id="opening-salary-max" name="salary_max" inputMode="numeric" defaultValue={opening?.salary_max ?? ""} placeholder="9,000" />
              </Field>
            </div>
            <Field label="A note on pay" htmlFor="opening-salary-note">
              <Input id="opening-salary-note" name="salary_note" maxLength={160} defaultValue={opening?.salary_note ?? ""} placeholder={t("plus a yearly bonus")} />
            </Field>
            {arabic ? (
              <Field label="The note in Arabic" htmlFor="opening-salary-note-ar">
                <Input id="opening-salary-note-ar" name="salary_note_ar" dir="rtl" maxLength={160} defaultValue={opening?.salary_note_ar ?? ""} placeholder="بالإضافة إلى مكافأة سنوية" />
              </Field>
            ) : null}
          </Section>

          <Section icon={glyph(ListChecks)} title="Screening questions" subtitle={questionsLine} collapsible defaultOpen={Boolean(opening?.questions?.length)}>
            <Field label="One question per line" htmlFor="opening-questions">
              <NoteBox
                id="opening-questions"
                name="questions"
                rows={5}
                defaultValue={(opening?.questions ?? []).map((q) => q.prompt).join("\n")}
                placeholder={t(placeholders.questions ?? "Do you hold a Qatari driving licence?\nWhen could you start?")}
                onChange={(v) => setAsked(questionCount(v))}
              />
            </Field>
            {asked > maxQuestions ? (
              <Hint tone="warn">{t("{n} questions here; the form asks {max} at most.", { n: asked, max: maxQuestions })}</Hint>
            ) : null}
            {arabic ? (
              <>
                <Field label="The same questions in Arabic, in the same order" htmlFor="opening-questions-ar">
                  <NoteBox
                    id="opening-questions-ar"
                    name="questions_ar"
                    dir="rtl"
                    rows={4}
                    defaultValue={(opening?.questions ?? []).map((q) => q.prompt_ar ?? "").join("\n").trimEnd()}
                  />
                </Field>
                <Hint>A question with no Arabic line is asked in English on the Arabic page. Answers always show here with the English question.</Hint>
              </>
            ) : null}
          </Section>

          {locales.length ? (
            <Section
              icon={glyph(Languages)}
              title={t("In {languages}", { languages: sayList(languageNames, t("and")) })}
              subtitle="Each page reads in its own language; an empty field shows the English"
              collapsible
              defaultOpen={Boolean(opening && Object.keys(opening.translations ?? {}).length)}
            >
              {/* Tells the save the languages came with the form, so an empty one is a choice, not a gap. */}
              <input type="hidden" name="tr.present" value="1" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                {locales.length > 1 ? <Segmented value={lang} onChange={setLang} options={locales} /> : <span />}
                {onDraft && (editing || !opening) ? (
                  <Button type="button" size="sm" variant="ghost" onClick={draft} disabled={drafting}>
                    <Languages size={14} strokeWidth={2} aria-hidden="true" /> {drafting ? t("Drafting…") : t("Draft them from the English")}
                  </Button>
                ) : null}
              </div>
              {locales.map(({ value: l, label }) => {
                const w = words[l] ?? {};
                const name = t(label);
                const stale = Boolean(savedMark && w.source && w.source !== savedMark);
                const id = (field: string) => `tr-${l}-${field}`;
                // Every language is in the form, the picked one on show: they all save together.
                return (
                  <div key={`${l}-${drawn}`} hidden={l !== lang} className="flex flex-col gap-4">
                    {stale ? <Hint tone="warn">{t("The English changed after the {language} was written. Read it again, or draft it anew.", { language: name })}</Hint> : null}
                    <Field label={t("Title in {language}", { language: name })} htmlFor={id("title")}>
                      <Input id={id("title")} name={`tr.${l}.title`} maxLength={120} defaultValue={w.title ?? ""} />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Department" htmlFor={id("department")}>
                        <Input id={id("department")} name={`tr.${l}.department`} maxLength={80} defaultValue={w.department ?? ""} />
                      </Field>
                      <Field label="Location" htmlFor={id("location")}>
                        <Input id={id("location")} name={`tr.${l}.location`} maxLength={120} defaultValue={w.location ?? ""} />
                      </Field>
                    </div>
                    <Field label="One-line summary" htmlFor={id("summary")}>
                      <NoteBox id={id("summary")} name={`tr.${l}.summary`} rows={2} defaultValue={w.summary ?? ""} />
                    </Field>
                    <Field label="About the role" htmlFor={id("description")}>
                      <NoteBox id={id("description")} name={`tr.${l}.description`} rows={6} defaultValue={w.description ?? ""} />
                    </Field>
                    <Field label="What you'll do" htmlFor={id("responsibilities")}>
                      <NoteBox id={id("responsibilities")} name={`tr.${l}.responsibilities`} rows={5} defaultValue={w.responsibilities ?? ""} />
                    </Field>
                    <Field label="What we look for" htmlFor={id("requirements")}>
                      <NoteBox id={id("requirements")} name={`tr.${l}.requirements`} rows={5} defaultValue={w.requirements ?? ""} />
                    </Field>
                    <Field label="A note on pay" htmlFor={id("salary")}>
                      <Input id={id("salary")} name={`tr.${l}.salary_note`} maxLength={160} defaultValue={w.salary_note ?? ""} />
                    </Field>
                    <Field label="The screening questions, in the English order" htmlFor={id("questions")}>
                      <NoteBox id={id("questions")} name={`tr.${l}.questions`} rows={4} defaultValue={(w.questions ?? []).join("\n")} />
                    </Field>
                  </div>
                );
              })}
            </Section>
          ) : null}
        </div>
      </RecordForm>
    </div>
  );
}
