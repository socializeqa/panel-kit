// What kind of phone the panel is open on, read from the browser's own
// words, so the kit can say the right thing about putting the panel on the
// home screen. The rules are pure and take the facts handed in; only
// `standalone()` reads the browser, for browser code.

/** How this browser puts a web app on the home screen:
 *  "ios" — Safari's Share, then Add to Home Screen (and only then alerts);
 *  "prompt" — the browser offers its own install (Chrome, Edge, Samsung);
 *  null — already installed, a computer, or a browser that can't. */
export type InstallWay = "ios" | "prompt" | null;

/** An iPhone, iPad or iPod — an iPad that reports itself as a Mac included
 *  (it gives itself away with touch). */
export function appleTouch(userAgent: string, touchPoints = 0): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1);
}

/** Running from the home screen rather than a browser tab. Browser only. */
export function standalone(): boolean {
  return matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function installWay({
  userAgent,
  standalone: installed,
  touchPoints = 0,
  canPrompt = false,
  phone = false,
}: {
  userAgent: string;
  /** Running from the home screen already (display-mode: standalone). */
  standalone: boolean;
  /** navigator.maxTouchPoints: an iPad reports itself as a Mac, with touch. */
  touchPoints?: number;
  /** The browser fired beforeinstallprompt. */
  canPrompt?: boolean;
  /** A finger is the main pointer (pointer: coarse). A computer's browser
   *  offers installs too, and a desk needs no home screen. */
  phone?: boolean;
}): InstallWay {
  if (installed) return null;
  if (appleTouch(userAgent, touchPoints)) {
    // Only Safari can add to the home screen on iOS 16.3 and earlier, and
    // it is the only one the steps describe.
    return /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent) ? null : "ios";
  }
  return canPrompt && phone ? "prompt" : null;
}
