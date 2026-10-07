import { describe, expect, it, vi } from "vitest";

// redirect() ends a server action by throwing; here it throws a marked error the
// tests can read, so "signed in" is a thrown redirect to the panel's home.
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw Object.assign(new Error(`redirect ${path}`), { path });
  },
}));

const { door } = await import("../src/door-server");
const { readLogin, loginWords, waitWords } = await import("../src/staff-door");

/**
 * Every panel's door, run against a pretend panel: one login (Sara, email,
 * mobile and username, password "Right-Pass-1") and one mobile-only login with
 * no inbox. What it proves: each way of saying who you are finds the same
 * person, a wrong login and a wrong password read the same, links go only to a
 * real inbox and the answer never says who exists, and a link lands where it
 * should.
 */
const SARA = { userId: "u1", email: "sara@example.com", name: "Sara", mailable: true };
const MOBILE_ONLY = { userId: "u2", email: "97455500000@staff.example.com", name: "Omar", mailable: false };

function panel(over: Partial<Parameters<typeof door>[0]> = {}) {
  const mails: { to: string; kind: string; url: string }[] = [];
  const kept: boolean[] = [];
  const deps: Parameters<typeof door>[0] = {
    origin: "https://admin.example.qa",
    usernames: true,
    find: async (login) => {
      if (login.kind === "email" && login.email === SARA.email) return SARA;
      if (login.kind === "phone" && login.phone === "97455512345") return SARA;
      if (login.kind === "username" && login.username === "sara") return SARA;
      if (login.kind === "phone" && login.phone === "97455500000") return MOBILE_ONLY;
      return null;
    },
    signIn: async (email, password) => email === SARA.email && password === "Right-Pass-1",
    token: async (kind, email) => `tok-${kind}-${email.length}`,
    verify: async (_kind, tokenHash) => tokenHash.startsWith("tok-"),
    mail: async (person, kind, url) => {
      mails.push({ to: person.email, kind, url });
    },
    remember: async (keep) => {
      kept.push(keep);
    },
    ...over,
  };
  return { gate: door(deps), mails, kept };
}

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
};

async function signsIn(promise: Promise<unknown>) {
  try {
    await promise;
    return null;
  } catch (thrown) {
    return (thrown as { path?: string }).path ?? null;
  }
}

describe("readLogin with usernames", () => {
  it("reads a username only where the panel gives them", () => {
    expect(readLogin("Sara.M", "974", 8, true)).toEqual({ kind: "username", username: "sara.m" });
    expect(readLogin("Sara.M")).toBeNull();
  });

  it("still reads emails and mobiles first", () => {
    expect(readLogin("sara@example.com", "974", 8, true)).toEqual({ kind: "email", email: "sara@example.com" });
    expect(readLogin("5551 2345", "974", 8, true)).toEqual({ kind: "phone", phone: "97455512345" });
  });

  it("refuses what is not a username", () => {
    for (const typed of ["ab", "9sara", "sara m", "sara!", "a".repeat(33), "call 55123456"]) {
      expect(readLogin(typed, "974", 8, true)).toBeNull();
    }
  });
});

describe("the door's words", () => {
  it("name what the panel takes", () => {
    expect(loginWords(true).label).toBe("Email, username or mobile");
    expect(loginWords(false).label).toBe("Email or mobile");
  });

  it("say a wait plainly", () => {
    expect(waitWords(45)).toBe("in 45 seconds");
    expect(waitWords(60)).toBe("in a minute");
    expect(waitWords(900)).toBe("in 15 minutes");
  });
});

describe("signing in", () => {
  it("lets the same person in by email, mobile or username", async () => {
    for (const login of ["Sara@Example.com", "+974 5551 2345", "5551 2345", "sara"]) {
      const { gate } = panel();
      expect(await signsIn(gate.signIn(null, form({ login, password: "Right-Pass-1", remember: "on" })))).toBe("/");
    }
  });

  it("gives a wrong login and a wrong password the same answer", async () => {
    const { gate } = panel();
    const wrongPassword = await gate.signIn(null, form({ login: "sara", password: "nope" }));
    const nobody = await gate.signIn(null, form({ login: "nobody", password: "Right-Pass-1" }));
    expect(wrongPassword).toBe(loginWords(true).noMatch);
    expect(nobody).toBe(wrongPassword);
  });

  it("asks for what is missing", async () => {
    const { gate } = panel();
    expect(await gate.signIn(null, form({ login: "", password: "x" }))).toBe(loginWords(true).missing);
    expect(await gate.signIn(null, form({ login: "sara", password: "" }))).toBe("Type your password.");
  });

  it("keeps the session only when Keep me signed in is ticked", async () => {
    const { gate, kept } = panel();
    await signsIn(gate.signIn(null, form({ login: "sara", password: "Right-Pass-1", remember: "on" })));
    await signsIn(gate.signIn(null, form({ login: "sara", password: "Right-Pass-1" })));
    expect(kept).toEqual([true, false]);
  });

  it("closes the door when the counter says so, and clears it on the way in", async () => {
    const cleared: string[] = [];
    const closed = panel({ attempts: { take: async () => ({ allowed: false, waitSeconds: 60 }), clear: async () => {} } });
    expect(await closed.gate.signIn(null, form({ login: "sara", password: "Right-Pass-1" }))).toBe("Too many tries. Try again in a minute.");
    const open = panel({ attempts: { take: async () => ({ allowed: true }), clear: async (b) => void cleared.push(b) } });
    await signsIn(open.gate.signIn(null, form({ login: "sara", password: "Right-Pass-1" })));
    expect(cleared).toEqual(["login:username:sara"]);
  });
});

describe("links by email", () => {
  it("mails a sign-in link to a real inbox, at the panel's own landing", async () => {
    const { gate, mails } = panel();
    expect(await gate.magicLink(null, form({ login: "sara" }))).toEqual({ sent: true });
    expect(mails).toEqual([{ to: SARA.email, kind: "magiclink", url: "https://admin.example.qa/link?token_hash=tok-magiclink-16&type=magiclink" }]);
  });

  it("answers the same whoever asked, and mails no one who has no inbox", async () => {
    const { gate, mails } = panel();
    expect(await gate.forgot(null, form({ login: "nobody@example.com" }))).toEqual({ sent: true });
    expect(await gate.forgot(null, form({ login: "5550 0000" }))).toEqual({ sent: true });
    expect(mails).toEqual([]);
  });

  it("lands a reset on the new-password door and a sign-in link at home", async () => {
    const { gate } = panel();
    expect(await gate.land(new URLSearchParams("token_hash=tok-1&type=recovery"))).toBe("/set-password?door=reset");
    expect(await gate.land(new URLSearchParams("token_hash=tok-1&type=magiclink"))).toBe("/");
  });

  it("sends a spent or strange link back to the door", async () => {
    const { gate } = panel();
    for (const query of ["token_hash=bad&type=magiclink", "token_hash=tok-1&type=signup", "type=recovery"]) {
      expect(await gate.land(new URLSearchParams(query))).toBe("/login?link=expired");
    }
  });
});
