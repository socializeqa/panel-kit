import { cn } from "./cn";
import { SocializeMark } from "./socialize-mark";
import { tx } from "./tx";

/** A picture of the client's world for the door: the whole screen, with the form on glass over it. */
export type DoorScene = {
  /** The picture, filling the screen: the app's own <Image fill className="object-cover" />. */
  picture: React.ReactNode;
  /** The client's mark, drawn light: it heads the glass. */
  mark: React.ReactNode;
  /** A short line for the foot of the screen, across from "Powered by" (the client's address). */
  caption?: React.ReactNode;
  /** The darkening veil over the picture: for a photograph, on by default; a drawn ground (a gradient) leaves it off. */
  veil?: boolean;
  /** The glass's own tint, as a CSS colour with its alpha (a client's dark brand colour); a warm smoky dark by default. */
  glass?: string;
  /** The client's colour, whole: the text on the pill and the knob of the switch. Near black by default. */
  accent?: string;
};

// The frame every page outside the panel wears — signing in, setting a
// password: the panel's mark, a heading, one quiet line, then the form, and at
// the very foot a small "Powered by" with Socialize's mark, the same at every
// client's door. A panel can give its door a scene: its picture (or a drawn
// ground) fills the screen, and the mark, heading and form sit on one floating
// card of glass, Apple's way (Damine, 7 Oct 2026: "it must be like iPhone iOS"):
// round corners, the light catching its rim, the fields grouped in one rounded
// block with their labels inside, an iOS switch, a pill button (kit.css,
// door-card). The glass takes the client's tint. The client's line and
// "Powered by" share the foot. The logo is the app's, the frame is everyone's.
// It carries `kit` itself, since a door sits outside the Shell, and a scene is
// dark whatever the theme: it sits on a picture.
export function DoorPage({
  logo,
  title,
  lead,
  children,
  foot,
  headingFont,
  scene,
}: {
  /** The panel's mark, drawn as it is (an <Image>, an <svg>). Left out when the scene carries it. */
  logo?: React.ReactNode;
  title: string;
  lead?: string;
  children: React.ReactNode;
  foot?: React.ReactNode;
  /** A display face for the heading only (X Capital's Marcellus), as a
   *  CSS font-family. The door is the one place a panel may show its
   *  brand's face; everything past it reads in the panel's own. */
  headingFont?: string;
  scene?: DoorScene;
}) {
  const mark = scene ? null : logo;
  const form = (
    <div className="w-full max-w-[380px]">
      <div className="flex flex-col items-center text-center">
        {mark}
        <h1
          className={cn("text-[24px] text-ink", mark && "mt-10", headingFont ? "font-normal" : "font-semibold tracking-[-0.015em]")}
          style={headingFont ? { fontFamily: headingFont } : undefined}
        >
          {tx(title)}
        </h1>
        {lead ? <p className="mt-1.5 text-[13px] leading-relaxed text-quiet">{tx(lead)}</p> : null}
      </div>
      <div className="mt-9">{children}</div>
      {foot ? <div className="mt-8 text-center text-[12px] text-quiet">{foot}</div> : null}
    </div>
  );

  // Who built the panel, small and the same at every door.
  const poweredBy = (
    <a
      href="https://socialize.qa"
      target="_blank"
      rel="noreferrer"
      className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-quiet/80 transition-colors duration-150 hover:text-ink"
    >
      Powered by
      <SocializeMark className="h-[10px] w-auto translate-y-px" />
    </a>
  );

  if (!scene) {
    return (
      <main className="kit door-plain flex min-h-dvh flex-col bg-ground px-5 pt-12 pb-6">
        <div className="grid flex-1 place-items-center">{form}</div>
        <div className="mt-10 flex justify-center">{poweredBy}</div>
      </main>
    );
  }

  return (
    <main className="kit dark relative isolate flex min-h-dvh flex-col overflow-hidden text-white">
      <div aria-hidden className="absolute inset-0 -z-10">
        {scene.picture}
        {scene.veil === false ? null : <div className="door-veil absolute inset-0" />}
      </div>
      <div className="grid flex-1 place-items-center px-4 py-10">
        <div
          className="door-card w-full max-w-[420px] px-6 pt-9 pb-7 sm:px-9 sm:pt-10 sm:pb-8"
          style={{ ...(scene.glass && { "--door-glass": scene.glass }), ...(scene.accent && { "--door-accent": scene.accent }) } as React.CSSProperties}
        >
          <div className="flex flex-col items-center text-center">
            {scene.mark}
            <h1
              className={cn("mt-7 text-[28px] leading-tight", headingFont ? "font-normal" : "font-semibold tracking-[-0.02em]")}
              style={headingFont ? { fontFamily: headingFont } : undefined}
            >
              {tx(title)}
            </h1>
            {lead ? <p className="mt-2 text-balance text-[14px] leading-relaxed text-white/65">{tx(lead)}</p> : null}
          </div>
          <div className="mt-7">{children}</div>
          {foot ? <div className="mt-6 text-center text-[12px] text-white/50">{foot}</div> : null}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 px-5 pb-6 text-[12px] text-white/55 sm:px-10 sm:pb-7">
        <span className="min-w-0 truncate">{scene.caption}</span>
        {poweredBy}
      </div>
    </main>
  );
}
