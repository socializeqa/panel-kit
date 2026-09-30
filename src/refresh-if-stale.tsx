"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// A page the router serves from its cache — Back to the dashboard — shows the
// numbers it had when it was left. The server stamps each render; mounting a
// render older than a moment means it came from the cache, so fetch it again.
// A fresh render is younger than that and costs nothing extra. (Elite Touch.)
export function RefreshIfStale({ renderedAt, maxAgeMs = 5000 }: { renderedAt: number; maxAgeMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (Date.now() - renderedAt > maxAgeMs) router.refresh();
  }, [renderedAt, maxAgeMs, router]);
  return null;
}
