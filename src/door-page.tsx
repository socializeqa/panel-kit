import { cn } from "./cn";
import { SocializeMark } from "./socialize-mark";
import { tx } from "./tx";

/** A picture of the client's world for the door: beside the form on a wide screen, above it on a phone. */
export type DoorScene = {
  /** The picture, filling its side: the app's own <Image fill className="object-cover" />. */
  picture: React.ReactNode;
  /** The client's mark, drawn light: it sits on the picture. */
  mark: React.ReactNode;
  /** A line or two for the picture's foot (a wide screen only). */
  caption?: React.ReactNode;
};

// The frame every page outside the panel wears — signing in, setting a
// password: the panel's mark, a heading, one quiet line, then the form, and at
// the very foot a small "Powered by" with Socialize's mark, the same at every
// client's door. A panel can give its door a scene: a picture of its own
// world beside the form, under a veil that keeps its mark and line legible,
// with the mark on the picture instead of over the form. X Capital's door
// (components/admin/door-page.tsx), with the mark handed in: the logo is the
// app's, the frame is everyone's. It carries `kit` itself, since a door sits
// outside the Shell.
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
      className="mx-auto inline-flex items-center gap-1.5 text-[11px] text-quiet/80 transition-colors duration-150 hover:text-ink"
    >
      Powered by
      <SocializeMark className="h-[10px] w-auto translate-y-px" />
    </a>
  );

  if (!scene) {
    return (
      <main className="kit flex min-h-dvh flex-col bg-ground px-5 pt-12 pb-6">
        <div className="grid flex-1 place-items-center">{form}</div>
        <div className="mt-10 flex">{poweredBy}</div>
      </main>
    );
  }

  return (
    <main className="kit grid min-h-dvh bg-ground lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <section aria-hidden className="relative isolate h-[34svh] min-h-60 overflow-hidden lg:h-auto lg:min-h-dvh">
        {scene.picture}
        {/* The veil: darker at the top for the mark and at the foot for the line, the picture clear between. */}
        <div className="door-veil absolute inset-0" />
        <div className="relative flex h-full flex-col items-center justify-center p-8 text-white lg:items-start lg:justify-between lg:p-14">
          {scene.mark}
          {scene.caption ? <div className="max-lg:hidden">{scene.caption}</div> : null}
        </div>
      </section>
      <div className="flex flex-col px-5 pt-10 pb-6 lg:px-12 lg:pt-12">
        <div className="grid flex-1 place-items-center">{form}</div>
        <div className="mt-10 flex">{poweredBy}</div>
      </div>
    </main>
  );
}
