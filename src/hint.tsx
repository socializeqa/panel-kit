import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "./cn";
import { tx } from "./tx";

// The one way a form speaks to the person filling it — a quiet line under or
// beside a field, with a glyph and a tone. Info for guidance, success for a
// thing that worked, warn for a half-done state, error for a thing that
// failed, busy while something is being fetched. FormSuccess and FormError
// (fields.tsx) wrap it, so every form-level message is this shape too.
// Server-safe: no state.
export type HintTone = "info" | "success" | "warn" | "error" | "busy";

const TONE: Record<HintTone, { Icon: LucideIcon; color: string; role: "status" | "alert" }> = {
  info: { Icon: Info, color: "text-quiet", role: "status" },
  success: { Icon: CheckCircle2, color: "text-ok", role: "status" },
  warn: { Icon: AlertTriangle, color: "text-warn", role: "alert" },
  error: { Icon: XCircle, color: "text-danger", role: "alert" },
  busy: { Icon: Loader2, color: "text-quiet", role: "status" },
};

export function Hint({
  tone = "info",
  icon,
  className,
  children,
}: {
  tone?: HintTone;
  /** Swap the tone's glyph for a more specific one. */
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  const t = TONE[tone];
  const Icon = icon ?? t.Icon;
  return (
    <p role={t.role} className={cn("inline-flex items-start gap-1.5 text-[12px] leading-snug", t.color, className)}>
      <Icon
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className={cn("mt-px shrink-0", tone === "busy" && "animate-spin")}
      />
      <span>{tx(children)}</span>
    </p>
  );
}
