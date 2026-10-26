"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Check, ChevronRight, Copy, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { usePanelT } from "./panel-provider";
import { PASSWORD_DOOR, PASSWORD_RULE, type LinkState, type PasswordDoor } from "./staff-door";
import type { TwoStepCode, TwoStepStart } from "./two-step";

// The forms that go inside a DoorPage: signing in with an email, a mobile or a
// username, asking for a reset link or a sign-in link, and choosing a new
// password. The look and the words are everyone's; each panel hands in its own
// server actions (door-server.ts builds them), which keep the rules in
// staff-door.ts. X Capital's doors, 3 Oct 2026; the username and the sign-in
// link, 7 Oct 2026, for every panel; Apple's shapes the same day (Damine: "it
// must be like iPhone iOS"): the fields grouped in one rounded block with their
// labels inside, an iOS switch, a pill, and DoorSignIn's two ways in behind one
// sliding control (kit.css, the door).

/** A door's server action: the state it was in, the form, the state it is in now. */
type DoorAction<S> = (state: S, formData: FormData) => Promise<S>;

function DoorLink({ href, children }: { href: string; children: string }) {
  const t = usePanelT();
  return (
    <Link href={href} className="door-link">
      {t(children)}
    </Link>
  );
}

/** A refusal, or the line a spent link brought back: said once, under the fields. */
function DoorNote({ text }: { text?: string | null | false }) {
  const t = usePanelT();
  if (!text) return null;
  return (
    <p role="alert" className="door-note">
      {t(text)}
    </p>
  );
}

/** A row of the fields' block: its name is the placeholder, and the label for screen readers. */
function Row({ label, placeholder, ...input }: { label: string } & React.ComponentProps<"input">) {
  const t = usePanelT();
  return (
    <label className="door-row">
      <span className="door-row-label">{t(label)}</span>
      <input {...input} placeholder={placeholder ?? t(label)} />
    </label>
  );
}

/**
 * Who is signing in: the one box every door asks first. It keeps what was
 * typed (a form clears its free fields after each answer), so a refused
 * password costs the password only.
 */
function LoginRow({ label, placeholder }: { label: string; placeholder?: string }) {
  const [value, setValue] = useState("");
  return (
    <Row
      label={label}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      name="login"
      type="text"
      inputMode="email"
      autoComplete="username"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      placeholder={placeholder}
      required
      autoFocus
    />
  );
}

/** A password row with its own show / hide eye. */
function PasswordRow({ label, name, autoComplete, autoFocus }: { label: string; name: string; autoComplete: string; autoFocus?: boolean }) {
  const t = usePanelT();
  const [show, setShow] = useState(false);
  const words = show ? t("Hide password") : t("Show password");
  return (
    <label className="door-row">
      <span className="door-row-label">{t(label)}</span>
      <input name={name} type={show ? "text" : "password"} autoComplete={autoComplete} placeholder={t(label)} required autoFocus={autoFocus} />
      <button type="button" className="door-eye" onClick={() => setShow((s) => !s)} aria-label={words} aria-pressed={show} title={words}>
        {show ? <EyeOff className="size-[18px]" strokeWidth={1.8} /> : <Eye className="size-[18px]" strokeWidth={1.8} />}
      </button>
    </label>
  );
}

function Cta({ pending, idle, busy }: { pending: boolean; idle: string; busy: string }) {
  const t = usePanelT();
  return (
    <button type="submit" disabled={pending} className="door-cta">
      {pending ? t(busy) : t(idle)}
    </button>
  );
}

/** The calm answer after a link was asked for: the same whoever asked. */
function Sent({ line, quiet, backHref }: { line: string; quiet: string; backHref?: string | null }) {
  const t = usePanelT();
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="door-sent">
        <Check className="size-6" strokeWidth={2.2} />
      </span>
      <p className="text-balance text-[15px] leading-relaxed text-[var(--door-ink)]">{t(line)}</p>
      <p className="text-balance text-[13px] leading-relaxed text-[var(--door-quiet)]">{t(quiet)}</p>
      {backHref ? <DoorLink href={backHref}>Back to sign in</DoorLink> : null}
    </div>
  );
}

