"use client";

// Built on Radix Dialog, so focus trapping, Escape, the scroll lock and the
// ARIA are handled right — the parts that are easy to get wrong by hand.
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert, Trash2, XCircle, type LucideIcon } from "lucide-react";
import { DIALOG_CONTENT, DIALOG_FRAME, DIALOG_OVERLAY, PANEL_SHELL } from "./classes";
import { cn } from "./cn";
import { Button, Input, Lbl } from "./fields";
import type { HintTone } from "./hint";
import { NoteBox } from "./note-box";
import { usePanelT } from "./panel-provider";
import { Eyebrow, FormBar } from "./record";

// The panel's ONE gate before a consequential tap — Delete, Cancel, Revise,
// Approve & sign all wear it; only the words change (Damine, 24 Aug 2026: one
// component across the panel, never a second grammar). `consequences` are the
// "what happens next" lines, at most a handful; `tone` turns the button to the
// brand for a constructive act (the default danger is for removals).
// `children` seats anything the decision needs first — a reason, a signature.
export type Consequence = { tone: HintTone; text: string };

const CONSEQUENCE: Record<HintTone, { Icon: LucideIcon; cls: string }> = {
  success: { Icon: CheckCircle2, cls: "bg-ok-soft text-ok" },
  error: { Icon: XCircle, cls: "bg-danger-soft text-danger" },
  warn: { Icon: AlertTriangle, cls: "bg-warn-soft text-warn" },
  info: { Icon: CheckCircle2, cls: "bg-ink/[0.06] text-ink/60" },
  busy: { Icon: Loader2, cls: "bg-ink/[0.06] text-ink/60" },
};

/** "What happens next" — one line per thing the act will do, each in a tinted
 *  square so the list reads as a ledger, not loose lines. */
