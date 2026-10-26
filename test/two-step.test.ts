import { describe, expect, it, vi } from "vitest";
import { readCode, twoStepDoor, twoStepOf, verifiedFactor, type MfaClient } from "../src/two-step";

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

type Factor = { id: string; status: string; created_at: string };

/** A session's mfa client with the factors and the level it is given, recording what was asked of it. */
function fake(opts: { level?: [string | null, string | null]; factors?: Factor[]; goodCode?: string }) {
  let factors = [...(opts.factors ?? [])];
  const calls: string[] = [];
  const client: MfaClient & { userId: string } = {
    userId: "u1",
    auth: {
      mfa: {
        getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: opts.level?.[0] ?? "aal1", nextLevel: opts.level?.[1] ?? "aal1" } }),
        listFactors: async () => ({ data: { all: factors, totp: factors } }),
        enroll: async () => {
          calls.push("enroll");
          factors.push({ id: "new", status: "unverified", created_at: "2026-10-26T12:00:00Z" });
          return { data: { id: "new", totp: { qr_code: "data:image/svg+xml;utf-8,<svg/>", secret: "ABCDEFGHIJKLMNOP" } }, error: null };
        },
        challengeAndVerify: async ({ factorId, code }) => {
          calls.push(`verify:${factorId}:${code}`);
          if (code !== (opts.goodCode ?? "123456")) return { error: { message: "Invalid TOTP code entered" } };
          factors = factors.map((f) => (f.id === factorId ? { ...f, status: "verified" } : f));
          return { error: null };
        },
        unenroll: async ({ factorId }) => {
          calls.push(`unenroll:${factorId}`);
          factors = factors.filter((f) => f.id !== factorId);
          return { error: null };
        },
      },
    },
  };
  return { client, calls };
}

const verified: Factor = { id: "f1", status: "verified", created_at: "2026-10-01T09:00:00Z" };
const form = (code: string) => {
  const fd = new FormData();
  fd.set("code", code);
  return fd;
};

describe("readCode", () => {
  it("takes six digits however they are spaced", () => {
    expect(readCode("123 456")).toBe("123456");
    expect(readCode(" 12-34-56 ")).toBe("123456");
  });
  it("refuses anything that isn't six digits", () => {
    expect(readCode("12345")).toBeNull();
    expect(readCode("1234567")).toBeNull();
    expect(readCode(null)).toBeNull();
  });
});

describe("where a session stands", () => {
  it("reads the session's level", async () => {
    expect(await twoStepOf(fake({ level: ["aal2", "aal2"] }).client)).toBe("passed");
    expect(await twoStepOf(fake({ level: ["aal1", "aal2"] }).client)).toBe("owed");
    expect(await twoStepOf(fake({ level: ["aal1", "aal1"] }).client)).toBe("none");
  });
  it("finds the confirmed app and since when", async () => {
    expect(await verifiedFactor(fake({ factors: [verified] }).client)).toEqual({ id: "f1", since: "2026-10-01T09:00:00Z" });
    expect(await verifiedFactor(fake({ factors: [{ ...verified, status: "unverified" }] }).client)).toBeNull();
  });
});

describe("twoStepDoor", () => {
  it("clears a setup left halfway before making a new code", async () => {
    const { client, calls } = fake({ factors: [{ id: "old", status: "unverified", created_at: "x" }] });
    const started = await twoStepDoor({ client: async () => client, issuer: "Lucce" }).begin();
    expect(calls).toEqual(["unenroll:old", "enroll"]);
    expect(started).toMatchObject({ factorId: "new", secret: "ABCDEFGHIJKLMNOP" });
  });

  it("won't make a second app for an account that has one", async () => {
    const { client } = fake({ factors: [verified] });
    expect(await twoStepDoor({ client: async () => client, issuer: "Lucce" }).begin()).toEqual({ error: "Two-step sign-in is already on for this account." });
  });

  it("turns it on with the right code and keeps a line of it", async () => {
    const { client } = fake({});
    const record = vi.fn(async () => {});
    const flow = twoStepDoor({ client: async () => client, issuer: "Lucce", record });
    const started = await flow.begin();
    if ("error" in started) throw new Error(started.error);
    expect(await flow.finish(started.factorId, "000000")).toEqual({ error: "That code didn't match. Try the one showing now." });
    expect(record).not.toHaveBeenCalled();
    expect(await flow.finish(started.factorId, "123 456")).toEqual({});
    expect(record).toHaveBeenCalledWith("u1", "on");
  });

  it("counts wrong codes and stops when the counter says so", async () => {
    const { client, calls } = fake({ factors: [verified] });
    const flow = twoStepDoor({ client: async () => client, issuer: "Lucce", attempts: { take: async () => ({ allowed: false, waitSeconds: 120 }), clear: async () => {} } });
    expect(await flow.verify(null, form("123456"))).toMatch(/^Too many tries/);
    expect(calls).toEqual([]);
  });

  it("lets the session in with the right code, and says so plainly when it's wrong", async () => {
    const { client } = fake({ factors: [verified], level: ["aal1", "aal2"] });
    const flow = twoStepDoor({ client: async () => client, issuer: "Lucce", paths: { home: "/" } });
    expect(await flow.verify(null, form("999999"))).toBe("That code didn't match. Try the one showing now.");
    expect(await flow.verify(null, form("12345"))).toBe("Type the six digits the app shows.");
    await expect(flow.verify(null, form("123456"))).rejects.toThrow("redirect:/");
  });

  it("sends someone who isn't signed in back to the door", async () => {
    const flow = twoStepDoor({ client: async () => null, issuer: "Lucce" });
    await expect(flow.verify(null, form("123456"))).rejects.toThrow("redirect:/login");
    expect(await flow.begin()).toEqual({ error: "Sign in again to set this up." });
  });

  it("turns it off and keeps a line of it", async () => {
    const { client, calls } = fake({ factors: [verified] });
    const record = vi.fn(async () => {});
    expect(await twoStepDoor({ client: async () => client, issuer: "Lucce", record }).turnOff()).toEqual({});
    expect(calls).toEqual(["unenroll:f1"]);
    expect(record).toHaveBeenCalledWith("u1", "off");
  });
});
