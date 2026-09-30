"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { usePanelT } from "./panel-provider";

// Five stars — read-only for a figure (a feedback score), a radio group for a
// rating someone gives. The stars light up to the one under the pointer or the
// keyboard's focus, so the choice is seen before it is made.
export function StarRating({
  value,
  onChange,
  readOnly = false,
  size,
}: {
  value: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
  size?: number;
}) {
  const t = usePanelT();
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5];

  if (readOnly || !onChange) {
    const px = size ?? 16;
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={t("{n} out of 5", { n: value })}>
        {stars.map((n) => (
          <Star key={n} width={px} height={px} aria-hidden="true" className={n <= value ? "fill-ink text-ink" : "text-ink/25"} />
        ))}
      </span>
    );
  }

  const px = size ?? 28;
  const active = hover || value;
  return (
    <span role="radiogroup" aria-label={t("Rating")} className="inline-flex items-center gap-1">
      {stars.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={n === 1 ? t("1 star") : t("{n} stars", { n })}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          className="rounded-md p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-deep/40"
        >
          <Star width={px} height={px} aria-hidden="true" className={n <= active ? "fill-ink text-ink" : "text-ink/25"} />
        </button>
      ))}
    </span>
  );
}
