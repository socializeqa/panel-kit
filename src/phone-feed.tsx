"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Copy, Smartphone } from "lucide-react";
import { buttonClass } from "./classes";
import { Drawer } from "./drawer";
import { Button, FormError, Input, Lbl } from "./fields";
import { ConfirmDialog } from "./modal";
import { usePanelT } from "./panel-provider";
import { useToast } from "./toast";
import { FEED_WORDS, type FeedWords } from "./calendar-words";

// A person's calendar on their phone: a private link an iPhone, a Mac or
// Google Calendar subscribes to (the app serves it, calendarFile writes it).
// The kit draws the button and the drawer; the app makes the link.

/** The app's way to a person's link: the one they have, or with `fresh` a new one that shuts the old. */
export type FeedLink = (fresh: boolean) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;

/** The drawer's state: open or not, and the person's link once it is made. */
export function usePhoneFeed(feedLink: FeedLink) {
  const [state, setState] = useState<{ isOpen: boolean; url: string | null; error: string | null }>({ isOpen: false, url: null, error: null });
  const [pending, startTransition] = useTransition();
  const load = (fresh: boolean, done?: () => void) =>
    startTransition(async () => {
      const out = await feedLink(fresh);
      setState((s) => (out.ok ? { ...s, url: out.url, error: null } : { ...s, error: out.error }));
      if (out.ok) done?.();
    });
  return {
    ...state,
    pending,
    show: () => {
      setState((s) => ({ ...s, isOpen: true }));
      if (!state.url) load(false);
    },
    close: () => setState((s) => ({ ...s, isOpen: false })),
    renew: (done: () => void) => load(true, done),
  };
}

export type PhoneFeed = ReturnType<typeof usePhoneFeed>;

/** The way to the phone link: at the foot of the calendar's side, and under the calendar on a phone. */
export function PhoneFeedButton({ onClick, words }: { onClick: () => void; words?: Partial<FeedWords> }) {
  const t = usePanelT();
  const w = { ...FEED_WORDS, ...words };
  return (
    <button type="button" onClick={onClick} className="cal-phone">
      <span className="cal-phone-icon">
        <Smartphone className="size-4" strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-col text-start">
        <b>{t(w.button)}</b>
        <span>{t(w.buttonLine)}</span>
      </span>
    </button>
  );
}

/**
 * The phone link's drawer: one tap for an iPhone or a Mac (webcal), one for
 * Google Calendar, or the link to copy into any other calendar, and a new
 * link when the old one got out.
 */
export function PhoneFeedDrawer({ phone, words }: { phone: PhoneFeed; words?: Partial<FeedWords> }) {
  const t = usePanelT();
  const toast = useToast();
  const w = { ...FEED_WORDS, ...words };
  const [confirming, setConfirming] = useState(false);
  const webcal = phone.url?.replace(/^https?:/, "webcal:");
  return (
    <Drawer open={phone.isOpen} onOpenChange={(next) => !next && phone.close()} title={w.title} size="form">
      <div className="flex flex-col gap-6">
        <p className="text-[14px] leading-relaxed text-ink/80">{t(w.lead)}</p>

        {phone.url && webcal ? (
          <>
            <div className="flex flex-col gap-2.5">
              <a href={webcal} className={buttonClass({ size: "lg" })}>
                <CalendarPlus strokeWidth={2} /> {t(w.addApple)}
              </a>
              <a href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noreferrer" className={buttonClass({ variant: "ghost", size: "lg" })}>
                <CalendarPlus strokeWidth={2} /> {t(w.addGoogle)}
              </a>
            </div>

            <label className="flex flex-col gap-1.5">
              <Lbl>{t(w.copyLabel)}</Lbl>
              <div className="flex gap-2">
                <Input readOnly value={phone.url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1" />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(phone.url!);
                      toast(w.copied, "success");
                    } catch {
                      toast(w.copyFailed, "error");
                    }
                  }}
                >
                  <Copy /> {t(w.copy)}
                </Button>
              </div>
            </label>

            <p className="text-[13px] leading-relaxed text-quiet">{t(w.refreshNote)}</p>

            <div className="cal-note">
              <p>{t(w.keepSecret)}</p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)} disabled={phone.pending}>
                {t(w.renew)}
              </Button>
            </div>
          </>
        ) : phone.error ? (
          <FormError error={phone.error} />
        ) : (
          <p className="text-[14px] text-quiet">{t(w.making)}</p>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={w.renewTitle}
        body={w.renewBody}
        confirmLabel={w.renew}
        tone="brand"
        pending={phone.pending}
        onConfirm={() =>
          phone.renew(() => {
            setConfirming(false);
            toast(w.renewed, "success");
          })
        }
      />
    </Drawer>
  );
}
