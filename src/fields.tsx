import { ChevronDown } from "lucide-react";
import { buttonClass, fieldBox, PILL_BUTTON, type ButtonLook } from "./classes";
import { cn } from "./cn";
import { CaretInput, CaretTextarea } from "./caret-safe";
import { GrabResize } from "./grab-resize";
import { Hint } from "./hint";
import { tx } from "./tx";

// The form's pieces: the label, the field, the box, the buttons. Server-safe —
// a server page's form of server actions renders these as they are. Their
// classes on their own (fieldBox, buttonClass) are in classes.ts.

export type { ButtonLook };

// The field label on its own — for controls that can't sit inside Field
// (checkbox groups, custom widgets, fieldset legends). Field uses it too, so
// the two can never drift.
export function Lbl({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("text-[12px] font-medium text-ink/70", className)}>{tx(children)}</span>;
}

export function Field({
  label,
  htmlFor,
  error,
  mark,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  /** A small status chip beside the label — a "Needed" while the field still
   *  blocks the step, the sibling of the green "(optional)". */
  mark?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      {mark ? (
        <span className="flex items-center gap-2">
          <Lbl>{label}</Lbl>
          {mark}
        </span>
      ) : (
        <Lbl>{label}</Lbl>
      )}
      {children}
      {error && <span className="text-[11px] text-danger">{tx(error)}</span>}
    </label>
  );
}

// A caption over a CHOICE — a pill bar, a toggle row — never a <label>: a
// label wrapping radios hands a click on its caption to the first one.
export function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1.5">
      <Lbl>{label}</Lbl>
      {children}
    </div>
  );
}

// Caret-safe by default: the field keeps the cursor where you put it even when
// a background save re-renders the form mid-edit.
export function Input(props: React.ComponentProps<"input">) {
  return <CaretInput {...props} className={cn(fieldBox("md"), props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <GrabResize>
      <CaretTextarea {...props} className={cn(fieldBox("md"), "resize-none", props.className)} />
    </GrabResize>
  );
}

// Wrap a native <select> to give it the panel's chevron — `appearance-none`
// removes the browser's arrow, and nothing drew a replacement before this.
export function SelectBox({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("relative block", className)}>
      {children}
      <ChevronDown
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-ink/40"
      />
    </span>
  );
}

// The browser's own list, for a caller that has not moved to SelectMenu.
export function Select({
  options,
  groups,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options?: { value: string; label: string }[];
  groups?: { label: string; options: { value: string; label: string }[] }[];
}) {
  const option = (o: { value: string; label: string }) => (
    <option key={o.value} value={o.value}>
      {o.label}
    </option>
  );
  return (
    <SelectBox>
      <select {...props} className={cn(fieldBox("md"), "appearance-none pe-8", className)}>
        {groups
          ? groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map(option)}
              </optgroup>
            ))
          : options?.map(option)}
      </select>
    </SelectBox>
  );
}

// How a form-level success reads: a soft ok line, announced to screen readers.
// Renders nothing without a message, so a caller passes the result straight in.
export function FormSuccess({ message, className }: { message?: string | null | false; className?: string }) {
  if (!message) return null;
  return (
    <Hint tone="success" className={cn("rounded-lg bg-ok-soft px-3 py-2", className)}>
      {message}
    </Hint>
  );
}

// How a form-level error reads, everywhere: small, in the danger tone,
// announced. Renders nothing without an error.
export function FormError({ error, className }: { error?: string | null | false; className?: string }) {
  if (!error) return null;
  return (
    <Hint tone="error" className={className}>
      {error}
    </Hint>
  );
}

// The bordered, quiet pill that sits inside content — "Add line", "Mark all
// read" — where Button is a form's primary or footer action.
export function PillButton({ className, type = "button", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} {...props} className={cn(PILL_BUTTON, className)} />;
}

export function Button({
  variant = "primary",
  emphasis = "flat",
  tone = "brand",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonLook) {
  return <button {...props} className={cn(buttonClass({ variant, emphasis, tone, size }), className)} />;
}
