"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, FormError, Input, Lbl } from "./fields";
import { PasswordInput } from "./password-input";
import { usePanelT } from "./panel-provider";
import { PASSWORD_DOOR, PASSWORD_RULE, type PasswordDoor } from "./staff-door";

// The forms that go inside a DoorPage: signing in with an email or a mobile,
// asking for a reset link, and choosing a new password. The look and the words
// are everyone's; each panel hands in its own server actions, which keep the
// rules in staff-door.ts. X Capital's doors, 3 Oct 2026.

/** A door's server action: the state it was in, the form, the state it is in now. */
type DoorAction<S> = (state: S, formData: FormData) => Promise<S>;

const QUIET_LINK = "text-[12px] text-ink/60 underline-offset-4 transition-colors duration-150 hover:text-ink hover:underline";

function DoorLink({ href, children }: { href: string; children: string }) {
  const t = usePanelT();
  return (
    <Link href={href} className={QUIET_LINK}>
      {t(children)}
    </Link>
  );
}

/** Email or mobile, and the password. The action answers with a sentence when it refuses. */
export function SignInForm({
  action,
  forgotHref = "/forgot-password",
  placeholder = "you@company.com or 5512 3456",
}: {
  action: DoorAction<string | null>;
  forgotHref?: string;
  placeholder?: string;
}) {
  const t = usePanelT();
  const [error, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <Lbl>Email or mobile</Lbl>
        <Input
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
      </label>

      <label className="flex flex-col gap-1.5">
        <Lbl>Password</Lbl>
        <PasswordInput name="password" autoComplete="current-password" required />
      </label>

      <div className="flex items-center justify-between gap-4">
        <label className="flex w-fit cursor-pointer select-none items-center gap-2.5 text-[13px] text-ink/70">
          {/* style-guard-ignore: a plain value posted with the sign-in; the glass draws it (kit.css, door-glass) */}
          <input type="checkbox" name="remember" defaultChecked className="size-4 cursor-pointer" />
          {t("Keep me signed in")}
        </label>
        <DoorLink href={forgotHref}>Forgot password?</DoorLink>
      </div>

      <FormError error={error} />

      <Button type="submit" disabled={pending} className="mt-1 h-11 w-full">
        {pending ? t("Signing in…") : t("Sign in")}
      </Button>
    </form>
  );
}

/** What a reset request comes back as. It never says whether the login exists. */
export type ForgotState = { sent: true } | { sent: false; error: string } | null;

/** One box for the email or mobile; then the same answer whoever asked. */
export function ForgotForm({ action, backHref = "/login" }: { action: DoorAction<ForgotState>; backHref?: string }) {
  const t = usePanelT();
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-balance text-[14px] leading-relaxed text-ink/85">
          {t("If that login has an email on file, a link to choose a new password is on its way. It works once, within the hour.")}
        </p>
        <p className="text-balance text-[12px] leading-relaxed text-ink/55">
          {t("Signing in with your mobile only? Ask your manager to set a new password for you.")}
        </p>
        <DoorLink href={backHref}>Back to sign in</DoorLink>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <Lbl>Email or mobile</Lbl>
        <Input
          name="login"
          type="text"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          autoFocus
        />
      </label>
      <FormError error={state && !state.sent ? state.error : null} />
      <Button type="submit" disabled={pending} className="mt-1 h-11 w-full">
        {pending ? t("Sending…") : t("Send me a link")}
      </Button>
      <p className="text-center">
        <DoorLink href={backHref}>Back to sign in</DoorLink>
      </p>
    </form>
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
      {door === "change" ? (
        <label className="flex flex-col gap-1.5">
          <Lbl>Current password</Lbl>
          <PasswordInput name="current" autoComplete="current-password" required autoFocus />
        </label>
      ) : null}
      <label className="flex flex-col gap-1.5">
        <Lbl>New password</Lbl>
        <PasswordInput name="password" autoComplete="new-password" required autoFocus={door !== "change"} />
        <span className="text-pretty text-[12px] leading-relaxed text-ink/55">{t(PASSWORD_RULE)}</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <Lbl>Type it again</Lbl>
        <PasswordInput name="confirm" autoComplete="new-password" required />
      </label>
      <FormError error={error} />
      <Button type="submit" disabled={pending} className="mt-1 h-11 w-full">
        {pending ? t("Saving…") : t(PASSWORD_DOOR[door].submit)}
      </Button>
      {backHref ? (
        <p className="text-center">
          <DoorLink href={backHref}>Back to the panel</DoorLink>
        </p>
      ) : null}
    </form>
  );
}
