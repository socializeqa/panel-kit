"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Option } from "./list-config";

// Filter values that live in the DATA rather than in the code.
//
// A ListConfig can spell out a fixed vocabulary — five hiring stages, four
// payment states — because those change only when the code does. It cannot
// spell out the positions the office opened this morning, or every
// nationality that has ever applied. So a list page reads them from the data
// it is already querying and publishes them here; the shared controls merge
// them into that list's config before drawing the drawer. The same shape as
// PageMeta: the page owns the values, the shell owns the chrome, and nothing
// is fetched twice. Keyed by the filter's `param`.
export type DynamicOptions = Record<string, Option[]>;

// TWO contexts, deliberately. The publisher must never change identity: a
// page's publish effect depends on it, so folding it in with the value would
// mean publishing changes the context, which re-runs the effect, which
// publishes again — a render loop that takes the page down.
const ValueContext = createContext<DynamicOptions>({});
const PublishContext = createContext<((o: DynamicOptions | null) => void) | null>(null);

export function ListOptionsProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<DynamicOptions>({});
  // Same content keeps the same object, so republishing an equal set is a
  // no-op rather than a re-render.
  const publish = useCallback((next: DynamicOptions | null) => {
    setOptions((prev) => {
      const value = next ?? {};
      return JSON.stringify(prev) === JSON.stringify(value) ? prev : value;
    });
  }, []);
  return (
    <PublishContext.Provider value={publish}>
      <ValueContext.Provider value={options}>{children}</ValueContext.Provider>
    </PublishContext.Provider>
  );
}

/** What the shared controls read. Empty on a page that publishes nothing. */
export function useDynamicOptions(): DynamicOptions {
  return useContext(ValueContext);
}

// Rendered by a list page to publish its data-driven filter values. Draws
// nothing, and clears on unmount so the next route never inherits the last
// one's positions.
export function ListOptions({ options }: { options: DynamicOptions }) {
  const publish = useContext(PublishContext);
  // Serialised, so a page that rebuilds an equal object every render doesn't
  // re-fire this effect. The values are plain strings; this compares exactly.
  const key = JSON.stringify(options);
  useEffect(() => {
    publish?.(JSON.parse(key) as DynamicOptions);
    return () => publish?.(null);
  }, [publish, key]);
  return null;
}
