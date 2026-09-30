"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { PillButton } from "./fields";
import { usePanelT } from "./panel-provider";

// A list that failed to load names what failed and offers a retry, instead of
// leaving a dead red sentence. router.refresh() re-runs the server component,
// so a passing failure recovers in place; a list that loads in the browser
// (Señorritas) hands its own `onRetry`.
export function LoadError({ label, detail, onRetry }: { label: string; detail?: string | null; onRetry?: () => void }) {
  const t = usePanelT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex max-w-xl flex-col items-start gap-3 rounded-panel border border-danger/20 bg-danger/[0.04] px-4 py-3.5">
      <p role="alert" className="text-[13px] leading-relaxed text-danger">
        {t(label)}
        {detail ? `: ${detail}` : "."}
      </p>
      <PillButton
        disabled={pending}
        onClick={() => startTransition(() => (onRetry ? onRetry() : router.refresh()))}
        // Solid on the tint, a steady border — only the wash marks the hover.
        className="bg-surface text-[13px] text-ink hover:border-ink/15 hover:bg-ink/[0.04]"
      >
        <RefreshCw className={pending ? "size-3.5 animate-spin" : "size-3.5"} strokeWidth={2} aria-hidden="true" />
        {pending ? t("Retrying…") : t("Try again")}
      </PillButton>
    </div>
  );
}
