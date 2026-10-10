// The hiring rooms' vocabulary, as the app hands it to the kit: the stages a
// candidate walks, the letters that go with them, what a letter can't go
// without, and how the reader's score is said. The kit owns none of it. Each
// panel brings its own (from team-kit's hiring module, or its own lib), so two
// panels can walk different stages and still share one candidate file.
//
// No "use client": the chips and the list columns read these words while a
// server page renders, and the browser pieces read the same ones. Everything
// here is a plain function of its arguments, so the tests can hold the rules.

/** How a stage reads on its chip: a new knock and a hire glow, the middle of the walk is in hand, the rest is quiet. */
export type StageTone = "good" | "work" | "warn" | "quiet";

/** How the reader's score reads on its chip: strong, possible, or weak. */
export type FitTone = "ok" | "warn" | "quiet";

export interface HiringStage {
  value: string;
  /** Said in full, on a chip and in a question: "Invited for interview". */
  label: string;
  /** One word, where a row of stages must fit (the walk, the strip): "Invited". */
  short: string;
  tone: StageTone;
  /** The button that moves a candidate on into this stage: "Invite for interview". */
  step?: string;
  /** Words for jumping over this stage from the one before it: "Skip the trial, make an offer". */
  skip?: string;
}

/** What a letter carries beyond the candidate and the role, keyed by its fields. */
export type LetterDetails = Record<string, string | undefined>;

// The callbacks are written as methods on purpose: TypeScript checks a method's
// arguments both ways, so an app's own `letterNeeds(letter: Letter, d:
// LetterDetails)` (a narrower letter type) fits here without a cast.
export interface HiringWords {
  /** Every stage in the order a candidate walks it, the hire last and the way out anywhere. */
  stages: HiringStage[];
  /** The stage that means hired. "hired" when left out. */
  hired?: string;
  /** The way out. "rejected" when left out. */
  rejected?: string;
  /** Every letter a candidate can be sent, in the order the picker shows them. */
  letters: { value: string; label: string }[];
  /** The letter each stage opens. A stage with none (a shortlist) is the office's move, not theirs. */
  letterForStage: Record<string, string | undefined>;
  /** What a letter can't go without yet, in words ("a day and a time"); empty when it can go. */
  letterNeeds(letter: string, details: LetterDetails): string[];
  /** The reader's number in a word a person acts on; null is a file it has not read. */
  fitWord(score: number | null): string;
  /** The chip's dot for a score. Left out, it follows `fitCutoffs`. */
  fitTone?(score: number): FitTone;
  /** Where "possible" and "strong" begin, for the bar's two hairlines and the default dot. [50, 75] when left out. */
  fitCutoffs?: [number, number];
  /** A line the hire question adds about what a hire settles in this panel (that the file can no longer be deleted, say). */
  hireNote?: string;
}

const HIRED = "hired";
const REJECTED = "rejected";
const CUTOFFS: [number, number] = [50, 75];

export const hiredOf = (words: Pick<HiringWords, "hired">): string => words.hired ?? HIRED;
export const rejectedOf = (words: Pick<HiringWords, "rejected">): string => words.rejected ?? REJECTED;
export const cutoffsOf = (words: Pick<HiringWords, "fitCutoffs">): [number, number] => words.fitCutoffs ?? CUTOFFS;

/**
 * The stage a value names. A value the words don't know (a stage dropped since
 * the file was made) reads as the walk's first, so a file always stands
 * somewhere the walk can draw.
 */
export function stageOf(words: Pick<HiringWords, "stages">, value: string): HiringStage {
  return (
    words.stages.find((s) => s.value === value) ??
    words.stages[0] ?? { value, label: value, short: value, tone: "quiet" }
  );
}

/** The walk without the way out, in order: what StageWalk draws as points. */
function walkStages(words: Pick<HiringWords, "stages" | "rejected">): HiringStage[] {
  const out = rejectedOf(words);
  return words.stages.filter((s) => s.value !== out);
}

