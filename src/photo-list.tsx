"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Star, Trash2 } from "lucide-react";
import { glyphSeat } from "./classes";
import { cn } from "./cn";
import { useMarkDrawerDirty } from "./drawer";
import { Hint } from "./hint";
import { MediaDropZone } from "./media-drop-zone";
import { usePanelT } from "./panel-provider";
import { SeatStrip } from "./seat-strip";

// A record's photos in the order its website shows them, the first the cover:
// a property's, a piece of jewellery's, a person's one portrait. Dropped
// photos go out one by one through the app's `upload` (which sizes them and
// puts them in its storage) and join the list as they land; the list itself
// is saved with the record's Save, in the hidden field `name`, so a photo
// added and then cancelled never reaches the website. While photos are on
// their way the record's Save waits. Each photo carries its seats: make it
// the cover, move it earlier or later, take it off.
// Born in X Capital's properties (Sep 2026) and copied into Lucce's pieces
// (26 Oct 2026); one part for both from here.

const HOLD = "The photos are still uploading. Save once they are in.";

export function PhotoList<T>({
  value,
  onChange,
  upload,
  keyOf,
  srcOf,
  name = "photos",
  max,
  aspect = "aspect-[4/3]",
  noun = "photo",
  editing,
}: {
  value: T[];
  onChange: (photos: T[]) => void;
  /** Sends one file to storage and answers the photo as the list keeps it. Throws when it fails. */
  upload: (file: File) => Promise<T>;
  /** What tells two photos apart (an id, the address). */
  keyOf: (photo: T) => string;
  /** The address the tile shows: a small size where the app has one. */
  srcOf: (photo: T) => string;
  /** The hidden field the list rides in, as JSON. */
  name?: string;
  max: number;
  /** The tile's shape: a property's photo is landscape, a portrait or a ring is not. */
  aspect?: string;
  noun?: string;
  editing: boolean;
}) {
  const t = usePanelT();
  const markDirty = useMarkDrawerDirty();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  // The latest list, for uploads that finish one after another.
  const current = useRef(value);
  useEffect(() => {
    current.current = value;
  }, [value]);

  // While photos are on their way, Save waits: pressed now, it would keep the list without them.
  const busy = Boolean(status);
  useEffect(() => {
    const form = boxRef.current?.closest("form");
    if (!busy || !form) return;
    const hold = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      setProblem(t(HOLD));
    };
    form.addEventListener("submit", hold);
    return () => form.removeEventListener("submit", hold);
  }, [busy, t]);

  const set = (photos: T[]) => {
    current.current = photos;
    onChange(photos);
    markDirty();
  };

  const add = async (files: File[]) => {
    const photos = files.filter((f) => f.type.startsWith("image/"));
    const images = photos.slice(0, Math.max(0, max - current.current.length));
    setProblem(
      photos.length < files.length
        ? t("Only photos can be added here.")
        : images.length < photos.length
          ? max === 1
            ? t("One {noun} only: take this one off to put another.", { noun: t(noun) })
            : t("{max} photos at most.", { max })
          : null,
    );
    if (!images.length) return;
    let failed = 0;
    for (const [i, file] of images.entries()) {
      setStatus(images.length > 1 ? t("Adding {n} of {total}…", { n: i + 1, total: images.length }) : t("Adding the photo…"));
      try {
        set([...current.current, await upload(file)]);
      } catch {
        failed += 1;
      }
    }
    setStatus(null);
    setProblem((said) => (said === t(HOLD) ? null : said));
    if (failed) setProblem(failed === 1 && images.length === 1 ? t("The {noun} didn't upload. Try again.", { noun: t(noun) }) : t("{failed} of {total} photos didn't upload. Try those again.", { failed, total: images.length }));
  };

  const move = (from: number, to: number) => {
    const next = [...value];
    const [photo] = next.splice(from, 1);
    next.splice(to, 0, photo);
    set(next);
  };

  return (
    <div ref={boxRef} className="flex flex-col gap-3">
      <input type="hidden" name={name} value={JSON.stringify(value)} />
      {value.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((photo, i) => (
            <li key={keyOf(photo)} className={cn("relative overflow-hidden rounded-panel bg-ink/[0.04]", aspect)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={srcOf(photo)} alt="" draggable={false} loading="lazy" className="size-full object-cover" />
              {i === 0 && max > 1 ? <span className="absolute start-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-medium text-ink shadow-kit-panel">{t("Cover")}</span> : null}
              {editing ? (
                <SeatStrip className="absolute end-2 bottom-2 shadow-kit-panel">
                  {/* A list of one has no order: only the bin. */}
                  {max > 1 ? (
                    <>
                      {i > 0 ? (
                        <button type="button" onClick={() => move(i, 0)} aria-label={t("Make it the cover")} title={t("Make it the cover")} className={glyphSeat()}>
                          <Star aria-hidden="true" />
                        </button>
                      ) : null}
                      <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={t("Move earlier")} title={t("Move earlier")} className={glyphSeat()}>
                        <ArrowLeft aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label={t("Move later")} title={t("Move later")} className={glyphSeat()}>
                        <ArrowRight aria-hidden="true" />
                      </button>
                    </>
                  ) : null}
                  <button type="button" onClick={() => set(value.filter((p) => keyOf(p) !== keyOf(photo)))} aria-label={t("Take it off")} title={t("Take it off")} className={glyphSeat("danger")}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </SeatStrip>
              ) : null}
            </li>
          ))}
          {editing && value.length < max ? (
            <li>
              <MediaDropZone variant="tile" busy={busy} status={status} onFiles={add} accept="image/*" compactLabel="Add photos" inputRef={inputRef} className={cn("size-full", aspect)} />
            </li>
          ) : null}
        </ul>
      ) : editing ? (
        <MediaDropZone
          busy={busy}
          status={status}
          onFiles={add}
          accept="image/*"
          title={max === 1 ? t("Drop the {noun} here", { noun: t(noun) }) : t("Drop the photos here")}
          hint={max === 1 ? "or click to choose it." : "or click to choose them. The first one is the cover."}
          inputRef={inputRef}
        />
      ) : (
        <p className="text-[13px] text-quiet">{t("No photos yet.")}</p>
      )}
      {problem ? <Hint tone="warn">{problem}</Hint> : null}
    </div>
  );
}
