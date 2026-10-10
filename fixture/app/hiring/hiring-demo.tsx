"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import type { ActionResult } from "@socialize/panel-kit/action-result";
import { CandidateFile } from "@socialize/panel-kit/candidate-file";
import { Drawer } from "@socialize/panel-kit/drawer";
import { Button } from "@socialize/panel-kit/fields";
import { HiringTools } from "@socialize/panel-kit/hiring-tools";
import { LetterComposer } from "@socialize/panel-kit/letter-composer";
import { OpeningForm, type OpeningRecord, type OpeningSaveResult } from "@socialize/panel-kit/opening-form";
import { Panel } from "@socialize/panel-kit/record";
import { APPLICANTS, LETTER_FIELDS, WORDS } from "./words";

// The browser half of the hiring rooms: a candidate's file with its letters,
// an opening on file and a new one, and the list's bulk tools, each in a
// controlled drawer so they can be clicked for real. Every write answers ok
// after a beat, the way a server action would.
const wait = () => new Promise((done) => setTimeout(done, 400));
const ok = async (): Promise<ActionResult> => {
  await wait();
  return { ok: true };
};
const saveOpening = async (_prev: OpeningSaveResult | null, fd: FormData): Promise<OpeningSaveResult> => {
  await wait();
  return { ok: true, id: String(fd.get("id") || "o9") };
};

const OPENING: OpeningRecord = {
  id: "o1",
  slug: "office-manager",
  title: "Office Manager",
  department: "Operations",
  employment_type: "full_time",
  location: "Doha, Qatar",
  summary: "Keep a busy office running.",
  description: "You run the office day to day.",
  salary_min: 8000,
  salary_max: 10000,
  questions: [{ prompt: "When could you start?" }],
  translations: { fr: { title: "Responsable de bureau", source: "older" } },
  status: "open",
  applicants: 12,
  waiting: 3,
};

const TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "internship", label: "Internship" },
];
const LOCALES = [
  { value: "fr", label: "French" },
  { value: "it", label: "Italian" },
];

export function HiringDemo() {
  const [open, setOpen] = useState<"file" | "opening" | "new" | null>(null);
  const [stage, setStage] = useState("interview");
  const close = (o: boolean) => !o && setOpen(null);
  const candidate = APPLICANTS[0]!;
  return (
    <Panel title="Hiring rooms">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen("file")}>
          Open a candidate
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen("opening")}>
          Open an opening
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen("new")}>
          New opening
        </Button>
        <HiringTools
          words={WORDS}
          candidates={APPLICANTS.map((a) => ({ id: a.id, name: a.name, stage: a.stage, fitScore: a.fit }))}
          exportHref="/hiring/export"
          canManage
          onLetGo={ok}
        />
      </div>

      <Drawer open={open === "file"} onOpenChange={close} title="Candidate" padded={false}>
        <CandidateFile
          words={WORDS}
          candidate={{
            id: candidate.id,
            name: candidate.name,
            email: "mariam@example.com",
            phone: "+974 0000 0000",
            stage,
            rating: candidate.rating,
            fitScore: candidate.fit,
            fitVerdict: "Five years running an office of thirty; the answers are specific and calm.",
            answers: [
              { prompt: "When could you start?", answer: "In two weeks" },
              { prompt: "Do you hold a Qatari driving licence?", answer: "Yes" },
            ],
            coverNote: "I would love to bring order to a growing team.",
          }}
          sub={`${candidate.role} · applied ${candidate.applied}`}
          facts={[
            { label: "Age", value: candidate.age },
            { label: "Came from", value: "Careers page" },
            { label: "Applied", value: candidate.applied },
          ]}
          papers={{ cv: "/hiring/c1/cv", portfolio: { href: "https://example.com/work", label: "example.com/work" } }}
          notes={[{ id: "n1", body: "Strong first call. Asked about the team size.", by: "Dev Socialize", when: "5 Oct 2026" }]}
          story={[
            { id: "e3", kind: "stage", summary: "Moved to Interview", when: "6 Oct 2026", by: "Dev Socialize" },
            { id: "e2", kind: "email", summary: "Emailed: Interview invitation", when: "5 Oct 2026", by: "Dev Socialize" },
            { id: "e1", kind: "applied", summary: "Applied", when: "4 Oct 2026", by: candidate.name, byKind: "customer" },
          ]}
          language={{
            value: "en",
            options: [
              { value: "en", label: "English" },
              { value: "ar", label: "Arabic" },
            ],
            onChange: ok,
          }}
          canManage
          onMove={async (to) => {
            await wait();
            setStage(to);
            return { ok: true };
          }}
          onRate={ok}
          onAddNote={ok}
          remove={{ action: ok }}
          letters={
            <LetterComposer
              words={WORDS}
              fields={LETTER_FIELDS}
              stage={stage}
              name={candidate.name}
              email="mariam@example.com"
              language="English"
              draftKey={`fixture-letter:${candidate.id}`}
              canSend
              sent={[{ id: "s1", line: "Emailed: Interview invitation", at: "5 Oct", by: "Dev Socialize", fate: "Delivered" }]}
              onPreview={async (letter) => {
                await wait();
                return { ok: true, subject: `Your ${letter} letter`, html: "<p style='font-family:sans-serif'>Dear Mariam, …</p>" };
              }}
              onSend={ok}
            />
          }
          headerActions={null}
        />
      </Drawer>

      <Drawer open={open === "opening"} onOpenChange={close} title="Opening" padded={false}>
        <OpeningForm
          opening={OPENING}
          action={saveOpening}
          listHref="/hiring/openings"
          employmentTypes={TYPES}
          locales={LOCALES}
          englishMark={() => "now"}
          onDraft={async () => {
            await wait();
            return { ok: true, words: { fr: { title: "Responsable de bureau" }, it: { title: "Responsabile d'ufficio" } } };
          }}
          publicUrl={(slug) => `https://example.com/careers/${slug}`}
          extra={
            <p className="inline-flex items-center gap-1.5 text-[12px] text-quiet">
              <Globe size={14} aria-hidden="true" /> A panel's own field sits here.
            </p>
          }
        />
      </Drawer>

      <Drawer open={open === "new"} onOpenChange={close} title="New opening" padded={false}>
        <OpeningForm opening={null} action={saveOpening} listHref="/hiring/openings" employmentTypes={TYPES} arabic={false} />
      </Drawer>
    </Panel>
  );
}
