import { cn } from "./cn";
import { tx } from "./tx";

// The frame every page outside the panel wears — signing in, setting a
// password: the panel's mark, a heading, one quiet line, then the form.
// X Capital's door (components/admin/door-page.tsx), with the mark handed in:
// the logo is the app's, the frame is everyone's. It carries `kit` itself,
// since a door sits outside the Shell.
export function DoorPage({
  logo,
  title,
  lead,
  children,
  foot,
  headingFont,
}: {
  /** The panel's mark, drawn as it is (an <Image>, an <svg>). */
  logo?: React.ReactNode;
  title: string;
  lead?: string;
  children: React.ReactNode;
  foot?: React.ReactNode;
  /** A display face for the heading only (X Capital's Marcellus), as a
   *  CSS font-family. The door is the one place a panel may show its
   *  brand's face; everything past it reads in the panel's own. */
  headingFont?: string;
}) {
  return (
    <main className="kit grid min-h-dvh place-items-center bg-ground px-5 py-12">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center text-center">
          {logo}
          <h1
            className={cn("text-[24px] text-ink", logo && "mt-10", headingFont ? "font-normal" : "font-semibold tracking-[-0.015em]")}
            style={headingFont ? { fontFamily: headingFont } : undefined}
          >
            {tx(title)}
          </h1>
          {lead ? <p className="mt-1.5 text-[13px] leading-relaxed text-quiet">{tx(lead)}</p> : null}
        </div>
        <div className="mt-9">{children}</div>
        {foot ? <div className="mt-8 text-center text-[12px] text-quiet">{foot}</div> : null}
      </div>
    </main>
  );
}
