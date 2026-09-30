import { cookies } from "next/headers";
import type { PageInfo } from "./list-config";
import { ROWS_COOKIE, resolvePageAdaptive, rowsFromValue } from "./page-size";

// For a list that pages on the server (Elite Touch, X Capital, Ecole): the
// ?page param against the rows this device measured, read from the request's
// cookie. Its own module because next/headers only exists on the server.
export async function resolvePageFromCookie(raw?: string | null): Promise<PageInfo> {
  const rows = rowsFromValue((await cookies()).get(ROWS_COOKIE)?.value);
  return resolvePageAdaptive(raw, rows);
}
