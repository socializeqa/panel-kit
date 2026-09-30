"use client";

import { useLayoutEffect, useRef } from "react";

// Controlled <input>/<textarea> whose caret can't be yanked to the end by an
// async re-render. A form re-renders while you type — a save status flips, a
// live socket refreshes — and React re-applies the field's `value`, resetting
// the caret. These remember the selection on every interaction and restore it
// after a render if it drifted, so the cursor stays where you put it. IME
// composition (Arabic, handwriting) is left alone — restoring mid-compose
// breaks input. Elite Touch's report editor, where it was found.

function useCaret<T extends HTMLInputElement | HTMLTextAreaElement>() {
  const ref = useRef<T | null>(null);
  const sel = useRef<{ s: number; e: number } | null>(null);
  const composing = useRef(false);

  const remember = () => {
    const el = ref.current;
    if (!el || composing.current || document.activeElement !== el) return;
    // selectionStart is null for input types without a caret; only track a real one.
    if (el.selectionStart != null) sel.current = { s: el.selectionStart, e: el.selectionEnd ?? el.selectionStart };
  };

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || composing.current || document.activeElement !== el || !sel.current) return;
    if (el.selectionStart !== sel.current.s || el.selectionEnd !== sel.current.e) {
      try {
        el.setSelectionRange(sel.current.s, sel.current.e);
      } catch {
        // The input type doesn't support a selection.
      }
    }
  });

  return { ref, composing, remember };
}

export function CaretTextarea(props: React.ComponentPropsWithoutRef<"textarea">) {
  const { ref, composing, remember } = useCaret<HTMLTextAreaElement>();
  return (
    <textarea
      {...props}
      ref={ref}
      onChange={(e) => { props.onChange?.(e); remember(); }}
      onSelect={(e) => { props.onSelect?.(e); remember(); }}
      onKeyUp={(e) => { props.onKeyUp?.(e); remember(); }}
      onClick={(e) => { props.onClick?.(e); remember(); }}
      onCompositionStart={(e) => { composing.current = true; props.onCompositionStart?.(e); }}
      onCompositionEnd={(e) => { composing.current = false; props.onCompositionEnd?.(e); remember(); }}
    />
  );
}

// Takes a host ref too (React 19 passes it as a prop) — a drawer's footer
// focuses its first field through it — while keeping its own for the caret.
export function CaretInput({ ref: hostRef, ...props }: React.ComponentProps<"input">) {
  const { ref, composing, remember } = useCaret<HTMLInputElement>();
  const attach = (el: HTMLInputElement | null) => {
    ref.current = el;
    if (typeof hostRef === "function") hostRef(el);
    else if (hostRef) hostRef.current = el;
  };
  return (
    <input
      {...props}
      ref={attach}
      onChange={(e) => { props.onChange?.(e); remember(); }}
      onSelect={(e) => { props.onSelect?.(e); remember(); }}
      onKeyUp={(e) => { props.onKeyUp?.(e); remember(); }}
      onClick={(e) => { props.onClick?.(e); remember(); }}
      onCompositionStart={(e) => { composing.current = true; props.onCompositionStart?.(e); }}
      onCompositionEnd={(e) => { composing.current = false; props.onCompositionEnd?.(e); remember(); }}
    />
  );
}