export function ConsequenceList({ items }: { items?: Consequence[] }) {
  const t = usePanelT();
  if (!items?.length) return null;
  return (
    <section className={cn(PANEL_SHELL, "shadow-none")}>
      <Eyebrow size="sm" className="border-b border-ink/[0.06] px-3.5 py-2">
        {t("What happens next")}
      </Eyebrow>
      <ul className="flex flex-col divide-y divide-ink/[0.06]">
        {items.map((c) => {
          const tone = CONSEQUENCE[c.tone];
          return (
            <li key={c.text} className="flex items-start gap-3 px-3.5 py-2.5">
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-md", tone.cls)}>
                <tone.Icon size={13} strokeWidth={2.2} aria-hidden="true" className={cn(c.tone === "busy" && "animate-spin")} />
              </span>
              <span className="pt-0.5 text-[13px] leading-snug text-ink/80">{t(c.text)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  consequences,
  reason,
  confirmLabel = "Delete",
  confirmIcon,
  pendingLabel = "Working…",
  tone = "danger",
  pending = false,
  error = null,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Receives the reason when the gate asks for one. */
  onConfirm: (reason: string) => void;
  title: string;
  body: string;
  consequences?: Consequence[];
  /** The gate asks WHY — for acts that touch money or paper a customer
   *  already holds. The line lands on the record; `required` means the act
   *  won't fire without it. */
  reason?: { label: string; placeholder?: string; required?: boolean };
  confirmLabel?: string;
  confirmIcon?: LucideIcon;
  pendingLabel?: string;
  tone?: "danger" | "brand";
  pending?: boolean;
  error?: string | null;
  children?: React.ReactNode;
}) {
  const t = usePanelT();
  // The header tile wears the act's own glyph; a removal without one wears the
  // bin, a constructive act the shield — the gate never opens faceless.
  const Icon = confirmIcon ?? (tone === "danger" ? Trash2 : ShieldAlert);
  const [why, setWhy] = useState("");
  const needsWhy = !!reason?.required && why.trim().length < 3;
  const close = () => {
    setWhy("");
    onClose();
  };
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY} />
        <Dialog.Content className={cn(DIALOG_FRAME, "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden")}>
          {/* The drawer's header band, shrunk to a gate: the tile, the
              lead-in, the question, and the hairline the drawers wear. */}
          <header className="relative shrink-0 border-b border-ink/[0.08] bg-surface px-5 pb-4 pt-4">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand-deep via-brand-deep/40 to-transparent rtl:bg-gradient-to-l"
            />
            <div className="flex items-center gap-3.5">
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl shadow-tile",
                  tone === "danger" ? "bg-danger text-surface" : "bg-rail text-on-rail",
                )}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-[11px] font-semibold leading-none tracking-[0.02em]",
                    tone === "danger" ? "text-danger" : "text-brand-deep",
                  )}
                >
                  {tone === "danger" ? t("Before you remove it") : t("Before you continue")}
                </p>
                <Dialog.Title className="mt-1 text-[19px] font-semibold leading-tight tracking-[-0.015em] text-ink">
                  {t(title)}
                </Dialog.Title>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-ground px-5 pt-4">
            <Dialog.Description className="text-[13px] leading-relaxed text-ink/70">{t(body)}</Dialog.Description>
            {children ? <div>{children}</div> : null}
            {reason ? (
              <div className="flex flex-col gap-1.5">
                <Lbl>
                  {t(reason.label)}
                  {reason.required ? null : <span className="ms-1 font-normal text-ok">{t("(optional)")}</span>}
                </Lbl>
                <NoteBox
                  name="reason"
                  rows={2}
                  value={why}
                  onChange={setWhy}
                  placeholder={t(reason.placeholder ?? "One line — it goes on the record.")}
                />
              </div>
            ) : null}
            <ConsequenceList items={consequences} />
          </div>

          {/* The drawer's own fused foot — Cancel and the act, equal shares,
              the error riding above them. */}
          <FormBar error={error} className="mt-0 pt-4">
            <Button type="button" size="lg" variant="ghost" onClick={close} disabled={pending}>
              {error ? t("Close") : t("Cancel")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant={tone === "brand" ? "primary" : "danger"}
              emphasis={tone === "brand" ? "gradient" : "flat"}
              onClick={() => onConfirm(why.trim())}
              disabled={pending || !!error || needsWhy}
              title={needsWhy ? t("Say why first") : undefined}
            >
              {pending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Icon size={14} strokeWidth={2} aria-hidden="true" />}
              {pending ? t(pendingLabel) : t(confirmLabel)}
            </Button>
          </FormBar>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// A single-line dialog — the panel's own replacement for window.prompt.
// Submits the trimmed value; empty is allowed when the caller says so.
export function PromptDialog({
  open,
  onClose,
  onSubmit,
  title,
  label,
  placeholder,
  initial = "",
  confirmLabel = "Save",
  allowEmpty = false,
  maxLength = 60,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  label?: string;
  placeholder?: string;
  initial?: string;
  confirmLabel?: string;
  allowEmpty?: boolean;
  maxLength?: number;
}) {
  const t = usePanelT();
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY} />
        <Dialog.Content className={DIALOG_CONTENT} aria-describedby={undefined}>
          <Dialog.Title className="mb-3 text-[16px] font-semibold text-ink">{t(title)}</Dialog.Title>
          {/* Keyed on the initial value so each open starts a fresh field —
              no effect, no stale value. */}
          <PromptBody
            key={`${open}:${initial}`}
            initial={initial}
            label={label}
            placeholder={placeholder}
            confirmLabel={confirmLabel}
            allowEmpty={allowEmpty}
            maxLength={maxLength}
            onCancel={onClose}
            onSubmit={(v) => {
              onSubmit(v);
              onClose();
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Pick one from a short list — instead of asking someone to type a value the
// panel already has (move a file: pick the folder, don't spell it). A
// free-text row below can create a brand-new value.
export function PickDialog({
  open,
  onClose,
  onPick,
  title,
  options,
  currentValue = null,
  newLabel,
  newPlaceholder,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (value: string) => void;
  title: string;
  options: { value: string; label: React.ReactNode }[];
  // The option the item is already in — shown, but disabled and marked.
  currentValue?: string | null;
  // When set, a free-text row below the list creates a brand-new value.
  newLabel?: string;
  newPlaceholder?: string;
}) {
  const t = usePanelT();
  const pick = (v: string) => {
    onPick(v);
    onClose();
  };
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY} />
        <Dialog.Content className={DIALOG_CONTENT} aria-describedby={undefined}>
          <Dialog.Title className="mb-3 text-[16px] font-semibold text-ink">{t(title)}</Dialog.Title>
          <div className="flex max-h-[320px] flex-col gap-1 overflow-y-auto">
            {options.map((o) => {
              const current = currentValue !== null && o.value === currentValue;
              return (
                <button
                  key={o.value}
                  type="button"
                  disabled={current}
                  onClick={() => pick(o.value)}
                  className={
                    current
                      ? "flex items-center gap-2 rounded-lg border border-ink/[0.07] bg-ink/[0.03] px-3 py-2 text-start text-[13px] font-medium text-ink/40"
                      : cn(
                          PANEL_SHELL,
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-start text-[13px] font-medium text-ink/80 shadow-none transition-colors hover:border-brand-deep/50 hover:bg-brand/[0.04] hover:text-brand-deep",
                        )
                  }
                >
                  {o.label}
                  {current ? (
                    <Eyebrow size="sm" className="ms-auto text-current">
                      {t("Current")}
                    </Eyebrow>
                  ) : null}
                </button>
              );
            })}
          </div>
          {newLabel ? <NewValueRow label={newLabel} placeholder={newPlaceholder} onSubmit={pick} /> : null}
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              {t("Cancel")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NewValueRow({ label, placeholder, onSubmit }: { label: string; placeholder?: string; onSubmit: (value: string) => void }) {
  const t = usePanelT();
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  return (
    <form
      className="mt-3 flex items-end gap-2 border-t border-ink/[0.07] pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed) onSubmit(trimmed);
      }}
    >
      <div className="flex-1">
        <Lbl className="mb-1.5 block">{t(label)}</Lbl>
        <Input value={value} maxLength={60} placeholder={placeholder ? t(placeholder) : undefined} onChange={(e) => setValue(e.target.value)} />
      </div>
      <Button type="submit" disabled={!trimmed}>
        {t("Go")}
      </Button>
    </form>
  );
}

function PromptBody({
  initial,
  label,
  placeholder,
  confirmLabel,
  allowEmpty,
  maxLength,
  onCancel,
  onSubmit,
}: {
  initial: string;
  label?: string;
  placeholder?: string;
  confirmLabel: string;
  allowEmpty: boolean;
  maxLength: number;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}) {
  const t = usePanelT();
  const [value, setValue] = useState(initial);
  const trimmed = value.trim();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (allowEmpty || trimmed) onSubmit(trimmed);
      }}
    >
      {label ? <Lbl className="mb-1.5 block">{t(label)}</Lbl> : null}
      <Input
        autoFocus
        value={value}
        maxLength={maxLength}
        placeholder={placeholder ? t(placeholder) : undefined}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("Cancel")}
        </Button>
        <Button type="submit" disabled={!allowEmpty && !trimmed}>
          {t(confirmLabel)}
        </Button>
      </div>
    </form>
  );
}
