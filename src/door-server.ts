import { redirect } from "next/navigation";
import { after } from "next/server";
import { loginWords, readLogin, waitWords, type LinkState, type Login } from "./staff-door";

// The server half of every panel's door (Damine, 7 Oct 2026: "a premium login
// page ... with phone or username or mobile number, remember me, forget
// password and magic link ... unified for all our customers"). What used to be
// X Capital's own (its login actions, staff-login.ts and the confirm route) is
// here once; a panel hands in its own database, sign-in server and mail, and
// wraps the actions in its own "use server" file. The rules for what was typed
// are staff-door.ts, so the forms and the server never disagree.

/** A login found behind what was typed. `mailable` is false for a mobile-only or username-only login with no real inbox. */
export type DoorPerson = { userId: string; email: string; name: string | null; mailable: boolean };

/** The two links a door mails: choosing a new password, and signing in without one. */
export type DoorLink = "recovery" | "magiclink";

type Verdict = { allowed: true } | { allowed: false; waitSeconds: number };

export type DoorDeps = {
  /** The staff login behind what was typed, read with the service key: nobody is signed in yet. */
  find: (login: Login) => Promise<DoorPerson | null>;
  /** The sign-in server's password check; true when it let the person in and set the session. */
  signIn: (email: string, password: string) => Promise<boolean>;
  /** A one-time token for a link of this kind (good for the hour the sign-in server allows), or null. */
  token: (kind: DoorLink, email: string) => Promise<string | null>;
  /** Trades a link's token for a session; true when it worked. */
  verify: (kind: DoorLink, tokenHash: string) => Promise<boolean>;
  /** Mails the person their link, in the panel's own dress. */
  mail: (person: DoorPerson, kind: DoorLink, url: string) => Promise<void>;
  /** "Keep me signed in": false marks the coming session as this browser's only. */
  remember: (keep: boolean) => Promise<void>;
  /** The wrong-tries counter. Left out, the door does not count. */
  attempts?: { take: (bucket: string) => Promise<Verdict>; clear: (bucket: string) => Promise<void> };
  /** The panel's own address, for the links in the mail: https://admin.example.qa. */
  origin: string;
  /** Whether the panel gives its staff usernames. */
  usernames?: boolean;
  /** The panel's dial code and local mobile length, for a bare local number. */
  dial?: string;
  localLength?: number;
  /** The panel's door paths; these are the defaults. */
  paths?: { home?: string; login?: string; setPassword?: string; link?: string };
};

const key = (login: Login) => (login.kind === "email" ? login.email : login.kind === "phone" ? login.phone : login.username);

export function door(deps: DoorDeps) {
  const words = loginWords(deps.usernames);
  const paths = { home: "/", login: "/login", setPassword: "/set-password", link: "/link", ...deps.paths };
  const read = (form: FormData) => readLogin(String(form.get("login") ?? ""), deps.dial, deps.localLength, deps.usernames);
  const take = (bucket: string): Promise<Verdict> => (deps.attempts ? deps.attempts.take(bucket) : Promise.resolve({ allowed: true }));

  /** The address a link opens: the panel's own landing, with the one-time token. */
  function linkUrl(kind: DoorLink, token: string) {
    return `${deps.origin}${paths.link}?token_hash=${encodeURIComponent(token)}&type=${kind}`;
  }

  /**
   * Email, username or mobile, and the password. A wrong login and a wrong
   * password get the same answer, so the door never says who is on the team; a
   * password list tried against one person is stopped within seconds.
   */
  async function signIn(_state: string | null, form: FormData): Promise<string | null> {
    const login = read(form);
    const password = String(form.get("password") ?? "");
    if (!login) return words.missing;
    if (!password) return "Type your password.";

    const bucket = `login:${login.kind}:${key(login)}`;
    const verdict = await take(bucket);
    if (!verdict.allowed) return `Too many tries. Try again ${waitWords(verdict.waitSeconds)}.`;

    await deps.remember(form.get("remember") === "on");
    const person = await deps.find(login);
    if (!person || !(await deps.signIn(person.email, password))) return words.noMatch;

    await deps.attempts?.clear(bucket);
    redirect(paths.home);
  }

  /**
   * A link by email: a reset or a sign-in link. A login with no inbox gets no
   * mail, and the answer is the same "sent" for everyone. It is answered
   * first and looked up after (Next's `after`), so the time the answer takes
   * can't tell a login that exists from one that doesn't.
   */
  async function sendLink(kind: DoorLink, form: FormData): Promise<LinkState> {
    const login = read(form);
    if (!login) return { sent: false, error: words.missing };
    const verdict = await take(`${kind}:${login.kind}:${key(login)}`);
    if (!verdict.allowed) return { sent: false, error: `Too many requests. Try again ${waitWords(verdict.waitSeconds)}.` };

    const mailIt = async () => {
      const person = await deps.find(login);
      if (!person?.mailable) return;
      const token = await deps.token(kind, person.email);
      if (token) await deps.mail(person, kind, linkUrl(kind, token));
    };
    try {
      after(mailIt);
    } catch {
      // Outside a request (a script, a test) there is no answer to give first.
      await mailIt();
    }
    return { sent: true };
  }

  /**
   * Where a link lands, in the panel's route handler (cookies are writable
   * there, so the session holds at once): the token is traded for a session,
   * and the answer is the path to go on to. A path, never an address: the
   * request arrives rewritten from the panel's short paths, and an address
   * built from it can lose the panel's host.
   */
  async function land(params: URLSearchParams): Promise<string> {
    const kind = params.get("type");
    const tokenHash = params.get("token_hash");
    if ((kind !== "recovery" && kind !== "magiclink") || !tokenHash) return `${paths.login}?link=expired`;
    if (!(await deps.verify(kind, tokenHash))) return `${paths.login}?link=expired`;
    return kind === "recovery" ? `${paths.setPassword}?door=reset` : paths.home;
  }

  return {
    signIn,
    forgot: (_state: LinkState, form: FormData) => sendLink("recovery", form),
    magicLink: (_state: LinkState, form: FormData) => sendLink("magiclink", form),
    land,
    linkUrl,
    words,
  };
}

/** The line a door shows after a link that no longer works brought someone back. */
export const EXPIRED_LINK = "That link has expired or was already used. Ask for a fresh one.";
