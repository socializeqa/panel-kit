import { Drawer } from "./drawer";

// A record is a drawer over its list; the list is the one page (Damine, 23 Aug
// 2026). In-app navigation already gets that from the drawer slot's intercepted
// routes. This is the hard-load twin — a refresh or a pasted link to
// /<room>/<id> (or /new) — which used to render the record as a full page with
// no list behind it. It renders the room's list with the same drawer open over
// it, and closing lands on the list.
export function RecordRoute({
  list,
  title,
  closeHref,
  padded,
  children,
}: {
  /** The room's list page, rendered underneath. */
  list: React.ReactNode;
  title: string;
  closeHref: string;
  padded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {list}
      <Drawer title={title} closeHref={closeHref} padded={padded}>
        {children}
      </Drawer>
    </>
  );
}
