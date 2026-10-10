import { DataTable } from "@socialize/panel-kit/data-table";
import { openingColumns } from "@socialize/panel-kit/opening-columns";
import { PageMeta } from "@socialize/panel-kit/page-header-context";

type Role = { id: string; slug: string; title: string; department: string; type: string; applicants: number; waiting: number; posted: string; status: string };

const ROLES: Role[] = [
  { id: "o1", slug: "office-manager", title: "Office Manager", department: "Operations", type: "Full-time", applicants: 12, waiting: 3, posted: "1 Oct", status: "open" },
  { id: "o2", slug: "accountant", title: "Accountant", department: "Finance", type: "Part-time", applicants: 0, waiting: 0, posted: "7 Oct", status: "draft" },
];

// The openings list as a server page builds it.
const COLUMNS = openingColumns<Role>({
  href: (r) => `/hiring/openings?o=${r.id}`,
  publicUrl: (slug) => `https://example.com/careers/${slug}`,
  read: (r) => ({ ...r, under: r.department }),
});

export default function OpeningsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <PageMeta title="Openings" description="The roles on the careers page" count={ROLES.length} />
      <DataTable fill rows={ROLES} columns={COLUMNS} rowHref={(r) => `/hiring/openings?o=${r.id}`} emptyLabel="No openings yet" />
    </div>
  );
}
