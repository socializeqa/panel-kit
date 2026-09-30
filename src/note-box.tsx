import { fieldBox } from "./classes";
import { cn } from "./cn";
import { CaretTextarea } from "./caret-safe";
import { Eyebrow } from "./record";

// A writing box with an optional caption ABOVE it — a small column head in the
// eyebrow voice, never inside the field (a chip in the corner once sat on top
// of the writing; Damine, 24 Aug 2026). A fused pair in a JoinedRow reads as
// two headed columns. It draws no grab bar of its own: the caller wraps it
// (or the JoinedRow) in GrabResize, which drags every textarea inside together
// and remembers the height. For one long text use Textarea, which carries its
// own GrabResize.
export function NoteBox({
  id,
  name,
  caption,
  placeholder,
  defaultValue,
  value,
  onChange,
  rows = 3,
  dir,
  className,
}: {
  id?: string;
  name: string;
  caption?: string;
  placeholder?: string;
  defaultValue?: string;
  /** Controlled when the host fills it in code (a model, a reset). */
  value?: string;
  onChange?: (next: string) => void;
  rows?: number;
  dir?: "auto" | "ltr" | "rtl";
  className?: string;
}) {
  return (
    <span className="flex min-w-0 flex-col gap-1">
      {caption ? (
        <Eyebrow size="sm" className="px-1">
          {caption}
        </Eyebrow>
      ) : null}
      <CaretTextarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        dir={dir}
        placeholder={placeholder}
        className={cn(fieldBox("md"), "h-full resize-none", className)}
      />
    </span>
  );
}
