import { standardLetterFields, type HiringWords, type LetterDetails } from "@socialize/panel-kit/hiring-words";

// A panel's hiring words, the way an app writes them (from team-kit's hiring
// module, or its own lib). No "use client": the list page reads them on the
// server, the drawer in the browser.
const missing = (label: string, value?: string) => (value?.trim() ? [] : [label]);

export const WORDS: HiringWords = {
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
    if (letter === "trial") return [...missing("the brief", d.brief), ...missing("a deadline", d.deadline)];
    if (letter === "offer") return [...missing("a start date", d.start), ...missing("the salary", d.salary)];
    if (letter === "hired") return [...missing("the day", d.when), ...missing("where", d.where)];
    return [];
  },
  fitWord: (score) => (score === null ? "Not read" : score >= 75 ? "Strong" : score >= 50 ? "Possible" : "Weak"),
  hireNote: "A hired candidate's file can no longer be deleted.",
};

export const LETTER_FIELDS = standardLetterFields({ office: "The office, 2nd floor" });

export type Applicant = {
  id: string;
  name: string;
  role: string;
  stage: string;
  fit: number | null;
  rating: number | null;
  applied: string;
  cv: boolean;
  age: number;
};

export const APPLICANTS: Applicant[] = [
  { id: "c1", name: "Mariam Saleh", role: "Office Manager", stage: "interview", fit: 82, rating: 4, applied: "4 Oct", cv: true, age: 29 },
  { id: "c2", name: "Daniel Costa", role: "Office Manager", stage: "new", fit: 58, rating: null, applied: "6 Oct", cv: true, age: 34 },
  { id: "c3", name: "Aisha Rahman", role: "Accountant", stage: "rejected", fit: 31, rating: 2, applied: "1 Oct", cv: false, age: 41 },
  { id: "c4", name: "Leo Martins", role: "Accountant", stage: "offer", fit: null, rating: null, applied: "8 Oct", cv: false, age: 26 },
];
