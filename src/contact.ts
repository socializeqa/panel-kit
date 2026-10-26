import { COUNTRIES, DEFAULT_COUNTRY, digits, whatsappLink } from "@socialize/team-kit/phone";

// The three ways to reach a person from a record — a call, WhatsApp, email —
// as links a phone opens in its own apps. Built on team-kit's phone helpers,
// the same digits every WhatsApp send uses.

export type ContactWay = "email" | "call" | "whatsapp";

export interface ContactLink {
  way: ContactWay;
  href: string;
}

/** A number with its country code, digits only. Stored numbers already carry
 *  one; a number typed by hand without it (a visitor's "5512 3456") is read
 *  in the team's home country, never as whatever country its first digits
 *  happen to spell. */
export function internationalDigits(raw: string): string {
  const all = digits(raw);
  if (!all) return "";
  const typed = raw.trim();
  if (typed.startsWith("+")) return all;
  if (typed.startsWith("00")) return all.slice(2);
  const home = COUNTRIES.find((c) => c.iso === DEFAULT_COUNTRY);
  return all.length <= 8 && home ? home.dial + all : all;
}

/** A reply made ready in the panel: WhatsApp opens with the text typed in, an
 *  email with the subject and the text. A call carries nothing. */
export interface ContactMessage {
  text: string;
  subject?: string;
}

/** The links a person's details allow, in the house order (call, WhatsApp,
 *  email); a way with nothing behind it is left out. `whatsapp` is their
 *  WhatsApp number when it differs from the phone. */
export function contactLinks({
  email,
  phone,
  whatsapp,
  message,
}: {
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  message?: ContactMessage | null;
}): ContactLink[] {
  const links: ContactLink[] = [];
  const tel = internationalDigits(phone ?? "");
  if (tel) links.push({ way: "call", href: `tel:+${tel}` });
  const wa = internationalDigits(whatsapp || phone || "");
  const text = message?.text.trim() || undefined;
  if (wa) links.push({ way: "whatsapp", href: whatsappLink(wa, text) });
  const mail = email?.trim();
  if (mail && mail.includes("@")) {
    const parts = [message?.subject?.trim() ? `subject=${encodeURIComponent(message.subject.trim())}` : "", text ? `body=${encodeURIComponent(text)}` : ""].filter(Boolean);
    links.push({ way: "email", href: `mailto:${mail}${parts.length ? `?${parts.join("&")}` : ""}` });
  }
  return links;
}
