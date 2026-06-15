"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DetailList, SlidePanel } from "@/components/ui/slide-panel";
import { StatGrid } from "@/components/ui/stat-grid";
import type { AdminDashboardData } from "@/lib/data/admin";
import { recordAction } from "@/lib/client-actions";

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

export function AdminDashboardClient({ data }: { data: AdminDashboardData }) {
  const [tab, setTab] = useState<AdminTab>("families");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[1.3rem] font-semibold">Admin dashboard</h1>
        <p className="text-sm text-neutral-500">Shepherds Oud — Netherlands-wide operations</p>
      </header>

      <StatGrid stats={data.stats} />

      <div className="mt-6 flex w-full gap-1 overflow-x-auto rounded-[10px] bg-white p-1 shadow-soft sm:inline-flex sm:w-auto">
        {(["families", "providers", "inquiries", "waitlist"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`min-w-fit flex-1 rounded-lg px-4 py-2 text-sm transition sm:flex-none ${tab === item ? "bg-sage-600 text-white" : "text-neutral-600 hover:bg-sage-100 hover:text-sage-700"}`}
          >
            {item === "waitlist" ? "Waitlist" : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {message ? <div className="mt-4 rounded-[10px] bg-sage-100 px-5 py-4 text-sm text-sage-700">{message}</div> : null}

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-soft">
        <div className="overflow-x-auto">
          {tab === "families" ? (
            data.families.length ? (
              <FamiliesTable families={data.families} providers={data.providerList} setMessage={setMessage} />
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
              <InquiriesTable inquiries={data.inquiries} setMessage={setMessage} />
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
  families: initialFamilies,
  providers,
  setMessage
}: {
  families: FamilyEntry[];
  providers: ProviderOption[];
  setMessage: (message: string) => void;
}) {
  const [families, setFamilies] = useState(initialFamilies);
  const [selected, setSelected] = useState<FamilyEntry | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

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

      setFamilies((current) => current.map((family) => (family.id === id ? { ...family, status } : family)));
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
          {families.map((family) => {
            const isPending = pendingId === family.id;
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
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(family);
                      }}
                    >
                      View
                    </Button>
                    {family.status === "NEW" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={(event) => {
                          event.stopPropagation();
                          void updateStatus(family.id, "REVIEW", family.name);
                        }}
                      >
                        {isPending ? "Saving..." : "Start review"}
                      </Button>
                    ) : null}
                  </div>
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

  const nextActions: Array<{ label: string; status: IntakeStatus }> = [];
  if (family?.status === "NEW") nextActions.push({ label: "Start review", status: "REVIEW" });
  if (family?.status === "REVIEW") nextActions.push({ label: "Mark matched", status: "MATCHED" });
  if (family?.status === "MATCHED") nextActions.push({ label: "Mark placed", status: "PLACED" });
  if (family && family.status !== "CLOSED") nextActions.push({ label: "Close case", status: "CLOSED" });

  return (
    <SlidePanel open={Boolean(family)} onClose={onClose} title={family?.name || "Family intake"} subtitle="Care intake details">
      {family ? (
        <>
          <DetailList items={details} />

          <div className="mt-6 rounded-xl border border-stone-200 p-4">
            <h3 className="text-sm font-semibold text-ink">Create provider match</h3>
            <p className="mt-1 text-sm text-neutral-600">Select a provider and fit score. The family will see this on their matches page.</p>
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

          <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm leading-6 text-neutral-600">
            Update the case status after matching so the family sees progress on their dashboard.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {nextActions.map((action) => (
              <Button
                key={action.status}
                className="w-full"
                variant={action.status === "CLOSED" ? "ghost" : "default"}
                disabled={isPending}
                onClick={() => void onUpdateStatus(family.id, action.status, family.name)}
              >
                {isPending ? "Saving..." : action.label}
              </Button>
            ))}
          </div>
        </>
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
  return (
    <table className="w-full min-w-[900px] border-collapse text-left">
      <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-4 py-3">Provider</th>
          <th className="px-4 py-3">Type</th>
          <th className="px-4 py-3">Area</th>
          <th className="px-4 py-3">Beds open</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-200">
        {providers.map((provider) => (
          <tr key={provider.id} className="hover:bg-cream">
            <td className="px-4 py-3 text-sm font-semibold">{provider.name}</td>
            <td className="px-4 py-3 text-sm text-neutral-600">{provider.type}</td>
            <td className="px-4 py-3 text-sm text-neutral-600">{provider.area}</td>
            <td className="px-4 py-3 text-sm text-neutral-600">
              {provider.bedsOpen ?? "—"}
              {provider.bedsTotal ? ` / ${provider.bedsTotal}` : ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InquiriesTable({
  inquiries: initialInquiries,
  setMessage
}: {
  inquiries: InquiryEntry[];
  setMessage: (message: string) => void;
}) {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [pendingId, setPendingId] = useState<string | null>(null);

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

      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry.id === id ? { ...inquiry, statusRaw: status, status: status.replaceAll("_", " ") } : inquiry
        )
      );
      setMessage(`Inquiry updated to ${status.replaceAll("_", " ").toLowerCase()}.`);
    } catch {
      setMessage("Could not update inquiry.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <table className="w-full min-w-[980px] border-collapse text-left">
      <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-4 py-3">Family</th>
          <th className="px-4 py-3">Provider</th>
          <th className="px-4 py-3">Match</th>
          <th className="px-4 py-3">Date</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-200">
        {inquiries.map((inquiry) => {
          const isPending = pendingId === inquiry.id;
          return (
            <tr key={inquiry.id} className="hover:bg-cream">
              <td className="px-4 py-3 text-sm text-neutral-700">{inquiry.family}</td>
              <td className="px-4 py-3 text-sm text-neutral-700">{inquiry.provider}</td>
              <td className="px-4 py-3 text-sm font-semibold text-sage-700">{inquiry.match}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">{inquiry.date}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">{inquiry.status}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {inquiry.statusRaw === "SUGGESTED" || inquiry.statusRaw === "VISIT_REQUESTED" || inquiry.statusRaw === "CALLBACK_REQUESTED" ? (
                    <Button size="sm" variant="ghost" disabled={isPending} onClick={() => void updateMatchStatus(inquiry.id, "CONTACTED")}>
                      {isPending ? "Saving..." : "Mark contacted"}
                    </Button>
                  ) : null}
                  {inquiry.statusRaw !== "PLACED" && inquiry.statusRaw !== "CLOSED" ? (
                    <Button size="sm" variant="ghost" disabled={isPending} onClick={() => void updateMatchStatus(inquiry.id, "PLACED")}>
                      Placed
                    </Button>
                  ) : null}
                  {inquiry.statusRaw !== "CLOSED" ? (
                    <Button size="sm" variant="ghost" disabled={isPending} onClick={() => void updateMatchStatus(inquiry.id, "CLOSED")}>
                      Close
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
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
