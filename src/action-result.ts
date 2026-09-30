// The shape every save returns, so the save and the component that reads its
// result agree. Elite Touch's lib/admin/action-result.ts.
export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
