"use client";

import { Mail, Phone } from "lucide-react";
import { WhatsAppGlyph } from "./brand-glyphs";
import { buttonClass } from "./classes";
import { cn } from "./cn";
import { contactLinks, type ContactWay } from "./contact";
import { usePanelT } from "./panel-provider";

// A record's ways to reach a person — Call, WhatsApp, Email, in the house
// order — as one row of equal buttons a thumb can hit; on a phone each opens
// the phone's own app. A way with nothing behind it is left out, and a person
// with none shows nothing.

const WORDS: Record<ContactWay, string> = { call: "Call", whatsapp: "WhatsApp", email: "Email" };
const COLUMNS = ["", "grid-cols-1", "grid-cols-2", "grid-cols-3"];

function Glyph({ way }: { way: ContactWay }) {
  if (way === "whatsapp") return <WhatsAppGlyph size={15} />;
  const Icon = way === "call" ? Phone : Mail;
  return <Icon size={15} strokeWidth={2} aria-hidden="true" />;
}

export function ContactDoors({
  email,
  phone,
  whatsapp,
  className,
}: {
  email?: string | null;
  phone?: string | null;
  /** Their WhatsApp number, when it isn't the phone. */
  whatsapp?: string | null;
  className?: string;
}) {
  const t = usePanelT();
  const links = contactLinks({ email, phone, whatsapp });
  if (!links.length) return null;
  return (
    <div className={cn("grid gap-2", COLUMNS[links.length], className)}>
      {links.map(({ way, href }) => (
        <a
          key={way}
          href={href}
          target={way === "whatsapp" ? "_blank" : undefined}
          rel="noreferrer"
          className={cn(buttonClass({ variant: "ghost", size: "md" }), "w-full justify-center")}
        >
          <Glyph way={way} /> {t(WORDS[way])}
        </a>
      ))}
    </div>
  );
}
