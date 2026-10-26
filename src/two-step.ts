import { redirect } from "next/navigation";
import { insidePath } from "./action-result";
import { waitWords } from "./staff-door";
import { fill, type Translate } from "./translate";

// Two-step sign-in for every panel: the password, then six digits from an
// authenticator app (Supabase Auth's TOTP factors). Born in Socialize's own
// panel (lib/two-step.ts and its login actions); here once, so a panel hands
// in its session's client and wraps the actions in its own "use server" file.
// The database is the real wall: a panel's has_capability() refuses a session
// that owes its code, so a page that forgot to ask still shows nothing.

/**
 * Where a signed-in session stands:
 * - `passed`: it entered a code this sign-in (aal2);
 * - `owed`: the account has an authenticator app and this session hasn't used it yet;
 * - `none`: no authenticator app on the account.
 */
export type TwoStep = "passed" | "owed" | "none";

type Factor = { id: string; status: string; created_at: string };
type Failure = { message?: string } | null;

/** The part of a Supabase session's client two-step needs (`supabase.auth.mfa`). */
export type MfaClient = {
  auth: {
    mfa: {
      getAuthenticatorAssuranceLevel(): Promise<{ data: { currentLevel: string | null; nextLevel: string | null } | null }>;
      listFactors(): Promise<{ data: { all: Factor[]; totp: Factor[] } | null }>;
      enroll(params: { factorType: "totp"; friendlyName?: string; issuer?: string }): Promise<{ data: { id: string; totp: { qr_code: string; secret: string } } | null; error: Failure }>;
      challengeAndVerify(params: { factorId: string; code: string }): Promise<{ error: Failure }>;
      unenroll(params: { factorId: string }): Promise<{ error: Failure }>;
    };
  };
};

/** The session's own token answers, so asking costs no trip. */
export async function twoStepOf(client: MfaClient): Promise<TwoStep> {
  const { data } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!data) return "none";
  if (data.currentLevel === "aal2") return "passed";
  return data.nextLevel === "aal2" ? "owed" : "none";
}

/** The account's authenticator app, once confirmed with a code, and since when. */
export async function verifiedFactor(client: MfaClient): Promise<{ id: string; since: string } | null> {
  const { data } = await client.auth.mfa.listFactors();
  const factor = data?.totp.find((f) => f.status === "verified");
  return factor ? { id: factor.id, since: factor.created_at } : null;
}

/** Six digits, whatever spacing a phone app or a person put between them. */
export function readCode(raw: FormDataEntryValue | string | null | undefined): string | null {
  const code = String(raw ?? "").replace(/\D/g, "");
  return code.length === 6 ? code : null;
}

/** A new authenticator app's QR (an image's data address) and the key to type when the camera can't read it. */
export type TwoStepCode = { factorId: string; qr: string; secret: string };
export type TwoStepStart = TwoStepCode | { error: string };

type Verdict = { allowed: true } | { allowed: false; waitSeconds: number };

export type TwoStepDeps = {
  /** The signed-in session's client, or null when nobody is signed in or they aren't on the staff list. */
  client: () => Promise<(MfaClient & { userId: string }) | null>;
  /** The name the authenticator app shows beside the six digits ("Lucce"). */
  issuer: string;
  /** The wrong-tries counter. Left out, codes are not counted. */
  attempts?: { take: (bucket: string) => Promise<Verdict>; clear: (bucket: string) => Promise<void> };
  /** Where the panel keeps a line of it (turned on, turned off). Left out, nothing is kept. */
  record?: (userId: string, change: "on" | "off") => Promise<void>;
  /** The panel's paths; these are the defaults. */
  paths?: { home?: string; login?: string };
  /** The person's language, for a sentence with a number in it (how long to wait); English when left out. */
  words?: () => Translate | Promise<Translate>;
};

export function twoStepDoor(deps: TwoStepDeps) {
  const paths = { home: "/", login: "/login", ...deps.paths };
  const take = (bucket: string): Promise<Verdict> => (deps.attempts ? deps.attempts.take(bucket) : Promise.resolve({ allowed: true }));
  const tooMany = async (verdict: Verdict) => {
    if (verdict.allowed) return null;
    const t = deps.words ? await deps.words() : fill;
    return t("Too many tries. Try again {wait}.", { wait: waitWords(verdict.waitSeconds, t) });
  };

  /**
   * The six digits after the password; right, and the session may read the
   * panel. It goes on to `then` when the form carries one (a reset link's new
   * password, which the sign-in server only lets a session past its code
   * choose), otherwise home.
   */
  async function verify(_state: string | null, form: FormData): Promise<string | null> {
    const client = await deps.client();
    if (!client) redirect(paths.login);
    const code = readCode(form.get("code"));
    if (!code) return "Type the six digits the app shows.";
    const bucket = `two-step:${client.userId}`;
    const busy = await tooMany(await take(bucket));
    if (busy) return busy;
    const factor = await verifiedFactor(client);
    if (!factor) redirect(paths.home);
    const { error } = await client.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (error) return "That code didn't match. Try the one showing now.";
    await deps.attempts?.clear(bucket);
    redirect(insidePath(form.get("then")) ?? paths.home);
  }

  /** A fresh code for this account and its QR. A setup left halfway is cleared first: the server refuses a second one. */
  async function begin(): Promise<TwoStepStart> {
    const client = await deps.client();
    if (!client) return { error: "Sign in again to set this up." };
    // Asked of the account, not the session: a session that just turned it off still carries its mark.
    if (await verifiedFactor(client)) return { error: "Two-step sign-in is already on for this account." };
    const { data: factors } = await client.auth.mfa.listFactors();
    for (const factor of factors?.all ?? []) {
      if (factor.status !== "verified") await client.auth.mfa.unenroll({ factorId: factor.id });
    }
    const { data, error } = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "Authenticator app", issuer: deps.issuer });
    if (error || !data) return { error: "The code couldn't be made just now. Try again in a moment." };
    return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
  }

  /** The app's first code confirms it; from then on every sign-in asks for one. */
  async function finish(factorId: string, raw: string): Promise<{ error?: string }> {
    const client = await deps.client();
    if (!client) return { error: "Sign in again to set this up." };
    const code = readCode(raw);
    if (!code) return { error: "Type the six digits the app shows." };
    const bucket = `two-step:${client.userId}`;
    const busy = await tooMany(await take(bucket));
    if (busy) return { error: busy };
    const { error } = await client.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) return { error: "That code didn't match. Try the one showing now." };
    await deps.attempts?.clear(bucket);
    await deps.record?.(client.userId, "on");
    return {};
  }

  /** Takes the app off the account. The sign-in server allows it only from a session that entered its code. */
  async function turnOff(): Promise<{ error?: string }> {
    const client = await deps.client();
    if (!client) return { error: "Sign in again first." };
    const factor = await verifiedFactor(client);
    if (!factor) return {};
    const { error } = await client.auth.mfa.unenroll({ factorId: factor.id });
    if (error) return { error: "It couldn't be turned off just now. Sign in again and retry." };
    await deps.record?.(client.userId, "off");
    return {};
  }

  return { verify, begin, finish, turnOff };
}