/** The walk as StageWalk takes it: short names for the points, the way out apart. */
export function walkOf(words: Pick<HiringWords, "stages" | "rejected">): {
  steps: { value: string; label: string }[];
  exit?: { value: string; label: string };
} {
  const out = words.stages.find((s) => s.value === rejectedOf(words));
  return {
    steps: walkStages(words).map((s) => ({ value: s.value, label: s.short })),
    exit: out ? { value: out.value, label: out.short } : undefined,
  };
}

/** What can be done with a file from where it stands. */
export interface Moves {
  /** Hired or let go: nothing moves until it is reopened. */
  settled: boolean;
  /** The one primary door: the next stage on the walk, which may be the hire itself. */
  next: { to: string; hire: boolean } | null;
  /** Back one stage. */
  back: string | null;
  /** Jump over the next stage (a trial) to the one after it, with the skipped stage's words. */
  skip: { to: string; label: string } | null;
  /** A "Hire them" in the menu, for a hire before the walk's end; none when the primary door is the hire. */
  hire: boolean;
  /** Let them go, with a reason. */
  letGo: boolean;
  /** Where Reopen takes a settled file: the walk's first stage. */
  reopen: string | null;
}

/**
 * The moves a file offers at its stage: the next step as the one door, back a
 * step, skip a skippable stage, hire from any open stage, let go; a settled
 * file only reopens.
 */
export function offeredMoves(words: Pick<HiringWords, "stages" | "hired" | "rejected">, stage: string): Moves {
  const walk = walkStages(words);
  const hired = hiredOf(words);
  const first = walk[0]?.value ?? null;
  if (stage === hired || stage === rejectedOf(words)) {
    return { settled: true, next: null, back: null, skip: null, hire: false, letGo: false, reopen: first };
  }
  const at = Math.max(0, walk.findIndex((s) => s.value === stage));
  const following = walk[at + 1];
  const after = walk[at + 2];
  const next = following ? { to: following.value, hire: following.value === hired } : null;
  // A panel whose words have no hire or no way out simply isn't offered them.
  const has = (value: string) => words.stages.some((s) => s.value === value);
  return {
    settled: false,
    next,
    back: at > 0 ? (walk[at - 1]?.value ?? null) : null,
    // Skipping into the hire is the hire, which the menu already offers.
    skip: following?.skip && after && after.value !== hired ? { to: after.value, label: following.skip } : null,
    hire: has(hired) && !next?.hire,
    letGo: has(rejectedOf(words)),
    reopen: null,
  };
}

/**
 * What a press on the walk means. A hire and a let-go ask first, and so does
 * any move out of a settled file (it reopens it); the rest move at once.
 */
export function walkPick(
  words: Pick<HiringWords, "hired" | "rejected">,
  current: string,
  target: string,
): "move" | "hire" | "letGo" | "reopen" {
  if (target === hiredOf(words)) return "hire";
  if (target === rejectedOf(words)) return "letGo";
  if (current === hiredOf(words) || current === rejectedOf(words)) return "reopen";
  return "move";
}

/** The reader's score as a dot: by the app's own rule, or by the two cut-offs. */
export function fitToneOf(words: Pick<HiringWords, "fitTone" | "fitCutoffs">, score: number): FitTone {
  if (words.fitTone) return words.fitTone(score);
  const [possible, strong] = cutoffsOf(words);
  return score >= strong ? "ok" : score >= possible ? "warn" : "quiet";
}

// ── Letters ──────────────────────────────────────────────────────────────

/** One thing a letter asks for. */
export interface LetterField {
  key: string;
  label: string;
  placeholder?: string;
  /** "text" a line (the default), "long" a box, "day" the calendar, "time" the clock. */
  kind?: "text" | "long" | "day" | "time";
  /** What the field starts with: the office's address for "where". */
  start?: string;
}

/** The fields each letter asks for, by letter. A letter with none sends as it is. */
export type LetterFields = Record<string, LetterField[] | undefined>;

/**
 * The six letters most panels send (received, invited, trial, offer, hired,
 * rejected) with what each asks for: an interview its day, time and place, an
 * offer its start and salary. `office` fills "where"; `placeholders` replaces
 * an example, by field ("bring") or by letter and field ("hired.bring").
 */
