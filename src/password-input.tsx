"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./fields";
import { usePanelT } from "./panel-provider";

// A password box with its own show / hide eye: the one shape for every door
// that asks for a password, so signing in and setting one feel the same.
// X Capital's components/admin/password-input.tsx.
export function PasswordInput(props: Omit<React.ComponentProps<"input">, "type">) {
  const t = usePanelT();
  const [show, setShow] = useState(false);
  const label = show ? t("Hide password") : t("Show password");
  return (
    <span className="relative block">
      <Input {...props} type={show ? "text" : "password"} className="pe-11" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={label}
        aria-pressed={show}
        title={label}
        className="absolute inset-y-0 end-0 grid w-11 place-items-center text-ink/40 transition-colors hover:text-ink"
      >
        {show ? <EyeOff className="size-[17px]" strokeWidth={1.8} /> : <Eye className="size-[17px]" strokeWidth={1.8} />}
      </button>
    </span>
  );
}
