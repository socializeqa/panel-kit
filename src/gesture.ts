// The arithmetic behind a thumb's swipe, shared by every gesture in the kit —
// the drawer that slides away, the sheet that drops, a calendar that turns
// its days — so they all decide alike. No DOM here; it is tested on its own.

/** Movement before a touch picks an axis; under it a tap stays a tap. */
export const SLOP = 10;

/** A release this fast (px per ms) the closing way goes through however short
 *  the drag: a thumb that throws the drawer means it. */
export const FLICK = 0.11;

/** Which axis a touch is travelling once it has moved past the slop, or null
 *  while it is still a tap. The bigger component wins; a tie stays undecided. */
export function lockAxis(dx: number, dy: number): "x" | "y" | null {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < SLOP || ax === ay) return null;
  return ax > ay ? "x" : "y";
}

/** Past its edge a dragged thing follows less and less, the way real things
 *  slow before they stop (Apple's rubber band). Never more than `dimension`. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  if (overshoot <= 0 || dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * overshoot);
}

/** One reading of a drag: where it was along its axis, and when (ms). */
export interface Sample {
  at: number;
  value: number;
}

/** The speed at release, px per ms, over the last `window` ms of the path. A
 *  finger that stopped before lifting reads 0, not the speed it once had. */
export function velocityOf(samples: readonly Sample[], window = 100): number {
  const last = samples[samples.length - 1];
  if (!last) return 0;
  const first = samples.find((s) => last.at - s.at <= window) ?? last;
  const span = last.at - first.at;
  return span > 0 ? (last.value - first.value) / span : 0;
}

/**
 * Whether a released drag goes through. `distance` and `velocity` are signed
 * along the closing way (positive = toward closing); `size` is how far the
 * thing would travel to be gone. A flick decides on its own either way; a
 * slow release goes through past `share` of the way.
 */
export function commits(distance: number, velocity: number, size: number, share = 0.35): boolean {
  if (distance <= 0 || velocity < -FLICK) return false;
  return velocity > FLICK || distance >= size * share;
}
