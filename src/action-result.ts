// The shape every save returns, so the save and the component that reads its
// result agree. Elite Touch's lib/admin/action-result.ts.
export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/**
 * Where a `DeleteButton` asked to go once its record is gone (the `after`
 * field it sends), when that is a path inside the panel. The action redirects
 * there itself: deleting the record a page is built on re-renders that page
 * as a 404 in the same response, before the button's own push can land.
 *
 *   const after = afterDeleteHref(form);
 *   if (after) redirect(after);
 *   return { ok: true };
 */
export function afterDeleteHref(form: FormData): string | null {
  return insidePath(form.get("after"));
}

/** A path inside the panel ("/requests?status=new"), or null for anything that could leave it: another site, "//host", "/\host", a scheme. */
export function insidePath(raw: FormDataEntryValue | string | null | undefined): string | null {
  const path = typeof raw === "string" ? raw : "";
  return path.length <= 512 && /^\/(?![\/\\])[^\s]*$/.test(path) ? path : null;
}
