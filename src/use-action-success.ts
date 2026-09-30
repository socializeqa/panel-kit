"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMarkDrawerClean } from "./drawer";

// What every form in a drawer does once a save answers ok: clear the drawer's
// dirty flag (so closing doesn't ask a false "discard?"), refresh the server's
// data, then the caller's own step (close, reset, a toast). The callback is
// read from a ref, so an inline closure never re-fires the effect — it runs
// once per good result.
export function useActionSuccess(result: { ok: boolean } | null | undefined, onSuccess?: () => void): void {
  const router = useRouter();
  const markClean = useMarkDrawerClean();
  const cb = useRef(onSuccess);
  useEffect(() => {
    cb.current = onSuccess;
  });
  useEffect(() => {
    if (result?.ok) {
      markClean();
      router.refresh();
      cb.current?.();
    }
  }, [result, router, markClean]);
}
