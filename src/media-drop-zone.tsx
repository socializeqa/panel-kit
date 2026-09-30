"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "./cn";
import { usePanelT } from "./panel-provider";

// The one place a person adds photos and videos — the same dashed tile
// wherever it sits, so "add media" reads the same everywhere (Damine, 25 Aug
// 2026: "still not our unified components"). Full width when there is nothing
// yet, a quiet square at the end of a grid once media exists. Drag and drop
// lives here too, with the depth counter that keeps the highlight steady while
// the pointer crosses children.
export function MediaDropZone({
  variant = "wide",
  busy = false,
  status,
  onFiles,
  title = "Add photos & videos",
  hint = "drag & drop here, or click to browse",
  compactLabel = "Add media",
  inputRef,
  className,
  accept = "image/*,video/*",
  fill = false,
  action,
}: {
  /** Own the pane: grow to the height there is, centre the composition, and
   *  show the dashed edge only while a drag is over it — an empty tall card
   *  reads as a place, not a broken box. */
  fill?: boolean;
  /** One door under the words — "Add files". */
  action?: React.ReactNode;
  /** What the picker takes — media by default; any file type for a document space. */
  accept?: string;
  /** "wide" = the full-width empty state; "tile" = the square grid tile. */
  variant?: "wide" | "tile";
  busy?: boolean;
  /** What the zone says while busy — "Preparing…", "62%", "Saving…". */
  status?: string | null;
  onFiles: (files: File[]) => void;
  title?: string;
  hint?: string;
  compactLabel?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  className?: string;
}) {
  const t = usePanelT();
  const ownRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? ownRef;
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const pick = (list: FileList | null) => {
    const media = accept === "image/*,video/*";
    const files = Array.from(list ?? []).filter((f) => !media || /^(image|video)\//.test(f.type));
    if (files.length) onFiles(files);
    if (ref.current) ref.current.value = "";
  };
  const wide = variant === "wide";
  const pct = status && /^\d+%$/.test(status);

  return (
    <label
      className={cn(
        "cursor-pointer rounded-panel border border-dashed transition-colors",
        wide ? "grid place-items-center px-4 py-5" : "grid aspect-square place-items-center",
        fill && "min-h-[240px] flex-1 py-10",
        dragging
          ? "border-brand-deep bg-brand/[0.06] text-brand-deep"
          : fill
            ? "border-transparent text-quiet hover:border-ink/15 hover:text-brand-deep"
            : "border-ink/20 text-quiet hover:border-brand-deep/50 hover:bg-brand/[0.03] hover:text-brand-deep",
        busy && "pointer-events-none opacity-60",
        className,
      )}
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        if (!busy) pick(e.dataTransfer.files);
      }}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple
        data-dirty-exempt
        className="sr-only"
        onChange={(e) => pick(e.target.files)}
      />
      <span className={cn("flex flex-col items-center gap-1 text-center text-[11px] font-medium", fill && "max-w-[360px] gap-2")}>
        {busy && pct ? (
          <span className="text-[15px] font-bold tabular-nums text-brand-deep">{status}</span>
        ) : busy ? (
          <Loader2 size={18} className="animate-spin text-brand-deep" aria-hidden="true" />
        ) : fill ? (
          <span className="mb-1 grid size-12 place-items-center rounded-2xl bg-ink/[0.05] text-ink/55">
            <ImagePlus size={22} strokeWidth={1.8} aria-hidden="true" />
          </span>
        ) : (
          <ImagePlus size={wide ? 22 : 18} strokeWidth={1.8} aria-hidden="true" />
        )}
        {busy ? (
          status ? t(status) : null
        ) : wide ? (
          <>
            <span className={cn("text-[12px]", fill && "text-[14px] font-semibold text-ink/80")}>{t(title)}</span>
            <span className={cn("font-normal text-quiet", fill && "text-[12px] leading-relaxed")}>{t(hint)}</span>
            {action ? (
              <span className="mt-2" onClick={(e) => e.preventDefault()}>
                {action}
              </span>
            ) : null}
          </>
        ) : (
          t(compactLabel)
        )}
      </span>
    </label>
  );
}