export function standardLetterFields({
  office,
  placeholders = {},
}: { office?: string; placeholders?: Partial<Record<string, string>> } = {}): LetterFields {
  const field = (letter: string, f: LetterField): LetterField => ({
    ...f,
    placeholder: placeholders[`${letter}.${f.key}`] ?? placeholders[f.key] ?? f.placeholder,
  });
  const set = (letter: string, fields: LetterField[]) => fields.map((f) => field(letter, f));
  return {
    received: [],
    invited: set("invited", [
      // Picked, not typed: the app writes the day and time in the candidate's own language.
      { key: "day", label: "Day", kind: "day" },
      { key: "time", label: "Time", kind: "time" },
      { key: "where", label: "Where", start: office, placeholder: "The office's address" },
      { key: "withWhom", label: "With whom", placeholder: "The office manager" },
      { key: "bring", label: "What to bring", placeholder: "Your ID and a copy of your CV" },
    ]),
    trial: set("trial", [
      { key: "brief", label: "The task", kind: "long", placeholder: "What to do, and what a good answer looks like" },
      { key: "deadline", label: "Deadline", placeholder: "Thursday 9 October" },
    ]),
    offer: set("offer", [
      { key: "start", label: "Start date", placeholder: "1 November 2026" },
      { key: "salary", label: "Salary", placeholder: "QAR 8,000 a month" },
      { key: "probation", label: "Probation", placeholder: "Three months" },
      { key: "validUntil", label: "The offer stands until", placeholder: "Seven days from today when empty" },
    ]),
    hired: set("hired", [
      { key: "when", label: "First day", placeholder: "Sunday 2 November, 8:30" },
      { key: "where", label: "Where", start: office, placeholder: "The office's address" },
      { key: "bring", label: "What to bring", placeholder: "Your ID, passport and bank details" },
      { key: "askFor", label: "Ask for", placeholder: "The office manager at reception" },
    ]),
    rejected: set("rejected", [{ key: "note", label: "A line of your own", kind: "long", placeholder: "Optional" }]),
  };
}

/** A letter's fields as they start: the ones with a default filled, the rest empty. */
export function startDetails(fields: LetterFields, letter: string): LetterDetails {
  return Object.fromEntries((fields[letter] ?? []).filter((f) => f.start).map((f) => [f.key, f.start]));
}

/** The letter a file opens on: the one its stage sends, else the first there is. */
export function letterForFile(words: Pick<HiringWords, "letters" | "letterForStage">, stage: string): string {
  return words.letterForStage[stage] ?? words.letters[0]?.value ?? "";
}

/**
 * Whether the letter can go, and what it still needs. It goes only when it
 * needs nothing, the person may send, and the panel's mail is set up.
 */
export function letterGate(
  words: Pick<HiringWords, "letterNeeds">,
  letter: string,
  details: LetterDetails,
  { canSend, mailReady }: { canSend: boolean; mailReady: boolean },
): { missing: string[]; sendable: boolean } {
  const missing = words.letterNeeds(letter, details);
  return { missing, sendable: canSend && mailReady && missing.length === 0 };
}

/** A letter being written, as kept in the tab between visits. */
export type LetterDraft = { letter: string; details: LetterDetails };

/** A kept draft read back, or null when there is none or it names a letter the panel no longer sends. */
export function readDraft(raw: string | null, words: Pick<HiringWords, "letters">): LetterDraft | null {
  if (!raw) return null;
  try {
    const kept = JSON.parse(raw) as Partial<LetterDraft> | null;
    if (!kept || typeof kept.letter !== "string" || !words.letters.some((l) => l.value === kept.letter)) return null;
    const details = kept.details && typeof kept.details === "object" ? kept.details : {};
    // Only words survive: anything else in storage was not written by this form.
    const clean = Object.fromEntries(Object.entries(details).filter(([, v]) => typeof v === "string")) as LetterDetails;
    return { letter: kept.letter, details: clean };
  } catch {
    return null;
  }
}

// ── Openings ─────────────────────────────────────────────────────────────

/** How many questions a block of one-per-line questions holds; blank lines are none. */
export function questionCount(raw: string): number {
  return raw.split(/\r?\n/).filter((line) => line.trim()).length;
}

/** "French", "French and Italian", "French, Italian and Russian": a list said the way a person says it. */
export function sayList(items: string[], and = "and"): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}
