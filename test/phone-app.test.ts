import { describe, expect, it } from "vitest";
import { contactLinks, internationalDigits } from "../src/contact";
import { installWay } from "../src/device";
import { commits, FLICK, lockAxis, rubberband, SLOP, velocityOf } from "../src/gesture";
import { initials } from "../src/initials";

// The brain behind the phone app: the swipe maths, the install advice, the
// contact links, the initials. Fictional numbers only: the kit is public.

describe("lockAxis — a touch picks its axis past the slop", () => {
  it("stays a tap under the slop, and on a tie", () => {
    expect(lockAxis(SLOP - 1, 3)).toBeNull();
    expect(lockAxis(12, -12)).toBeNull();
  });
  it("takes the bigger component", () => {
    expect(lockAxis(14, 4)).toBe("x");
    expect(lockAxis(-3, -20)).toBe("y");
  });
});

describe("rubberband — past the edge it follows less and less", () => {
  it("is nothing at the edge and never reaches the dimension", () => {
    expect(rubberband(0, 400)).toBe(0);
    expect(rubberband(-20, 400)).toBe(0);
    expect(rubberband(10_000, 400)).toBeLessThan(400);
  });
  it("gives less than the finger moved", () => {
    const moved = 120;
    expect(rubberband(moved, 400)).toBeLessThan(moved);
    expect(rubberband(moved, 400)).toBeGreaterThan(0);
  });
});

describe("velocityOf — the speed at release", () => {
  it("reads the recent path, not a stale start", () => {
    const path = [
      { at: 0, value: 0 },
      { at: 500, value: 10 },
      { at: 560, value: 40 },
      { at: 600, value: 80 },
    ];
    // 80 - 10 over the last 100 ms
    expect(velocityOf(path)).toBeCloseTo(70 / 100);
  });
  it("is zero with one sample or none", () => {
    expect(velocityOf([])).toBe(0);
    expect(velocityOf([{ at: 3, value: 9 }])).toBe(0);
  });
});

describe("commits — does a released drag go through", () => {
  it("a slow drag goes past a third of the way", () => {
    expect(commits(150, 0.02, 400)).toBe(true);
    expect(commits(100, 0.02, 400)).toBe(false);
  });
  it("a flick goes however short, a throw back never", () => {
    expect(commits(30, FLICK + 0.05, 400)).toBe(true);
    expect(commits(300, -(FLICK + 0.05), 400)).toBe(false);
  });
  it("nothing goes the wrong way", () => {
    expect(commits(-50, 0.5, 400)).toBe(false);
  });
});

describe("installWay — how this phone puts the panel on its home screen", () => {
  const IPHONE_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
  const IPHONE_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1";
  const IPAD_AS_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
  const ANDROID = "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

  it("Safari on an iPhone or an iPad gets the Share steps", () => {
    expect(installWay({ userAgent: IPHONE_SAFARI, standalone: false })).toBe("ios");
    expect(installWay({ userAgent: IPAD_AS_MAC, standalone: false, touchPoints: 5 })).toBe("ios");
  });
  it("a Mac with no touch, another iOS browser, or an installed app gets nothing", () => {
    expect(installWay({ userAgent: IPAD_AS_MAC, standalone: false, touchPoints: 0 })).toBeNull();
    expect(installWay({ userAgent: IPHONE_CHROME, standalone: false })).toBeNull();
    expect(installWay({ userAgent: IPHONE_SAFARI, standalone: true })).toBeNull();
  });
  it("Android offers its own install only once the browser says it can", () => {
    expect(installWay({ userAgent: ANDROID, standalone: false, canPrompt: true, phone: true })).toBe("prompt");
    expect(installWay({ userAgent: ANDROID, standalone: false, phone: true })).toBeNull();
  });
  it("a computer that offers an install is left alone", () => {
    expect(installWay({ userAgent: ANDROID.replace("Android 15", "Windows NT 10.0"), standalone: false, canPrompt: true, phone: false })).toBeNull();
  });
});

describe("contactLinks — call, WhatsApp, email (the house order)", () => {
  it("builds the three from a stored number", () => {
    expect(contactLinks({ email: "someone@example.com", phone: "+44 20 7946 0018" })).toEqual([
      { way: "call", href: "tel:+442079460018" },
      { way: "whatsapp", href: "https://wa.me/442079460018" },
      { way: "email", href: "mailto:someone@example.com" },
    ]);
  });
  it("uses the WhatsApp number when it differs, and leaves out what is missing", () => {
    expect(contactLinks({ phone: null, whatsapp: "+44 20 7946 0019", email: "not an address" })).toEqual([
      { way: "whatsapp", href: "https://wa.me/442079460019" },
    ]);
    expect(contactLinks({})).toEqual([]);
  });
  it("opens WhatsApp and Email with a reply already typed, and a call with nothing", () => {
    expect(contactLinks({ email: "someone@example.com", phone: "+40 712 345 678", message: { text: "Bună ziua, Ioana!", subject: "Your ring" } })).toEqual([
      { way: "call", href: "tel:+40712345678" },
      { way: "whatsapp", href: "https://wa.me/40712345678?text=Bun%C4%83%20ziua%2C%20Ioana!" },
      { way: "email", href: "mailto:someone@example.com?subject=Your%20ring&body=Bun%C4%83%20ziua%2C%20Ioana!" },
    ]);
    expect(contactLinks({ email: "someone@example.com", message: { text: "  " } })).toEqual([{ way: "email", href: "mailto:someone@example.com" }]);
  });
});

describe("internationalDigits — a number with its country", () => {
  it("keeps a stored or + number as it is", () => {
    expect(internationalDigits("+44 20 7946 0018")).toBe("442079460018");
    expect(internationalDigits("442079460018")).toBe("442079460018");
    expect(internationalDigits("0044 20 7946 0018")).toBe("442079460018");
  });
  it("reads a short number typed without its country in Qatar", () => {
    expect(internationalDigits("1234 5678")).toBe("97412345678");
    expect(internationalDigits("")).toBe("");
  });
});

describe("initials", () => {
  it("two letters from the first two words", () => {
    expect(initials("Lina Maria Haddad")).toBe("LM");
  });
  it("skips a word that doesn't start with a letter", () => {
    expect(initials("Dev (verification)")).toBe("D");
    expect(initials("  ")).toBe("");
  });
  it("reads Arabic letters too", () => {
    expect(initials("سارة أحمد")).toBe("سأ");
  });
});
