"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { usePanelT } from "./panel-provider";
import { PASSWORD_DOOR, PASSWORD_RULE, type LinkState, type PasswordDoor } from "./staff-door";

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
 * with a sliding control the way an iPhone chooses between two views.
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
  magicLink: DoorAction<LinkState>;
  label?: string;
  placeholder?: string;
  forgotHref?: string;
  notice?: string | null;
  mobileOnly?: string;
}) {
  const t = usePanelT();
  const [mode, setMode] = useState<"password" | "link">("password");
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
