import { DataTable, type Column } from "@socialize/panel-kit/data-table";
import { pageHrefBuilder } from "@socialize/panel-kit/list-config";
import { resolvePageAdaptive } from "@socialize/panel-kit/page-size";
import { PageMeta } from "@socialize/panel-kit/page-header-context";
import { StatusBadge } from "@socialize/panel-kit/status-badge";
import { Demo } from "./demo";

type Booking = { id: string; name: string; status: string; guests: number };

const BOOKINGS: Booking[] = [
  { id: "b1", name: "Layla Haddad", status: "pending", guests: 4 },
  { id: "b2", name: "Omar Farouk", status: "confirmed", guests: 2 },
  { id: "b3", name: "Sara Nasser", status: "cancelled", guests: 6 },
];

// A server component, the way a list page is: it hands the table rows and
// cell renderers straight from its data.
const COLUMNS: Column<Booking>[] = [
  { header: "Guest", cell: (b) => b.name },
  { header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
  { header: "Guests", cell: (b) => b.guests, priority: "medium" },
];

export default function Page() {
  const page = resolvePageAdaptive("1", undefined);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <PageMeta title="Bookings" description="The fixture's one list" count={BOOKINGS.length} />
      <Demo />
      <DataTable
        fill
        rows={BOOKINGS}
        columns={COLUMNS}
        rowHref={(b) => `/?r=${b.id}`}
        emptyLabel="No bookings yet"
        pagination={{ page: page.page, pageSize: page.pageSize, total: BOOKINGS.length, hrefForPage: pageHrefBuilder("/", {}) }}
      />
    </div>
  );
}
