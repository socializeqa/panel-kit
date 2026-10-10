import { describe, expect, it } from "vitest";
import {
  fitToneOf,
  letterForFile,
  letterGate,
  offeredMoves,
  questionCount,
  readDraft,
  sayList,
  standardLetterFields,
  stageOf,
  startDetails,
  walkOf,
  walkPick,
  type HiringWords,
  type LetterDetails,
} from "../src/hiring-words";

// A panel's hiring words, the way an app hands them in: the eight stages most
// of the team's panels walk, with the trial skippable.
const missing = (label: string, value?: string) => (value?.trim() ? [] : [label]);
const WORDS: HiringWords = {
  stages: [
    { value: "new", label: "New", short: "New", tone: "good" },
    { value: "shortlist", label: "Shortlist", short: "Shortlist", tone: "quiet", step: "Shortlist" },
    { value: "invited", label: "Invited for interview", short: "Invited", tone: "work", step: "Invite for interview" },
    { value: "interview", label: "Interview", short: "Interview", tone: "work", step: "Mark interviewed" },
    { value: "trial", label: "Trial task", short: "Trial", tone: "work", step: "Give a trial task", skip: "Skip the trial, make an offer" },
    { value: "offer", label: "Offer", short: "Offer", tone: "work", step: "Make an offer" },
    { value: "hired", label: "Hired", short: "Hired", tone: "good", step: "Hire" },
    { value: "rejected", label: "Rejected", short: "Rejected", tone: "quiet" },
  ],
  letters: [
    { value: "received", label: "Acknowledgement" },
    { value: "invited", label: "Interview invitation" },
    { value: "trial", label: "Trial task" },
    { value: "offer", label: "Offer" },
    { value: "hired", label: "First-day letter" },
    { value: "rejected", label: "Regret" },
  ],
  letterForStage: { invited: "invited", trial: "trial", offer: "offer", hired: "hired", rejected: "rejected" },
  letterNeeds(letter: string, d: LetterDetails) {
    if (letter === "invited") return [...(d.day && d.time ? [] : ["a day and a time"]), ...missing("where", d.where)];
    if (letter === "offer") return [...missing("a start date", d.start), ...missing("the salary", d.salary)];
    return [];
  },
  fitWord: (score) => (score === null ? "Not read" : score >= 75 ? "Strong" : score >= 50 ? "Possible" : "Weak"),
};

describe("the words an app hands in", () => {
  // An app's own letter type is narrower than a string; the method signature
  // in HiringWords is what lets its function in without a cast (tsc holds this).
  it("take an app's letterNeeds with its own letter and detail types", () => {
    type Letter = "received" | "invited";
    type Details = { day?: string; time?: string; where?: string };
    const needs = (letter: Letter, d: Details): string[] => (letter === "invited" && !d.where ? ["where"] : []);
    const words: HiringWords = { ...WORDS, letterNeeds: needs };
    expect(letterGate(words, "invited", {}, { canSend: true, mailReady: true }).missing).toEqual(["where"]);
  });
});

describe("the walk", () => {
  it("is every stage but the way out, in order, by their short names", () => {
    const { steps, exit } = walkOf(WORDS);
    expect(steps.map((s) => s.value)).toEqual(["new", "shortlist", "invited", "interview", "trial", "offer", "hired"]);
    expect(steps.find((s) => s.value === "invited")?.label).toBe("Invited");
    expect(exit).toEqual({ value: "rejected", label: "Rejected" });
  });

  it("reads a stage it doesn't know as the first, so a file always stands somewhere", () => {
    expect(stageOf(WORDS, "archived").value).toBe("new");
    expect(stageOf(WORDS, "offer").label).toBe("Offer");
  });

  it("takes a panel's own names for the hire and the way out", () => {
    const words = { ...WORDS, stages: WORDS.stages.map((s) => (s.value === "rejected" ? { ...s, value: "declined" } : s)), rejected: "declined" };
    expect(walkOf(words).exit?.value).toBe("declined");
    expect(offeredMoves(words, "declined").settled).toBe(true);
  });
});

