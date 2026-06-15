"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatGrid } from "@/components/ui/stat-grid";
import type { AdminDashboardData } from "@/lib/data/admin";
import { recordAction } from "@/lib/client-actions";

type AdminTab = "families" | "providers" | "inquiries" | "waitlist";

export function AdminDashboardClient({ data }: { data: AdminDashboardData }) {
  const [tab, setTab] = useState<AdminTab>("families");
  const [message, setMessage] = useState("");

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
              <FamiliesTable families={data.families} setMessage={setMessage} />
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
  families,
  setMessage
}: {
  families: AdminDashboardData["families"];
  setMessage: (message: string) => void;
}) {
  return (
    <table className="w-full min-w-[900px] border-collapse text-left">
      <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-4 py-3">Family</th>
          <th className="px-4 py-3">Care needed</th>
          <th className="px-4 py-3">Location</th>
          <th className="px-4 py-3">Urgency</th>
          <th className="px-4 py-3">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-200">
        {families.map((family) => (
          <tr key={family.id} className="hover:bg-cream">
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
          </tr>
        ))}
      </tbody>
    </table>
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
              {provider.bedsOpen ?? 0}
              {provider.bedsTotal ? ` / ${provider.bedsTotal}` : ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InquiriesTable({
  inquiries,
  setMessage
}: {
  inquiries: AdminDashboardData["inquiries"];
  setMessage: (message: string) => void;
}) {
  return (
    <table className="w-full min-w-[900px] border-collapse text-left">
      <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-4 py-3">Family</th>
          <th className="px-4 py-3">Provider</th>
          <th className="px-4 py-3">Match</th>
          <th className="px-4 py-3">Date</th>
          <th className="px-4 py-3">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-200">
        {inquiries.map((inquiry) => (
          <tr key={inquiry.id} className="hover:bg-cream">
            <td className="px-4 py-3 text-sm text-neutral-700">{inquiry.family}</td>
            <td className="px-4 py-3 text-sm text-neutral-700">{inquiry.provider}</td>
            <td className="px-4 py-3 text-sm font-semibold text-sage-700">{inquiry.match}</td>
            <td className="px-4 py-3 text-sm text-neutral-600">{inquiry.date}</td>
            <td className="px-4 py-3">
              <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">{inquiry.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function WaitlistTable({
  entries,
  setMessage
}: {
  entries: AdminDashboardData["waitlist"];
  setMessage: (message: string) => void;
}) {
  async function markContacted(id: string, name: string) {
    await recordAction({
      type: "waitlist_contacted",
      targetType: "waitlist",
      targetId: id,
      label: `Marked ${name} as contacted.`,
      payload: { id, name }
    });
    setMessage(`Marked ${name} as contacted.`);
  }

  return (
    <table className="w-full min-w-[980px] border-collapse text-left">
      <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-4 py-3">Type</th>
          <th className="px-4 py-3">Name</th>
          <th className="px-4 py-3">Email</th>
          <th className="px-4 py-3">Location</th>
          <th className="px-4 py-3">Registered</th>
          <th className="px-4 py-3">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-200">
        {entries.map((entry) => (
          <tr key={entry.id} className="hover:bg-cream">
            <td className="px-4 py-3 text-sm text-neutral-600">{entry.type}</td>
            <td className="px-4 py-3 text-sm font-semibold">{entry.name}</td>
            <td className="px-4 py-3 text-sm text-neutral-600">{entry.email}</td>
            <td className="px-4 py-3 text-sm text-neutral-600">{entry.location}</td>
            <td className="px-4 py-3 text-sm text-neutral-600">{entry.createdAt}</td>
            <td className="px-4 py-3">
              <Button size="sm" variant="ghost" onClick={() => markContacted(entry.id, entry.name)}>
                Mark contacted
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
