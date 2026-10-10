"use client";

import { useEffect, useRef, useState } from "react";
import { Share, Smartphone, X } from "lucide-react";
import { buttonClass, CTRL_BTN, PANEL_SHELL } from "./classes";
import { cn } from "./cn";
import { installWay, standalone, type InstallWay } from "./device";
import { usePanel } from "./panel-provider";

// Once, on a phone that could keep the panel on its home screen: how to, in
// that phone's own steps. Alerts on an iPhone only work from the home screen,
// so this is the one nudge the panel gives — on its home page, never over a
// room, and gone for good on this device once closed or done.

const SEEN = "panel-install-tip";

/** Chrome's install offer, held until the person asks for it. */
interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function remember() {
  try {
    localStorage.setItem(SEEN, "1");
  } catch {
    // A private window keeps nothing; the tip may come back there.
  }
}

export function InstallTip() {
  const { install, t } = usePanel();
  const [way, setWay] = useState<InstallWay>(null);
  const offer = useRef<InstallPrompt | null>(null);

  useEffect(() => {
    if (!install) return;
    try {
      if (localStorage.getItem(SEEN)) return;
    } catch {
      // No storage: still worth saying once per visit.
    }
    const read = (canPrompt: boolean) =>
      setWay(
        installWay({
          userAgent: navigator.userAgent,
          standalone: standalone(),
          touchPoints: navigator.maxTouchPoints,
          canPrompt,
          phone: matchMedia("(pointer: coarse)").matches,
        }),
      );
    read(false);
    const onOffer = (e: Event) => {
      // Ours to offer at the right moment, instead of the browser's own bar.
      e.preventDefault();
      offer.current = e as InstallPrompt;
      read(true);
    };
    window.addEventListener("beforeinstallprompt", onOffer);
    return () => window.removeEventListener("beforeinstallprompt", onOffer);
  }, [install]);

  if (!install || !way) return null;
  const close = () => {
    remember();
    setWay(null);
  };
  const add = async () => {
    const event = offer.current;
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") close();
  };

  return (
    <aside className={cn(PANEL_SHELL, "mb-4 flex animate-fade-in items-start gap-3 p-3.5 lg:hidden")}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-deep">
        <Smartphone size={19} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">{t("Keep {name} on your home screen", { name: install.name })}</p>
        {way === "ios" ? (
          <p className="mt-1 text-[13px] leading-snug text-quiet">
            {t("In Safari, tap Share")} <Share size={13} strokeWidth={2} aria-hidden="true" className="inline -translate-y-px" />{" "}
            {t("then Add to Home Screen. It opens like an app, and on an iPhone that's what lets the alerts reach you.")}
          </p>
        ) : (
          <>
            <p className="mt-1 text-[13px] leading-snug text-quiet">{t("It opens like an app, with its alerts.")}</p>
            <button type="button" onClick={() => void add()} className={cn(buttonClass({ size: "sm" }), "mt-2.5")}>
              {t("Add to home screen")}
            </button>
          </>
        )}
      </div>
      <button type="button" onClick={close} aria-label={t("Close")} title={t("Close")} className={cn(CTRL_BTN, "-me-1 -mt-1 border-transparent")}>
        <X aria-hidden="true" />
      </button>
    </aside>
  );
}
