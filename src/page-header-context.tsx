"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

export type PageHeaderData = {
  title: string;
  description?: string;
  count?: number;
  /** A status badge beside the title — the record's state, as in a drawer. */
  badge?: ReactNode;
  /** What this page belongs to, drawn on the subline before the description
   *  (Elite Touch's job facts on a record page; any app's parent record). */
  context?: ReactNode;
  /** The page's own action, first in the top bar's strip ("Mark all read"). */
  action?: ReactNode;
};

type PageHeaderCtx = { setHeader: (data: PageHeaderData | null) => void };

export const PageHeaderContext = createContext<PageHeaderCtx | null>(null);

// Rendered by a page to publish its title, description and count into the
// shared top bar. Draws nothing itself, and clears on unmount so the next
// route never inherits a stale title.
export function PageMeta({ title, description, count, badge, context, action }: PageHeaderData) {
  const ctx = useContext(PageHeaderContext);
  useEffect(() => {
    ctx?.setHeader({ title, description, count, badge, context, action });
    return () => ctx?.setHeader(null);
  }, [ctx, title, description, count, badge, context, action]);
  return null;
}