/**
 * The login (email or mobile, or username where the panel gives them) and the
 * password, "Keep me signed in" and "Forgot password?". The action answers
 * with a sentence when it refuses. With `magicHref` the door also links to a
 * sign-in by email; DoorSignIn puts both on one card instead.
 */
export function SignInForm({
  action,
  forgotHref = "/forgot-password",
  magicHref,
  label = "Email or mobile",
  placeholder,
  notice,
}: {
  action: DoorAction<string | null>;
  forgotHref?: string;
  magicHref?: string;
  label?: string;
  placeholder?: string;
  /** A line to show before anyone has typed: a link that no longer works brought them back. */
  notice?: string | null;
}) {
  const t = usePanelT();
  const [error, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="door-group">
        <LoginRow label={label} placeholder={placeholder} />
        <PasswordRow label="Password" name="password" autoComplete="current-password" />
      </div>

      <div className="flex items-center justify-between gap-4 px-1">
        <label className="door-switch">
          {/* style-guard-ignore: a real checkbox posted with the sign-in, hidden under the iOS switch drawn over it (kit.css, door-switch) */}
          <input type="checkbox" name="remember" defaultChecked />
          <span aria-hidden className="door-switch-track" />
          {t("Keep me signed in")}
        </label>
        <DoorLink href={forgotHref}>Forgot password?</DoorLink>
      </div>

      <DoorNote text={error ?? notice} />
      <Cta pending={pending} idle="Sign in" busy="Signing in…" />

      {magicHref ? (
        <p className="text-center">
          <DoorLink href={magicHref}>Email me a sign-in link instead</DoorLink>
        </p>
      ) : null}
    </form>
  );
}

/** What a reset request comes back as. It never says whether the login exists. */
export type ForgotState = LinkState;

