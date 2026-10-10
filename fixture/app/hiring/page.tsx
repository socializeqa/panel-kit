import { candidateColumns } from "@socialize/panel-kit/candidate-columns";
import { DataTable, type Column } from "@socialize/panel-kit/data-table";
import { pageHrefBuilder } from "@socialize/panel-kit/list-config";
import { resolvePageAdaptive } from "@socialize/panel-kit/page-size";
import { PageMeta } from "@socialize/panel-kit/page-header-context";
import { HiringDemo } from "./hiring-demo";
import { APPLICANTS, WORDS, type Applicant } from "./words";

// A server page, the way a candidates list is: the words are read here and
// the columns built here, so the build proves nothing in them has to cross to
// the browser but plain props.
const AGE: Column<Applicant> = { header: "Age", priority: "medium", className: "tabular-nums", cell: (a) => a.age };

const COLUMNS = candidateColumns<Applicant>({
  words: WORDS,
  href: (a) => `/hiring?c=${a.id}`,
  extra: [AGE],
  read: (a) => ({
    name: a.name,
    appliedBefore: a.id === "c1" ? 1 : 0,
    applied: a.applied,
    role: a.role,
    stage: a.stage,
    fitScore: a.fit,
    rating: a.rating,
    cvHref: a.cv ? `/hiring/${a.id}/cv` : null,
    hasPortfolio: a.id === "c2",
  }),
});

export default function HiringPage() {
  const page = resolvePageAdaptive("1", undefined);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <PageMeta title="Candidates" description="Who applied, and where each one stands" count={APPLICANTS.length} />
      <HiringDemo />
      <DataTable
        fill
        rows={APPLICANTS}
        columns={COLUMNS}
        rowHref={(a) => `/hiring?c=${a.id}`}
        rowClassName={(a) => (a.stage === "rejected" ? "opacity-55" : undefined)}
        emptyLabel="No candidates yet"
        pagination={{ page: page.page, pageSize: page.pageSize, total: APPLICANTS.length, hrefForPage: pageHrefBuilder("/hiring", {}) }}
      />
    </div>
  );
}
