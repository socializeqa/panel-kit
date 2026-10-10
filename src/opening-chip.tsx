import { Chip } from "./status-badge";

// An opening on a chip, the same in its row and its drawer: live on the site
// glows ink, a draft or a closed one simply is. Server-safe.
export function OpeningChip({ status, label, live = "open" }: { status: string; label?: string; live?: string }) {
  const word = label ?? (status ? status.charAt(0).toUpperCase() + status.slice(1) : "—");
  return <Chip dot={status === live ? "bg-ink" : "bg-ink/25"}>{word}</Chip>;
}
