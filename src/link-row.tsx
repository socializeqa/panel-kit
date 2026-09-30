import Link from "next/link";
import { cn } from "./cn";

// The clickable record row — a label cluster at the start, a meta cluster at
// the end, a quiet hover. The shape three Elite Touch pages each copy-pasted;
// this is the one. Wrap rows in RowList so the hover pads bleed to the card
// edge. Server-safe.
export function RowList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <ul className={cn("-mx-2 flex flex-col", className)}>{children}</ul>;
}

export function LinkRow({
  href,
  left,
  right,
  className,
}: {
  href: string;
  left: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn("flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-ink/[0.03]", className)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">{left}</span>
        {right ? <span className="flex shrink-0 items-center gap-2">{right}</span> : null}
      </Link>
    </li>
  );
}