/** One box for the email or mobile; then the same answer whoever asked. */
export function ForgotForm({
  action,
  backHref = "/login",
  label = "Email or mobile",
  mobileOnly = "Signing in with your mobile only? Ask your manager to set a new password for you.",
}: {
  action: DoorAction<ForgotState>;
  backHref?: string;
  label?: string;
  /** The line for staff with no email, who get no link: who sets their password in this panel. */
  mobileOnly?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  if (state?.sent) {
    return (
      <Sent
        line="If that login has an email on file, a link to choose a new password is on its way. It works once, within the hour."
        quiet={mobileOnly}
        backHref={backHref}
      />
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="door-group">
        <LoginRow label={label} />
      </div>
      <DoorNote text={state && !state.sent ? state.error : null} />
      <Cta pending={pending} idle="Send me a link" busy="Sending…" />
      <p className="text-center">
        <DoorLink href={backHref}>Back to sign in</DoorLink>
      </p>
    </form>
  );
}

/**
 * A sign-in link by email: one box, then the same answer whoever asked. The
 * link signs the person straight in, once, within the hour. `backHref` null
 * leaves out the way back (DoorSignIn has its own control).
 */
export function MagicLinkForm({
  action,
  backHref = "/login",
  label = "Email or mobile",
  placeholder,
  mobileOnly = "Signing in with your mobile only? Use your password, or ask your manager for help.",
}: {
  action: DoorAction<LinkState>;
  backHref?: string | null;
  label?: string;
  placeholder?: string;
  /** The line for staff with no email, who get no link. */
  mobileOnly?: string;
}) {
  const t = usePanelT();
  const [state, formAction, pending] = useActionState(action, null);
  if (state?.sent) {
    return (
      <Sent line="If that login has an email on file, a sign-in link is on its way. It works once, within the hour." quiet={mobileOnly} backHref={backHref} />
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="door-group">
        <LoginRow label={label} placeholder={placeholder} />
      </div>
      <p className="px-1 text-[13px] leading-relaxed text-[var(--door-quiet)]">
        {t("We'll email you a link that signs you straight in, no password needed. It works once, within the hour.")}
      </p>
      <DoorNote text={state && !state.sent ? state.error : null} />
      <Cta pending={pending} idle="Email me a sign-in link" busy="Sending…" />
      {backHref ? (
        <p className="text-center">
          <DoorLink href={backHref}>Sign in with a password instead</DoorLink>
        </p>
      ) : null}
    </form>
  );
}

/**
 * Both ways in on one card: a password, or a sign-in link by email, chosen
 * with a sliding control the way an iPhone chooses between two views. Without
 * `magicLink` (a panel whose email isn't sending yet) the card is the password
 * alone, so it never offers a link that can't arrive.
 */
export function DoorSignIn({
  signIn,
  magicLink,
  label = "Email or mobile",
  placeholder,
  forgotHref = "/forgot-password",
  notice,
  mobileOnly,
}: {
  signIn: DoorAction<string | null>;
  magicLink?: DoorAction<LinkState>;
  label?: string;
  placeholder?: string;
  forgotHref?: string;
  notice?: string | null;
  mobileOnly?: string;
}) {
  const t = usePanelT();
  const [mode, setMode] = useState<"password" | "link">("password");
  if (!magicLink) return <SignInForm action={signIn} label={label} placeholder={placeholder} forgotHref={forgotHref} notice={notice} />;
  return (
    <div className="flex flex-col gap-5">
      <div className="door-segments" data-at={mode === "link" ? 1 : 0} role="group" aria-label={t("How to sign in")}>
        <span aria-hidden className="door-segments-thumb" />
        <button type="button" aria-pressed={mode === "password"} onClick={() => setMode("password")}>
          {t("Password")}
        </button>
        <button type="button" aria-pressed={mode === "link"} onClick={() => setMode("link")}>
          {t("Email link")}
        </button>
      </div>
      {/* One height for both views, the password's, so the card never jumps as they swap. */}
      <div key={mode} className="door-swap min-h-[202px]">
        {mode === "password" ? (
          <SignInForm action={signIn} label={label} placeholder={placeholder} forgotHref={forgotHref} notice={notice} />
        ) : (
          <MagicLinkForm action={magicLink} label={label} placeholder={placeholder} backHref={null} mobileOnly={mobileOnly} />
        )}
      </div>
    </div>
  );
}

/**
 * The new password, typed twice, with the rule under it. Changing one from
 * inside the panel asks for the current one first. `door` rides along so the
 * action knows which way the person came.
 */
export function NewPasswordForm({
  action,
  door,
  backHref,
}: {
  action: DoorAction<string | null>;
  door: PasswordDoor;
  /** A way out, for a person who opened the door from inside the panel. */
  backHref?: string;
}) {
  const t = usePanelT();
  const [error, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="door" value={door} />
      <div className="door-group">
        {door === "change" ? <PasswordRow label="Current password" name="current" autoComplete="current-password" autoFocus /> : null}
        <PasswordRow label="New password" name="password" autoComplete="new-password" autoFocus={door !== "change"} />
        <PasswordRow label="Type it again" name="confirm" autoComplete="new-password" />
      </div>
      <p className="px-1 text-pretty text-[13px] leading-relaxed text-[var(--door-quiet)]">{t(PASSWORD_RULE)}</p>
      <DoorNote text={error} />
      <Cta pending={pending} idle={PASSWORD_DOOR[door].submit} busy="Saving…" />
      {backHref ? (
        <p className="text-center">
          <DoorLink href={backHref}>Back to the panel</DoorLink>
        </p>
      ) : null}
    </form>
  );
}

/** The code box: six digits, spaced however the app or the person likes. */
function CodeRow() {
  return (
    <Row
      label="The six digits"
      name="code"
      placeholder="123 456"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9 ]{6,7}"
      maxLength={7}
      required
      autoFocus
      className="door-code"
    />
  );
}

/**
 * The second step of a sign-in with two-step on: the password is done, the
 * six digits from the authenticator app come next. The panel shows nothing
 * to the session until they do (twoStepDoor's `verify`). `lost` names who
 * resets the app when the phone is gone.
 */
export function TwoStepForm({
  action,
  signOut,
  lost = "Lost your phone? An owner can reset your two-step sign-in in Team.",
}: {
  action: DoorAction<string | null>;
  signOut: () => void | Promise<void>;
  lost?: string;
}) {
  const t = usePanelT();
  const [error, formAction, pending] = useActionState(action, null);
  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <p className="px-1 text-pretty text-[14px] leading-relaxed text-[var(--door-quiet)]">{t("Open your authenticator app and type the six digits it shows.")}</p>
        <div className="door-group">
          <CodeRow />
        </div>
        <DoorNote text={error} />
        <Cta pending={pending} idle="Enter" busy="Checking…" />
      </form>
      <p className="px-1 text-center text-pretty text-[13px] leading-relaxed text-[var(--door-quiet)]">{t(lost)}</p>
      <form action={signOut} className="text-center">
        <button type="submit" className="door-link">
          {t("Sign out")}
        </button>
      </form>
    </div>
  );
}

/**
 * Turning two-step on, in three plain moves: show the code, scan it with an
 * authenticator app, type the six digits back. `begin` and `finish` are the
 * panel's actions (twoStepDoor); `doneHref` is where it goes once it's on.
 */
export function TwoStepSetup({
  begin,
  finish,
  doneHref,
  backHref,
}: {
  begin: () => Promise<TwoStepStart>;
  finish: (factorId: string, code: string) => Promise<{ error?: string }>;
  doneHref: string;
  backHref?: string;
}) {
  const t = usePanelT();
  const router = useRouter();
  const [code, setCode] = useState<TwoStepCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const back = backHref ? (
    <p className="text-center">
      <DoorLink href={backHref}>Back to the panel</DoorLink>
    </p>
  ) : null;

  if (!code) {
    return (
      <div className="flex flex-col gap-4">
        <ol className="flex flex-col gap-2 px-1 text-pretty text-[14px] leading-relaxed text-[var(--door-quiet)]">
          <li>{t("1. Install an authenticator app if you have none: Google Authenticator, Microsoft Authenticator or 1Password.")}</li>
          <li>{t("2. Press Show my code, then scan it with the app.")}</li>
          <li>{t("3. Type the six digits the app shows. From then on, every sign-in asks for them.")}</li>
        </ol>
        <DoorNote text={error} />
        <button
          type="button"
          disabled={pending}
          className="door-cta"
          onClick={() =>
            start(async () => {
              setError(null);
              const made = await begin();
              if ("error" in made) setError(made.error);
              else setCode(made);
            })
          }
        >
          {pending ? t("Making your code…") : t("Show my code")}
        </button>
        {back}
      </div>
    );
  }

  const grouped = code.secret.match(/.{1,4}/g)?.join(" ") ?? code.secret;
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const typed = String(new FormData(event.currentTarget).get("code") ?? "");
        start(async () => {
          setError(null);
          const done = await finish(code.factorId, typed);
          if (done.error) return setError(done.error);
          router.push(doneHref);
          router.refresh();
        });
      }}
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* A data address made for this account: nothing for an image service to do. */}
        <img src={code.qr} alt={t("QR code to scan with your authenticator app")} width={168} height={168} className="door-qr sentry-block" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 text-[13px] leading-relaxed text-[var(--door-quiet)]">
          <p>{t("Scan this with your authenticator app.")}</p>
          <p>{t("Can't scan it? Type this key into the app instead:")}</p>
          <div className="flex items-center gap-2">
            <span className="sentry-mask select-all break-all text-[14px] font-semibold text-[var(--door-ink)]">{grouped}</span>
            <button
              type="button"
              className="door-copy"
              aria-label={t("Copy the key")}
              title={t("Copy the key")}
              onClick={async () => {
                await navigator.clipboard.writeText(code.secret);
                setCopied(true);
              }}
            >
              {copied ? <Check className="size-4" strokeWidth={2} /> : <Copy className="size-4" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>
      <div className="door-group">
        <CodeRow />
      </div>
      <DoorNote text={error} />
      <Cta pending={pending} idle="Turn it on" busy="Checking…" />
      {back}
    </form>
  );
}