describe("offeredMoves — what a file offers at each stage", () => {
  it("new: the next step is the shortlist; no way back; hire early and let go in the menu", () => {
    expect(offeredMoves(WORDS, "new")).toEqual({
      settled: false,
      next: { to: "shortlist", hire: false },
      back: null,
      skip: null,
      hire: true,
      letGo: true,
      reopen: null,
    });
  });

  it("invited: on to the interview, back to the shortlist", () => {
    const m = offeredMoves(WORDS, "invited");
    expect(m.next).toEqual({ to: "interview", hire: false });
    expect(m.back).toBe("shortlist");
    expect(m.skip).toBeNull();
  });

  it("interview: the trial is next, and it can be skipped straight to the offer", () => {
    const m = offeredMoves(WORDS, "interview");
    expect(m.next).toEqual({ to: "trial", hire: false });
    expect(m.skip).toEqual({ to: "offer", label: "Skip the trial, make an offer" });
  });

  it("offer: the last step is the hire itself, so the menu offers no second hire", () => {
    const m = offeredMoves(WORDS, "offer");
    expect(m.next).toEqual({ to: "hired", hire: true });
    expect(m.hire).toBe(false);
    expect(m.back).toBe("trial");
    expect(m.letGo).toBe(true);
  });

  it("never offers a skip that lands on the hire", () => {
    const words = { ...WORDS, stages: WORDS.stages.map((s) => (s.value === "offer" ? { ...s, skip: "Skip the offer" } : s)) };
    expect(offeredMoves(words, "trial").skip).toBeNull();
  });

  it.each(["hired", "rejected"])("%s: settled, nothing moves but a reopen to the start", (stage) => {
    expect(offeredMoves(WORDS, stage)).toEqual({
      settled: true,
      next: null,
      back: null,
      skip: null,
      hire: false,
      letGo: false,
      reopen: "new",
    });
  });

  it("offers no let-go to a panel whose words have no way out", () => {
    const words = { ...WORDS, stages: WORDS.stages.filter((s) => s.value !== "rejected") };
    expect(offeredMoves(words, "new").letGo).toBe(false);
    expect(walkOf(words).exit).toBeUndefined();
  });

  it("an unknown stage moves like the first", () => {
    expect(offeredMoves(WORDS, "archived").next).toEqual({ to: "shortlist", hire: false });
  });
});

describe("walkPick — what a press on the walk means", () => {
  it("asks before a hire and a let-go, from anywhere", () => {
    expect(walkPick(WORDS, "interview", "hired")).toBe("hire");
    expect(walkPick(WORDS, "interview", "rejected")).toBe("letGo");
    expect(walkPick(WORDS, "hired", "rejected")).toBe("letGo");
  });
  it("reopens a settled file before moving it", () => {
    expect(walkPick(WORDS, "rejected", "interview")).toBe("reopen");
    expect(walkPick(WORDS, "hired", "new")).toBe("reopen");
  });
  it("moves an open file at once", () => {
    expect(walkPick(WORDS, "new", "offer")).toBe("move");
    expect(walkPick(WORDS, "offer", "shortlist")).toBe("move");
  });
});

describe("letterGate — the send stays shut until the letter can go", () => {
  const ready = { canSend: true, mailReady: true };

  it("holds an invitation with no day, time or place, and says what it needs", () => {
    expect(letterGate(WORDS, "invited", {}, ready)).toEqual({ missing: ["a day and a time", "where"], sendable: false });
    expect(letterGate(WORDS, "invited", { day: "2026-10-12" }, ready).missing).toEqual(["a day and a time", "where"]);
  });

  it("opens once the letter has what it needs", () => {
    expect(letterGate(WORDS, "invited", { day: "2026-10-12", time: "10:30", where: "The office" }, ready)).toEqual({ missing: [], sendable: true });
  });

  it("reads a blank answer as missing", () => {
    expect(letterGate(WORDS, "offer", { start: "1 November", salary: "   " }, ready).missing).toEqual(["the salary"]);
  });

  it("stays shut while the panel's mail is not set up, or for someone who may not send", () => {
    const full = { day: "2026-10-12", time: "10:30", where: "The office" };
    expect(letterGate(WORDS, "invited", full, { canSend: true, mailReady: false }).sendable).toBe(false);
    expect(letterGate(WORDS, "invited", full, { canSend: false, mailReady: true }).sendable).toBe(false);
  });

  it("lets a letter that needs nothing go as it is", () => {
    expect(letterGate(WORDS, "rejected", {}, ready)).toEqual({ missing: [], sendable: true });
  });
});

