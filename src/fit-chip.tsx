import { fitToneOf, type FitTone, type HiringWords } from "./hiring-words";
import { Chip } from "./status-badge";
import { tx } from "./tx";

// The reader's verdict on a chip, the same in the row and the file: the dot
// says strong, possible or weak at a glance, the chip itself stays neutral.
// Server-safe, like StageChip.
const DOT: Record<FitTone, string> = { ok: "bg-ok", warn: "bg-warn", quiet: "bg-ink/20" };

export function FitChip({
  score,
  words,
  withScore = true,
}: {
  score: number;
  words: Pick<HiringWords, "fitWord" | "fitTone" | "fitCutoffs">;
  /** The number before the word; the file shows the number large beside it, so it leaves it off. */
  withScore?: boolean;
}) {
  const word = words.fitWord(score);
  return (
    <Chip dot={DOT[fitToneOf(words, score)]}>
      {withScore ? (
        <>
          <span className="tabular-nums">{score}</span> · {tx(word)}
        </>
      ) : (
        word
      )}
    </Chip>
  );
}