/**
 * Two-step is on: since when, and the way to turn it off, asked twice (once
 * to arm, once to mean it). `since` comes formatted in the panel's own words.
 */
export function TwoStepOff({
  since,
  turnOff,
  backHref,
}: {
  since: string;
  turnOff: () => Promise<{ error?: string }>;
  backHref?: string;
}) {
  const t = usePanelT();
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-4">
      <p className="px-1 text-pretty text-[14px] leading-relaxed text-[var(--door-quiet)]">
        {t("On since {since}. Every sign-in asks for the six digits from your authenticator app.", { since })}
      </p>
      <DoorNote text={error} />
      {armed ? (
        <>
          <p className="px-1 text-pretty text-[14px] leading-relaxed text-[var(--door-ink)]">{t("Your password alone will open the panel again.")}</p>
          <button
            type="button"
            disabled={pending}
            className="door-cta"
            onClick={() =>
              start(async () => {
                const done = await turnOff();
                if (done.error) return setError(done.error);
                router.refresh();
              })
            }
          >
            {pending ? t("Turning it off…") : t("Yes, turn it off")}
          </button>
          <p className="text-center">
            <button type="button" className="door-link" onClick={() => setArmed(false)} disabled={pending}>
              {t("Keep it on")}
            </button>
          </p>
        </>
      ) : (
        <button type="button" className="door-cta-quiet" onClick={() => setArmed(true)}>
          {t("Turn it off")}
        </button>
      )}
      {backHref ? (
        <p className="text-center">
          <DoorLink href={backHref}>Back to the panel</DoorLink>
        </p>
      ) : null}
    </div>
  );
}

