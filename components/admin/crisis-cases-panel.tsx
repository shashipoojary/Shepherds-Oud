"use client";

import { ListPager } from "@/components/ui/list-pager";
import { ListSearch } from "@/components/ui/list-search";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatReference } from "@/lib/domain/reference";
import type { AdminDashboardData } from "@/lib/data/admin";

type CrisisCase = AdminDashboardData["crisisCases"][number];
type PageMeta = AdminDashboardData["pagination"]["cases"];

function pathLabel(path: string | null) {
  if (path === "HOME_CARE") return "Home care";
  if (path === "FACILITY") return "Facility";
  if (path === "BOTH") return "Both";
  if (path === "UNDECIDED") return "Undecided";
  return "—";
}

function urgencyLabel(value: string | null) {
  if (value === "TODAY") return "Today";
  if (value === "THIS_WEEK") return "This week";
  if (value === "THIS_MONTH") return "This month";
  return "—";
}

export function CrisisCasesPanel({
  cases,
  pagination,
  search,
  pending,
  onSearchChange,
  onPageChange
}: {
  cases: CrisisCase[];
  pagination: PageMeta;
  search: string;
  pending?: boolean;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
}) {
  if (!pagination.total && !search) {
    return (
      <EmptyState
        title="No triage cases yet"
        description="Cases appear here when families complete crisis triage on the public site."
      />
    );
  }

  return (
    <div>
      <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
        <ListSearch
          value={search}
          onChange={onSearchChange}
          placeholder="Search triage cases by family, path, or reference…"
        />
      </div>
      {!cases.length ? (
        <p className="px-5 py-8 text-center text-sm text-ink/50">No cases match this search.</p>
      ) : (
        <table className="min-w-full text-left text-sm">
          <thead className="bg-brand-cream/50 text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium sm:px-5">Family</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Patient</th>
              <th className="px-4 py-3 font-medium">Path</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Urgency</th>
              <th className="px-4 py-3 font-medium">Checklist</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Referrals</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {cases.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-3 sm:px-5">
                  <p className="font-medium text-ink">{item.familyName}</p>
                  <p className="text-xs text-ink/50">{item.familyEmail || formatReference(item.id)}</p>
                </td>
                <td className="hidden px-4 py-3 text-ink/80 md:table-cell">{item.patientName || "—"}</td>
                <td className="px-4 py-3 text-ink/80">{pathLabel(item.chosenPath)}</td>
                <td className="hidden px-4 py-3 text-ink/70 sm:table-cell">{urgencyLabel(item.urgencyLevel)}</td>
                <td className="px-4 py-3 text-ink/70">
                  {item.taskDone}/{item.taskTotal}
                </td>
                <td className="hidden px-4 py-3 text-ink/70 lg:table-cell">
                  {item.referralCount}
                  {item.pendingReferralCount ? ` (${item.pendingReferralCount} open)` : ""}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="softNeutral">{item.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ListPager
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        pending={pending}
        onPageChange={onPageChange}
      />
    </div>
  );
}
