import { digits } from "@socialize/team-kit/phone";

// How a panel's door reads the person at it, and the password rule every door
// keeps (X Capital, 3 Oct 2026: staff sign in with their email or their
// mobile, start on a password the office hands out, and pick their own at the
// first sign-in). No "use client": the forms and the server actions read the
// same rules, so the door never says yes where the server says no.

/**
 * Who is signing in: an email, a mobile as its digits with the country code, or
 * (in a panel that gives its staff usernames) a username in small letters.
 */
export type Login = { kind: "email"; email: string } | { kind: "phone"; phone: string } | { kind: "username"; username: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A username: a letter first, then letters, digits, dots, dashes or
 * underscores, 3 to 32 in all, kept in small letters. The database keeps the
 * same rule (Inception Elite's admin_users.username, 7 Oct 2026).
 */
export const USERNAME = /^[a-z][a-z0-9._-]{2,31}$/;

/**
 * A mobile the way a panel keeps it: digits with the country code, nothing
 * else. "+974 5512 3456", "00974 55123456" and the bare "5512 3456" a Doha
 * office writes all read 97455123456: a number of a local number's length
 * with no + takes the panel's own dial code.
 */
export function staffPhone(raw: string, dial = "974", localLength = 8): string | null {
  const typed = raw.trim();
  const all = digits(typed).replace(/^00/, "");
  const full = all.length === localLength && !typed.startsWith("+") ? `${dial}${all}` : all;
  return /^\d{8,15}$/.test(full) ? full : null;
}

/**
 * What was typed in the door's one box, read as an email, a mobile or, when the
 * panel takes them, a username. A panel that takes no usernames reads words as
 * nothing, as before 7 Oct 2026, so its door never looks one up.
 */
export function readLogin(raw: string, dial = "974", localLength = 8, usernames = false): Login | null {
  const typed = raw.trim();
  if (typed.includes("@")) return EMAIL.test(typed) ? { kind: "email", email: typed.toLowerCase() } : null;
  if (/\p{L}/u.test(typed)) {
    const username = typed.toLowerCase();
    return usernames && USERNAME.test(username) ? { kind: "username", username } : null;
  }
  const phone = staffPhone(typed, dial, localLength);
  return phone ? { kind: "phone", phone } : null;
}

/** The words a door uses for its one box, by what the panel takes. */
export function loginWords(usernames = false) {
  return usernames
    ? {
        label: "Email, username or mobile",
        missing: "Type your email, your username or your mobile number.",
        noMatch: "Those sign-in details and password don't match.",
      }
    : {
        label: "Email or mobile",
        missing: "Type your email, or your mobile number.",
        noMatch: "That email or mobile and password don't match.",
      };
}

/** How long a closed door stays closed, said plainly: "in 45 seconds", "in 15 minutes". */
export function waitWords(seconds: number): string {
  if (seconds < 60) return `in ${Math.max(1, Math.round(seconds))} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "in a minute" : `in ${minutes} minutes`;
}

/**
 * The sign-in server keys every login by an email, so a person with only a
 * mobile gets one made from it at the panel's own staff domain. Nothing is
 * ever sent there: a reset for that login goes through their manager.
 */
export function phoneLoginEmail(phone: string, domain: string): string {
  return `${phone}@${domain}`;
}

export function isPhoneLoginEmail(email: string, domain: string): boolean {
  return email.toLowerCase().endsWith(`@${domain.toLowerCase()}`);
}

/**
 * What asking for a link (a reset or a sign-in link) comes back as. It never
 * says whether the login exists: the same "sent" whoever asked.
 */
export type LinkState = { sent: true } | { sent: false; error: string } | null;

/** The rule, said once, for the hint under a new password. */
export const PASSWORD_RULE = "At least 10 characters, with a capital, a small letter and a number.";

/**
 * Why a new password won't do, or null when it will. `refused` holds the
 * passwords a person was handed (a panel's starting password): a person who
 * keeps it is still using the office's.
 */
export function passwordProblem(password: string, confirm: string, refused: readonly string[] = []): string | null {
  if (password.length > 72) return "Keep it to 72 characters or fewer.";
  if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Use at least 10 characters, with a capital, a small letter and a number.";
  }
  if (refused.includes(password)) return "Pick a password of your own, not the one you were given.";
  if (password !== confirm) return "The two passwords don't match.";
  return null;
}

/** The four ways a person reaches the new-password door. */
export type PasswordDoor = "first" | "reset" | "change" | "invite";

/** Each way's heading, line and button, so every panel says them the same. */
export const PASSWORD_DOOR: Record<PasswordDoor, { title: string; lead: string; submit: string }> = {
  first: {
    title: "Pick your own password",
    lead: "You signed in with the password you were given. Choose one only you know.",
    submit: "Save and open the panel",
  },
  reset: {
    title: "Choose a new password",
    lead: "Your link worked. Pick the password you'll sign in with from now on.",
    submit: "Save my new password",
  },
  change: {
    title: "Change your password",
    lead: "Type the one you use now, then the new one.",
    submit: "Change my password",
  },
  invite: {
    title: "Set your password",
    lead: "Pick a password to finish setting up your account.",
    submit: "Set my password",
  },
};
