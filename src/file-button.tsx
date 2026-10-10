"use client";

import { useRef, type ReactNode } from "react";
import { Button } from "./fields";
import type { ButtonLook } from "./classes";

// A real button for the hidden file box every upload sits behind. `camera`
// asks a phone for its back camera straight away — a business card, a paper
// on the desk; without it the phone's picker offers files, photos and the
// camera. The box is emptied after each pick, so the same file can be picked
// again.
export function FileButton({
  accept,
  camera = false,
  onPick,
  disabled,
  children,
  className,
  ...look
}: {
  accept: string;
  camera?: boolean;
  onPick: (file: File) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
} & ButtonLook) {
  const box = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={box}
        type="file"
        accept={accept}
        capture={camera ? "environment" : undefined}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPick(file);
        }}
      />
      <Button type="button" variant="ghost" {...look} onClick={() => box.current?.click()} disabled={disabled} className={className}>
        {children}
      </Button>
    </>
  );
}
