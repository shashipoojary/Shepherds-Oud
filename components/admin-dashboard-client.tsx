"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminResetDataButton } from "@/components/admin-reset-data-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RefreshButton } from "@/components/ui/refresh-button";
import { DetailList, SlidePanel } from "@/components/ui/slide-panel";
import { StatGrid } from "@/components/ui/stat-grid";
import type { AdminDashboardData } from "@/lib/data/admin";
import { recordAction } from "@/lib/client-actions";
import {
  adminInquiryActionMeta,
  adminInquiryHint,
  adminIntakeActionMeta,
  adminMatchStatusLabel,
  compareMatchPriority,
  isAdminActionNeeded,
  matchStatusBadgeClass
} from "@/lib/match-status";

type AdminTab = "families" | "providers" | "inquiries" | "waitlist";
type WaitlistEntry = AdminDashboardData["waitlist"][number];
type FamilyEntry = AdminDashboardData["families"][number];
type IntakeStatus = "NEW" | "REVIEW" | "MATCHED" | "PLACED" | "CLOSED";
type ProviderOption = AdminDashboardData["providerList"][number];
type InquiryEntry = AdminDashboardData["inquiries"][number];
type MatchStatus =
  | "SUGGESTED"
  | "CONTACTED"
  | "VISIT_REQUESTED"
  | "CALLBACK_REQUESTED"
  | "ACCEPTED"
  | "DECLINED"
  | "PLACED"
  | "CLOSED";