/**
 * A person's own sign-in, from their name at the foot of the menu: the
 * password, and two-step on or off, each a row that opens its own door.
 */
export function SignInSettings({
  passwordHref,
  twoStepHref,
  twoStepOn,
  backHref,
}: {
  passwordHref: string;
  twoStepHref: string;
  twoStepOn: boolean;
  backHref?: string;
}) {
  const t = usePanelT();
  const chevron = <ChevronRight className="size-4 shrink-0 text-[var(--door-quiet)] rtl:-scale-x-100" strokeWidth={2} aria-hidden />;
  return (
    <div className="flex flex-col gap-4">
      <nav className="door-group" aria-label={t("Your sign-in")}>
        <Link href={passwordHref} className="door-row-link">
          <KeyRound className="size-[18px] shrink-0 text-[var(--door-quiet)]" strokeWidth={1.8} aria-hidden />
          {t("Password")}
          <span className="door-row-value">{t("Change")}</span>
          {chevron}
        </Link>
        <Link href={twoStepHref} className="door-row-link">
          <ShieldCheck className="size-[18px] shrink-0 text-[var(--door-quiet)]" strokeWidth={1.8} aria-hidden />
          {t("Two-step sign-in")}
          <span className="door-row-value">{twoStepOn ? t("On") : t("Off")}</span>
          {chevron}
        </Link>
      </nav>
      {backHref ? (
        <p className="text-center">
          <DoorLink href={backHref}>Back to the panel</DoorLink>
        </p>
      ) : null}
    </div>
  );
}