describe("letters", () => {
  it("opens on the letter the stage sends, else the first", () => {
    expect(letterForFile(WORDS, "trial")).toBe("trial");
    expect(letterForFile(WORDS, "shortlist")).toBe("received");
  });

  it("asks each letter only for what it carries, the office filled in", () => {
    const fields = standardLetterFields({ office: "The office, 2nd floor" });
    expect(fields.invited?.map((f) => f.key)).toEqual(["day", "time", "where", "withWhom", "bring"]);
    expect(fields.invited?.find((f) => f.key === "day")?.kind).toBe("day");
    expect(fields.received).toEqual([]);
    expect(startDetails(fields, "invited")).toEqual({ where: "The office, 2nd floor" });
    expect(startDetails(fields, "offer")).toEqual({});
  });

  it("takes a panel's own examples, by field or by letter and field", () => {
    const fields = standardLetterFields({ placeholders: { bring: "Your passport", "hired.bring": "Bank details" } });
    expect(fields.invited?.find((f) => f.key === "bring")?.placeholder).toBe("Your passport");
    expect(fields.hired?.find((f) => f.key === "bring")?.placeholder).toBe("Bank details");
  });

  it("starts empty with no office", () => {
    expect(startDetails(standardLetterFields(), "invited")).toEqual({});
  });
});

describe("readDraft — a kept letter read back", () => {
  it("returns the letter and its words", () => {
    const raw = JSON.stringify({ letter: "offer", details: { start: "1 November", salary: "QAR 8,000" } });
    expect(readDraft(raw, WORDS)).toEqual({ letter: "offer", details: { start: "1 November", salary: "QAR 8,000" } });
  });
  it.each([null, "", "not json", "null", JSON.stringify({ letter: "postcard", details: {} }), JSON.stringify({ details: {} })])(
    "drops %j",
    (raw) => {
      expect(readDraft(raw, WORDS)).toBeNull();
    },
  );
  it("keeps only words from the stored details", () => {
    const raw = JSON.stringify({ letter: "rejected", details: { note: "Thank you", count: 3, nested: { a: 1 } } });
    expect(readDraft(raw, WORDS)?.details).toEqual({ note: "Thank you" });
  });
});

describe("the reader's score", () => {
  it("dots by the two cut-offs when the app gives no rule", () => {
    expect(fitToneOf(WORDS, 90)).toBe("ok");
    expect(fitToneOf(WORDS, 75)).toBe("ok");
    expect(fitToneOf(WORDS, 74)).toBe("warn");
    expect(fitToneOf(WORDS, 50)).toBe("warn");
    expect(fitToneOf(WORDS, 49)).toBe("quiet");
  });
  it("follows a panel's own cut-offs, or its own rule", () => {
    expect(fitToneOf({ ...WORDS, fitCutoffs: [40, 70] }, 70)).toBe("ok");
    expect(fitToneOf({ ...WORDS, fitTone: () => "quiet" }, 99)).toBe("quiet");
  });
});

describe("openings", () => {
  it("counts the questions, not the blank lines", () => {
    expect(questionCount("")).toBe(0);
    expect(questionCount("Do you drive?\n\nWhen could you start?\n  \n")).toBe(2);
    expect(questionCount("One\r\nTwo\r\nThree")).toBe(3);
  });
  it("says a list the way a person does", () => {
    expect(sayList([])).toBe("");
    expect(sayList(["French"])).toBe("French");
    expect(sayList(["French", "Italian"])).toBe("French and Italian");
    expect(sayList(["French", "Italian", "Russian", "Chinese"])).toBe("French, Italian, Russian and Chinese");
    expect(sayList(["أ", "ب"], "و")).toBe("أ و ب");
  });
});