export function AdminDashboardClient({ data: initialData }: { data: AdminDashboardData }) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<AdminTab>("families");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function refreshDashboard() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/admin/dashboard");
      if (response.ok) {
        setData((await response.json()) as AdminDashboardData);
        setMessage("Dashboard updated.");
      } else {
        setMessage("Could not refresh dashboard.");
      }
    } catch {
      setMessage("Could not refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.3rem] font-semibold">Admin dashboard</h1>
          <p className="text-sm text-neutral-500">Shepherds Oud — Netherlands-wide operations</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton onClick={() => void refreshDashboard()} loading={refreshing} />
          <AdminResetDataButton />
        </div>
      </header>

      <StatGrid stats={data.stats} />

      <div className="mt-6 flex w-full gap-1 overflow-x-auto rounded-[10px] bg-white p-1 shadow-soft sm:inline-flex sm:w-auto">
        {(["families", "providers", "inquiries", "waitlist"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`min-w-fit flex-1 rounded-lg px-4 py-2 text-sm transition sm:flex-none ${tab === item ? "bg-brand-amber text-white" : "text-ink/70 hover:bg-brand-cream hover:text-brand-amber"}`}
          >
            {item === "waitlist" ? "Waitlist" : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {message ? <div className="mt-4 rounded-lg bg-brand-green-pale/30 px-5 py-4 text-sm text-brand-green-dark">{message}</div> : null}

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-soft">
        <div className="overflow-x-auto">
          {tab === "families" ? (
            data.families.length ? (
              <FamiliesTable key={data.families.length} families={data.families} providers={data.providerList} setMessage={setMessage} />
            ) : (
              <EmptyState title="No family intakes yet" description="New submissions from the intake form will appear here." />
            )
          ) : null}

          {tab === "providers" ? (
            data.providerList.length ? (
              <ProvidersTable providers={data.providerList} setMessage={setMessage} />
            ) : (
              <EmptyState title="No providers yet" description="Approved care facilities will appear here once added to the database." />
            )
          ) : null}

          {tab === "inquiries" ? (
            data.inquiries.length ? (
              <InquiriesTable key={data.inquiries.length} inquiries={data.inquiries} setMessage={setMessage} />
            ) : (
              <EmptyState title="No matches or inquiries yet" description="When families are matched to providers, those records will show here." />
            )
          ) : null}

          {tab === "waitlist" ? (
            data.waitlist.length ? (
              <WaitlistTable entries={data.waitlist} setMessage={setMessage} />
            ) : (
              <EmptyState title="No waitlist registrations yet" description="Pre-launch family and facility sign-ups will appear here." />
            )
          ) : null}
        </div>
      </div>
    </main>
  );
}

function FamiliesTable({
  families,
  providers,
  setMessage
}: {
  families: FamilyEntry[];
  providers: ProviderOption[];
  setMessage: (message: string) => void;
}) {
  const [rows, setRows] = useState(families);
  const [selected, setSelected] = useState<FamilyEntry | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    setRows(families);
  }, [families]);

  async function updateStatus(id: string, status: IntakeStatus, name: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/intakes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error("Could not update intake.");
      }

      setRows((current) => current.map((family) => (family.id === id ? { ...family, status } : family)));
      setSelected((current) => (current?.id === id ? { ...current, status } : current));

      await recordAction({
        type: "intake_status_updated",
        targetType: "intake",
        targetId: id,
        label: `Updated ${name} to ${status}.`,
        payload: { id, status, name }
      });

      setMessage(`${name} marked as ${status.replaceAll("_", " ").toLowerCase()}.`);
    } catch {
      setMessage(`Could not update ${name}. Please try again.`);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Family</th>
            <th className="px-4 py-3">Care needed</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Urgency</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {rows.map((family) => {
            const isPending = pendingId === family.id;
            const reviewMeta = adminIntakeActionMeta("REVIEW");
            return (
              <tr key={family.id} className="cursor-pointer hover:bg-cream" onClick={() => setSelected(family)}>
                <td className="px-4 py-3 text-sm">
                  <strong>{family.name}</strong>
                  <span className="block text-xs text-neutral-500">{family.context}</span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">{family.care}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{family.location}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{family.urgency}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">{family.status}</span>
                </td>
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  {family.status === "NEW" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      title={reviewMeta.description}
                      onClick={() => void updateStatus(family.id, "REVIEW", family.name)}
                    >
                      {isPending ? "Saving..." : reviewMeta.label}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setSelected(family)}>
                      Open details
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <FamilyDetailPanel
        family={selected}
        providers={providers}
        onClose={() => setSelected(null)}
        onUpdateStatus={updateStatus}
        onMatchCreated={setMessage}
        pendingId={pendingId}
      />
    </>
  );
}

function FamilyDetailPanel({
  family,
  providers,
  onClose,
  onUpdateStatus,
  onMatchCreated,
  pendingId
}: {
  family: FamilyEntry | null;
  providers: ProviderOption[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: IntakeStatus, name: string) => Promise<void>;
  onMatchCreated: (message: string) => void;
  pendingId: string | null;
}) {
  const [providerId, setProviderId] = useState("");
  const [score, setScore] = useState("85");
  const [matchNotes, setMatchNotes] = useState("");
  const [creatingMatch, setCreatingMatch] = useState(false);

  const isPending = family ? pendingId === family.id : false;

  async function createMatch() {
    if (!family || !providerId) return;
    setCreatingMatch(true);
    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeId: family.id,
          providerId,
          score: Number(score),
          notes: matchNotes || undefined
        })
      });

      if (!response.ok) {
        throw new Error("Could not create match.");
      }

      await recordAction({
        type: "match_created",
        targetType: "intake",
        targetId: family.id,
        label: `Matched ${family.name} with a provider.`,
        payload: { intakeId: family.id, providerId, score: Number(score) }
      });

      onMatchCreated(`Match created for ${family.name}. They can now see this provider on their results page.`);
      setProviderId("");
      setMatchNotes("");
    } catch {
      onMatchCreated(`Could not create match for ${family.name}.`);
    } finally {
      setCreatingMatch(false);
    }
  }

  const details = family
    ? [
        { label: "Contact name", value: family.name },
        { label: "Email", value: family.email },
        { label: "Phone", value: family.phone },
        { label: "Relationship", value: family.relationship },
        { label: "Age range", value: family.ageRange },
        { label: "Preferred area", value: family.location },
        { label: "Care types", value: family.care },
        { label: "Urgency", value: family.urgency },
        { label: "Budget", value: family.budget },
        { label: "Languages", value: family.languages?.length ? family.languages.join(", ") : null },
        { label: "Additional needs", value: family.additionalNeeds?.length ? family.additionalNeeds.join(", ") : null },
        { label: "Notes", value: family.notes },
        { label: "Status", value: family.status },
        { label: "Submitted", value: family.createdAt },
        { label: "Last updated", value: family.updatedAt }
      ]
    : [];

  const nextActions: Array<{ label: string; status: IntakeStatus; description: string }> = [];
  if (family?.status === "NEW") {
    const meta = adminIntakeActionMeta("REVIEW");
    nextActions.push({ label: meta.label, status: "REVIEW", description: meta.description });
  }
  if (family?.status === "REVIEW") {
    const meta = adminIntakeActionMeta("MATCHED");
    nextActions.push({ label: meta.label, status: "MATCHED", description: meta.description });
  }
  if (family?.status === "MATCHED") {
    const meta = adminIntakeActionMeta("PLACED");
    nextActions.push({ label: meta.label, status: "PLACED", description: meta.description });
  }
  if (family && family.status !== "CLOSED") {
    const meta = adminIntakeActionMeta("CLOSED");
    nextActions.push({ label: meta.label, status: "CLOSED", description: meta.description });
  }

  return (
    <SlidePanel
      open={Boolean(family)}
      onClose={onClose}
      size="wide"
      title={family?.name || "Family intake"}
      subtitle={family ? `${family.location} · ${family.urgency}` : "Care intake details"}
    >
      {family ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="rounded-xl border border-stone-200 bg-brand-cream/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Case status</p>
              <p className="mt-1 text-lg font-semibold text-ink">{family.status}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Track the family journey here. Create provider matches on the right, then update status so they see progress on their dashboard.
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink">Contact & care needs</h3>
              <DetailList
                items={details.filter((item) =>
                  ["Contact name", "Email", "Phone", "Relationship", "Age range", "Preferred area", "Care types", "Urgency", "Budget", "Languages", "Additional needs", "Notes"].includes(
                    item.label
                  )
                )}
                columns={2}
              />
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink">Record</h3>
              <DetailList
                items={details.filter((item) => ["Status", "Submitted", "Last updated"].includes(item.label))}
                columns={2}
              />
            </div>
          </div>

          <div className="space-y-5 lg:sticky lg:top-0 lg:self-start">
            <div className="rounded-xl border border-stone-200 p-4">
              <h3 className="text-sm font-semibold text-ink">Create provider match</h3>
              <p className="mt-1 text-sm text-neutral-600">The family will see this provider on their shortlist.</p>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5 text-sm font-medium">
                  Provider
                  <select
                    value={providerId}
                    onChange={(event) => setProviderId(event.target.value)}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-sage-600"
                  >
                    <option value="">Select provider</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} — {provider.area}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Match score (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-sm outline-sage-600"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Internal notes (optional)
                  <textarea
                    value={matchNotes}
                    onChange={(event) => setMatchNotes(event.target.value)}
                    className="min-h-20 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-sage-600"
                  />
                </label>
                <Button type="button" disabled={!providerId || creatingMatch} onClick={() => void createMatch()}>
                  {creatingMatch ? "Creating match..." : "Create match"}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 p-4">
              <h3 className="text-sm font-semibold text-ink">Update case status</h3>
              <p className="mt-1 text-sm text-neutral-600">Each step updates what the family sees on their dashboard.</p>
              <div className="mt-4 grid gap-3">
                {nextActions.map((action) => (
                  <div key={action.status} className="rounded-lg border border-stone-100 bg-white p-3">
                    <Button
                      className="w-full"
                      variant={action.status === "CLOSED" ? "outline" : "default"}
                      disabled={isPending}
                      onClick={() => void onUpdateStatus(family.id, action.status, family.name)}
                    >
                      {isPending ? "Saving..." : action.label}
                    </Button>
                    <p className="mt-2 text-xs leading-5 text-neutral-500">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </SlidePanel>
  );
}

function ProvidersTable({
  providers,
  setMessage
}: {
  providers: AdminDashboardData["providerList"];
  setMessage: (message: string) => void;
}) {
  const [selected, setSelected] = useState<AdminDashboardData["providerList"][number] | null>(null);

  return (
    <>
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Area</th>
            <th className="px-4 py-3">Beds open</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {providers.map((provider) => (
            <tr key={provider.id} className="cursor-pointer hover:bg-cream" onClick={() => setSelected(provider)}>
              <td className="px-4 py-3 text-sm font-semibold">{provider.name}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">{provider.type}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">{provider.area}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">
                {provider.bedsOpen ?? "—"}
                {provider.bedsTotal ? ` / ${provider.bedsTotal}` : ""}
              </td>
              <td className="px-4 py-3">
                <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); setSelected(provider); }}>
                  Open details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ProviderDetailPanel provider={selected} onClose={() => setSelected(null)} setMessage={setMessage} />
    </>
  );
}

function ProviderDetailPanel({
  provider,
  onClose,
  setMessage
}: {
  provider: AdminDashboardData["providerList"][number] | null;
  onClose: () => void;
  setMessage: (message: string) => void;
}) {
  const details = provider
    ? [
        { label: "Facility name", value: provider.name },
        { label: "Type", value: provider.type },
        { label: "Area", value: provider.area },
        { label: "City", value: provider.city },
        { label: "Province", value: provider.province },
        { label: "Contact name", value: provider.contactName },
        { label: "Email", value: provider.email },
        { label: "Phone", value: provider.phone },
        { label: "Website", value: provider.website },
        {
          label: "Beds",
          value:
            provider.bedsOpen != null || provider.bedsTotal != null
              ? `${provider.bedsOpen ?? "—"} open / ${provider.bedsTotal ?? "—"} total`
              : null
        },
        { label: "Availability", value: provider.availabilityStatus },
        { label: "Waitlist", value: provider.waitlistText },
        {
          label: "Price range",
          value:
            provider.priceMin != null && provider.priceMax != null
              ? `EUR ${provider.priceMin} - EUR ${provider.priceMax} per month`
              : null
        },
        { label: "Services", value: provider.services?.length ? provider.services.join(", ") : null },
        { label: "Languages", value: provider.languages?.length ? provider.languages.join(", ") : null },
        { label: "Description", value: provider.description },
        { label: "Added", value: provider.createdAt },
        { label: "Last updated", value: provider.updatedAt }
      ]
    : [];

  return (
    <SlidePanel open={Boolean(provider)} onClose={onClose} title={provider?.name || "Provider"} subtitle="Facility profile">
      {provider ? (
        <>
          <DetailList items={details} />
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="ghost">
              <a href={`/providers/${provider.id}`} target="_blank" rel="noreferrer">
                Open public profile
              </a>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void navigator.clipboard.writeText(provider.id);
                setMessage(`Copied provider ID for ${provider.name}.`);
              }}
            >
              Copy provider ID
            </Button>
          </div>
        </>
      ) : null}
    </SlidePanel>
  );
}

function InquiriesTable({
  inquiries,
  setMessage
}: {
  inquiries: InquiryEntry[];
  setMessage: (message: string) => void;
}) {
  const [rows, setRows] = useState(inquiries);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<InquiryEntry | null>(null);

  useEffect(() => {
    setRows(inquiries);
  }, [inquiries]);

  const sortedInquiries = useMemo(
    () => [...rows].sort((a, b) => compareMatchPriority(a.statusRaw, b.statusRaw)),
    [rows]
  );
  const followUpCount = rows.filter((item) => isAdminActionNeeded(item.statusRaw)).length;

  async function updateMatchStatus(id: string, status: MatchStatus) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error("Could not update inquiry.");
      }

      setRows((current) =>
        current.map((inquiry) =>
          inquiry.id === id
            ? {
                ...inquiry,
                statusRaw: status,
                status: adminMatchStatusLabel(status)
              }
            : inquiry
        )
      );
      setSelected((current) =>
        current?.id === id ? { ...current, statusRaw: status, status: adminMatchStatusLabel(status) } : current
      );
      setMessage(`Inquiry updated to ${adminMatchStatusLabel(status).toLowerCase()}.`);
    } catch {
      setMessage("Could not update inquiry.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      {followUpCount ? (
        <div className="border-b border-brand-amber/20 bg-brand-amber/8 px-4 py-3 text-sm text-brand-amber-dark">
          <strong>{followUpCount}</strong> {followUpCount === 1 ? "inquiry needs" : "inquiries need"} your follow-up. Open a row for the step-by-step guide.
        </div>
      ) : null}

      <table className="w-full min-w-[980px] border-collapse text-left">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Family</th>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Match</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {sortedInquiries.map((inquiry) => {
            const isPending = pendingId === inquiry.id;
            const needsFollowUp = isAdminActionNeeded(inquiry.statusRaw);

            return (
              <tr
                key={inquiry.id}
                className={`cursor-pointer hover:bg-cream ${needsFollowUp ? "bg-brand-amber/5" : ""}`}
                onClick={() => setSelected(inquiry)}
              >
                <td className="px-4 py-3 text-sm text-neutral-700">{inquiry.family}</td>
                <td className="px-4 py-3 text-sm text-neutral-700">{inquiry.provider}</td>
                <td className="px-4 py-3 text-sm font-semibold text-sage-700">{inquiry.match}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{inquiry.updatedAt}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${matchStatusBadgeClass(inquiry.statusRaw)}`}>
                    {adminMatchStatusLabel(inquiry.statusRaw)}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <div className="flex flex-wrap gap-2">
                    {inquiry.statusRaw === "VISIT_REQUESTED" || inquiry.statusRaw === "CALLBACK_REQUESTED" || inquiry.statusRaw === "ACCEPTED" ? (
                      <Button size="sm" disabled={isPending} onClick={() => void updateMatchStatus(inquiry.id, "CONTACTED")}>
                        {isPending ? "Saving..." : adminInquiryActionMeta("CONTACTED").label}
                      </Button>
                    ) : null}
                    {inquiry.statusRaw !== "PLACED" && inquiry.statusRaw !== "CLOSED" ? (
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => void updateMatchStatus(inquiry.id, "PLACED")}>
                        {adminInquiryActionMeta("PLACED").label}
                      </Button>
                    ) : null}
                    {inquiry.statusRaw !== "CLOSED" ? (
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => void updateMatchStatus(inquiry.id, "CLOSED")}>
                        {adminInquiryActionMeta("CLOSED").label}
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => setSelected(inquiry)}>
                      Details
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <InquiryDetailPanel
        inquiry={selected}
        pendingId={pendingId}
        onClose={() => setSelected(null)}
        onUpdateStatus={updateMatchStatus}
      />
    </>
  );
}

function InquiryDetailPanel({
  inquiry,
  pendingId,
  onClose,
  onUpdateStatus
}: {
  inquiry: InquiryEntry | null;
  pendingId: string | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: MatchStatus) => Promise<void>;
}) {
  const isPending = inquiry ? pendingId === inquiry.id : false;
  const hint = inquiry ? adminInquiryHint(inquiry.statusRaw) : "";

  const details = inquiry
    ? [
        { label: "Family", value: inquiry.family },
        { label: "Phone", value: inquiry.familyPhone },
        { label: "Email", value: inquiry.familyEmail },
        { label: "Area", value: inquiry.familyArea },
        { label: "Care needed", value: inquiry.familyCare },
        { label: "Urgency", value: inquiry.familyUrgency },
        { label: "Provider", value: inquiry.provider },
        { label: "Match score", value: inquiry.match },
        { label: "Status", value: adminMatchStatusLabel(inquiry.statusRaw) },
        { label: "Created", value: inquiry.date },
        { label: "Last updated", value: inquiry.updatedAt },
        { label: "Activity log", value: inquiry.notes }
      ]
    : [];

  return (
    <SlidePanel
      open={Boolean(inquiry)}
      onClose={onClose}
      size="wide"
      title={inquiry?.family || "Inquiry"}
      subtitle={inquiry ? `${inquiry.provider} · ${adminMatchStatusLabel(inquiry.statusRaw)}` : "Match details"}
    >
      {inquiry ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className={`rounded-lg px-4 py-3 text-sm ${matchStatusBadgeClass(inquiry.statusRaw)}`}>{hint}</div>

            <div className="mt-5 rounded-xl border border-stone-200 bg-brand-cream/40 p-4 text-sm leading-6 text-ink/75">
              <p className="font-medium text-ink">Inquiry flow</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5">
                <li>You create a match — family sees the provider on their shortlist.</li>
                <li>Family requests a visit or callback — status moves here for you and the provider.</li>
                <li>Provider accepts or declines — family sees the update on their dashboard and matches page.</li>
                <li>You mark coordinated after arranging the visit or call with both sides.</li>
                <li>Record placement when the family commits, or close the inquiry.</li>
              </ol>
            </div>

            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-ink">Family</h3>
                <DetailList
                  items={details.filter((item) =>
                    ["Family", "Phone", "Email", "Area", "Care needed", "Urgency"].includes(item.label)
                  )}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Match</h3>
                <DetailList
                  items={details.filter((item) =>
                    ["Provider", "Match score", "Status", "Created", "Last updated", "Activity log"].includes(item.label)
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-0 lg:self-start">
            {(inquiry.statusRaw === "VISIT_REQUESTED" ||
              inquiry.statusRaw === "CALLBACK_REQUESTED" ||
              inquiry.statusRaw === "ACCEPTED") && (
              <div className="rounded-xl border border-stone-200 p-4">
                <Button className="w-full" size="sm" disabled={isPending} onClick={() => void onUpdateStatus(inquiry.id, "CONTACTED")}>
                  {adminInquiryActionMeta("CONTACTED").label}
                </Button>
                <p className="mt-2 text-xs leading-5 text-neutral-500">{adminInquiryActionMeta("CONTACTED").description}</p>
              </div>
            )}
            {inquiry.statusRaw !== "PLACED" && inquiry.statusRaw !== "CLOSED" ? (
              <div className="rounded-xl border border-stone-200 p-4">
                <Button className="w-full" size="sm" variant="outline" disabled={isPending} onClick={() => void onUpdateStatus(inquiry.id, "PLACED")}>
                  {adminInquiryActionMeta("PLACED").label}
                </Button>
                <p className="mt-2 text-xs leading-5 text-neutral-500">{adminInquiryActionMeta("PLACED").description}</p>
              </div>
            ) : null}
            {inquiry.statusRaw !== "CLOSED" ? (
              <div className="rounded-xl border border-stone-200 p-4">
                <Button className="w-full" size="sm" variant="outline" disabled={isPending} onClick={() => void onUpdateStatus(inquiry.id, "CLOSED")}>
                  {adminInquiryActionMeta("CLOSED").label}
                </Button>
                <p className="mt-2 text-xs leading-5 text-neutral-500">{adminInquiryActionMeta("CLOSED").description}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </SlidePanel>
  );
}

function WaitlistTable({
  entries: initialEntries,
  setMessage
}: {
  entries: WaitlistEntry[];
  setMessage: (message: string) => void;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<WaitlistEntry | null>(null);

  async function markContacted(id: string, name: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONTACTED" })
      });

      if (!response.ok) {
        throw new Error("Could not update waitlist entry.");
      }

      setEntries((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, status: "CONTACTED" as const } : entry))
      );
      setSelected((current) => (current?.id === id ? { ...current, status: "CONTACTED" } : current));

      await recordAction({
        type: "waitlist_contacted",
        targetType: "waitlist",
        targetId: id,
        label: `Marked ${name} as contacted.`,
        payload: { id, name }
      });

      setMessage(`${name} marked as contacted. Status updated in the waitlist.`);
    } catch {
      setMessage(`Could not mark ${name} as contacted. Please try again.`);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <table className="w-full min-w-[980px] border-collapse text-left">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Registered</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {entries.map((entry) => {
            const isContacted = entry.status === "CONTACTED";
            const isPending = pendingId === entry.id;

            return (
              <tr key={entry.id} className="cursor-pointer hover:bg-cream" onClick={() => setSelected(entry)}>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.type}</td>
                <td className="px-4 py-3 text-sm font-semibold">{entry.name}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.email}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.location}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.createdAt}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isContacted ? "bg-sage-600 text-white" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {entry.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(entry);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isContacted || isPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        void markContacted(entry.id, entry.name);
                      }}
                    >
                      {isPending ? "Saving..." : isContacted ? "Contacted" : "Mark contacted"}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <WaitlistDetailPanel
        entry={selected}
        onClose={() => setSelected(null)}
        onMarkContacted={markContacted}
        pendingId={pendingId}
      />
    </>
  );
}

function WaitlistDetailPanel({
  entry,
  onClose,
  onMarkContacted,
  pendingId
}: {
  entry: WaitlistEntry | null;
  onClose: () => void;
  onMarkContacted: (id: string, name: string) => Promise<void>;
  pendingId: string | null;
}) {
  const isContacted = entry?.status === "CONTACTED";
  const isPending = entry ? pendingId === entry.id : false;

  const familyDetails = entry
    ? [
        { label: "Type", value: entry.type },
        { label: "Contact name", value: entry.contactName },
        { label: "Email", value: entry.email },
        { label: "Phone", value: entry.phone },
        { label: "City", value: entry.city },
        { label: "Province", value: entry.province },
        { label: "Relationship", value: entry.relationship },
        { label: "Age range", value: entry.ageRange },
        { label: "Care types", value: entry.careTypes?.length ? entry.careTypes.join(", ") : null },
        { label: "Message", value: entry.message },
        { label: "Status", value: entry.status },
        { label: "Registered", value: entry.createdAt },
        { label: "Last updated", value: entry.updatedAt }
      ]
    : [];

  const facilityDetails = entry
    ? [
        { label: "Type", value: entry.type },
        { label: "Facility name", value: entry.facilityName },
        { label: "Contact name", value: entry.contactName },
        { label: "Email", value: entry.email },
        { label: "Phone", value: entry.phone },
        { label: "City", value: entry.city },
        { label: "Province", value: entry.province },
        { label: "Facility type", value: entry.facilityType },
        { label: "Total beds", value: entry.bedsTotal },
        { label: "Services", value: entry.services?.length ? entry.services.join(", ") : null },
        { label: "Message", value: entry.message },
        { label: "Status", value: entry.status },
        { label: "Registered", value: entry.createdAt },
        { label: "Last updated", value: entry.updatedAt }
      ]
    : [];

  return (
    <SlidePanel
      open={Boolean(entry)}
      onClose={onClose}
      title={entry?.name || "Waitlist entry"}
      subtitle={entry ? `${entry.type} registration` : undefined}
    >
      {entry ? (
        <>
          <DetailList items={entry.type === "FACILITY" ? facilityDetails : familyDetails} />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={onClose}>
              Close
            </Button>
            <Button
              className="w-full"
              disabled={isContacted || isPending}
              onClick={() => void onMarkContacted(entry.id, entry.name)}
            >
              {isPending ? "Saving..." : isContacted ? "Contacted" : "Mark contacted"}
            </Button>
          </div>
        </>
      ) : null}
    </SlidePanel>
  );
}
