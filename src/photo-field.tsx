"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Download, Eye, ImageUp, Loader2, Trash2 } from "lucide-react";
import { glyphSeat } from "./classes";
import { cn } from "./cn";
import { useMarkDrawerDirty } from "./drawer";
import { FormError } from "./fields";
import { MediaDropZone } from "./media-drop-zone";
import { usePanelT } from "./panel-provider";
import { SeatStrip } from "./seat-strip";

// One photo on a record — a menu item's picture, a promotion's cover.
// Señorritas' piece, built only from the kit: MediaDropZone while there is no
// photo, and the photo itself wearing one SeatStrip — view · download ·
// replace · remove — the row grammar brought onto the picture.
//
// The room supplies `upload` (compress, store, return the public URL); this
// field only holds the URL, so the photo is saved with the record's own Save.
// Removing or replacing never deletes the old file from storage: two records
// may share one file (Señorritas' two branches share their menu photos), and
// a file deleted here would vanish from the other.
export function PhotoField({
  value,
  onChange,
  upload,
  aspect = "aspect-[4/3]",
  fit = "cover",
  position,
  downloadName,
  title = "Add a photo",
  seats,
  overlay,
  className,
}: {
  /** The photo's public URL; "" when there is none. */
  value: string;
  onChange: (url: string) => void;
  /** Stores the picked file and resolves to its public URL. */
  upload: (file: File) => Promise<string>;
  /** The frame's aspect class — the shape the photo is shown in. */
  aspect?: string;
  fit?: "cover" | "contain";
  /** Vertical focus (0–100 %) for a cover-fitted photo. */
  position?: number;
  downloadName?: string;
  title?: string;
  /** Extra seats before the photo's own (a promotion's Reposition). */
  seats?: React.ReactNode;
  /** Drawn over the photo — a reposition layer takes the pointer here. */
  overlay?: React.ReactNode;
  className?: string;
}) {
  const t = usePanelT();
  const markDirty = useMarkDrawerDirty();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const take = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("That file is not a photo — pick a JPG, PNG or WebP."));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const url = await upload(file);
      markDirty();
      onChange(url);
    } catch (e) {
      setError(t("The photo did not upload: {why}.", { why: e instanceof Error ? e.message : t("try again") }));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = value;
    a.download = downloadName ?? "photo.webp";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {value ? (
        <div className={cn("relative overflow-hidden rounded-panel bg-rail", aspect)}>
          <Image
            src={value}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 560px"
            draggable={false}
            className={fit === "cover" ? "object-cover" : "object-contain"}
            style={fit === "cover" && position !== undefined ? { objectPosition: `center ${position}%` } : undefined}
          />
          {overlay}
          {busy ? (
            <span className="absolute inset-0 grid place-items-center bg-rail/55 text-[12px] font-medium text-on-rail">
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                {t("Uploading…")}
              </span>
            </span>
          ) : null}
          <SeatStrip className="absolute end-2 top-2 shadow-panel">
            {seats}
            <button
              type="button"
              onClick={() => window.open(value, "_blank", "noopener,noreferrer")}
              aria-label={t("View the full photo")}
              title={t("View the full photo")}
              className={glyphSeat()}
            >
              <Eye aria-hidden="true" />
            </button>
            <button type="button" onClick={download} aria-label={t("Download the photo")} title={t("Download the photo")} className={glyphSeat()}>
              <Download aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              aria-label={t("Replace the photo")}
              title={t("Replace the photo")}
              className={glyphSeat()}
            >
              <ImageUp aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                markDirty();
                onChange("");
              }}
              disabled={busy}
              aria-label={t("Remove the photo")}
              title={t("Remove the photo")}
              className={glyphSeat("danger")}
            >
              <Trash2 aria-hidden="true" />
            </button>
          </SeatStrip>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            data-dirty-exempt
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => void take(e.target.files?.[0])}
          />
        </div>
      ) : (
        <MediaDropZone
          accept="image/*"
          title={title}
          busy={busy}
          status={busy ? "Uploading…" : null}
          onFiles={(files) => void take(files[0])}
        />
      )}
      <FormError error={error} />
    </div>
  );
}
