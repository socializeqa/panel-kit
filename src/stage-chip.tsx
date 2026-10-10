import { stageOf, type HiringWords, type StageTone } from "./hiring-words";
import { Chip } from "./status-badge";

// A candidate's stage on a chip, the same in the list's row and in the file.
// The dot carries the meaning (a new knock and a hire are ink, the middle of
// the walk is grey, the rest quiet); the chip stays neutral so a table of
// fifty never shouts. No "use client": a server list draws it with the words
// it read, and only the chip's plain props cross to the browser.
const DOT: Record<StageTone, string> = {
  good: "bg-ink",
  work: "bg-ink/45",
  warn: "bg-warn",
  quiet: "bg-ink/20",
};

export function StageChip({ stage, words }: { stage: string; words: Pick<HiringWords, "stages"> }) {
  const s = stageOf(words, stage);
  return <Chip dot={DOT[s.tone]}>{s.label}</Chip>;
}
