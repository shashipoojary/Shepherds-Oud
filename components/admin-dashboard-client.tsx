"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatGrid } from "@/components/ui/stat-grid";
import { adminDashboard, providers } from "@/lib/content";
import { recordAction } from "@/lib/client-actions";

type AdminTab = "families" | "providers" | "inquiries";
type AdminAction =
  | { type: "case"; family: (typeof adminDashboard.families)[number] }
  | { type: "provider"; provider: (typeof providers)[number] }
  | { type: "follow-up"; inquiry: (typeof adminDashboard.inquiries)[number] };

export function AdminDashboardClient() {
  const [tab, setTab] = useState<AdminTab>("families");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<AdminAction | null>(null);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[1.3rem] font-semibold">Admin dashboard</h1>
        <p className="text-sm text-neutral-500">Shepherds Oud - The Hague pilot</p>
      </header>

      <StatGrid stats={adminDashboard.stats} />

      <div className="mt-6 flex w-full gap-1 overflow-x-auto rounded-[10px] bg-white p-1 shadow-soft sm:inline-flex sm:w-auto">
        {(["families", "providers", "inquiries"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`min-w-fit flex-1 rounded-lg px-4 py-2 text-sm transition sm:flex-none ${tab === item ? "bg-sage-600 text-white" : "text-neutral-600 hover:bg-sage-100 hover:text-sage-700"}`}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {message ? <div className="mt-4 rounded-[10px] bg-sage-100 px-5 py-4 text-sm text-sage-700">{message}</div> : null}

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-soft">
        <div className="overflow-x-auto">
          {tab === "families" ? <FamiliesTable openAction={setAction} /> : tab === "providers" ? <ProvidersTable openAction={setAction} /> : <InquiriesTable openAction={setAction} />}
        </div>
      </div>

      {action ? <AdminWorkPanel action={action} close={() => setAction(null)} setMessage={setMessage} /> : null}
    </main>
  );
}

function FamiliesTable({ openAction }: { openAction: (action: AdminAction) => void }) {
  return (
    <table className="w-full min-w-[900px] border-collapse text-left">
      <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-4 py-3">Family</th>
          <th className="px-4 py-3">Care needed</th>
          <th className="px-4 py-3">Location</th>
          <th className="px-4 py-3">Urgency</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-200">
        {adminDashboard.families.map((family) => (
          <tr key={family.name} className="hover:bg-cream">
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
              <Button size="sm" variant="ghost" onClick={() => openAction({ type: "case", family })}>
                View case
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProvidersTable({ openAction }: { openAction: (action: AdminAction) => void }) {
  return (
    <table className="w-full min-w-[980px] border-collapse text-left">
      <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-4 py-3">Provider</th>
          <th className="px-4 py-3">Type</th>
          <th className="px-4 py-3">City</th>
          <th className="min-w-[170px] px-4 py-3">Availability</th>
          <th className="px-4 py-3">Last updated</th>
          <th className="px-4 py-3">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-200">
        {providers.map((provider) => (
          <tr key={provider.id} className="hover:bg-cream">
            <td className="px-4 py-3 text-sm font-semibold">{provider.name}</td>
            <td className="px-4 py-3 text-sm text-neutral-600">{provider.type}</td>
            <td className="px-4 py-3 text-sm text-neutral-600">{provider.area}</td>
            <td className="min-w-[170px] px-4 py-3">
              <span className="inline-flex max-w-full whitespace-nowrap rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">{provider.availability}</span>
            </td>
            <td className="px-4 py-3 text-sm text-neutral-600">Today</td>
            <td className="px-4 py-3">
              <Button size="sm" variant="ghost" onClick={() => openAction({ type: "provider", provider })}>
                Edit profile
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InquiriesTable({ openAction }: { openAction: (action: AdminAction) => void }) {
  return (
    <table className="w-full min-w-[900px] border-collapse text-left">
      <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
        <tr>
          <th className="px-4 py-3">Family</th>
          <th className="px-4 py-3">Provider</th>
          <th className="px-4 py-3">Match</th>
          <th className="px-4 py-3">Date</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-200">
        {adminDashboard.inquiries.map((inquiry) => (
          <tr key={`${inquiry.family}-${inquiry.provider}`} className="hover:bg-cream">
            <td className="px-4 py-3 text-sm text-neutral-700">{inquiry.family}</td>
            <td className="px-4 py-3 text-sm text-neutral-700">{inquiry.provider}</td>
            <td className="px-4 py-3 text-sm font-semibold text-sage-700">{inquiry.match}</td>
            <td className="px-4 py-3 text-sm text-neutral-600">{inquiry.date}</td>
            <td className="px-4 py-3">
              <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">{inquiry.status}</span>
            </td>
            <td className="px-4 py-3">
              <Button size="sm" variant="ghost" onClick={() => openAction({ type: "follow-up", inquiry })}>
                Follow up
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AdminWorkPanel({ action, close, setMessage }: { action: AdminAction; close: () => void; setMessage: (message: string) => void }) {
  async function save(type: string, targetType: string, targetId: string, label: string, payload?: Record<string, unknown>) {
    await recordAction({ type, targetType, targetId, label, payload });
    setMessage(label);
  }

  if (action.type === "case") {
    const family = action.family;
    return (
      <section className="mt-6 grid gap-5 rounded-xl bg-white p-5 shadow-panel lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{family.name}</h2>
              <p className="text-sm text-neutral-500">{family.context}</p>
            </div>
            <button className="text-sm text-neutral-500 hover:text-sage-700" onClick={close}>
              Close
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info label="Care needed" value={family.care} />
            <Info label="Location" value={family.location} />
            <Info label="Urgency" value={family.urgency} />
            <Info label="Status" value={family.status} />
          </div>
          <div className="mt-5 rounded-lg bg-cream p-4 text-sm text-neutral-700">
            Recommended next step: review matched providers, call the family if urgency is high, then update inquiry status.
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 p-4">
          <h3 className="font-semibold">Case actions</h3>
          <div className="mt-4 grid gap-2">
            <Button size="sm" onClick={() => save("schedule_call", "family", family.name, `Advisor call scheduled for ${family.name}.`, family)}>
              Schedule advisor call
            </Button>
            <Button size="sm" variant="ghost" onClick={() => save("manual_match", "family", family.name, `Manual matching started for ${family.name}.`, family)}>
              Match manually
            </Button>
            <Button size="sm" variant="ghost" onClick={() => save("mark_review", "family", family.name, `${family.name} marked for review.`, family)}>
              Mark for review
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (action.type === "provider") {
    const provider = action.provider;
    return (
      <section className="mt-6 rounded-xl bg-white p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Edit provider profile</h2>
            <p className="text-sm text-neutral-500">{provider.name}</p>
          </div>
          <button className="text-sm text-neutral-500 hover:text-sage-700" onClick={close}>
            Close
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">
            Provider name
            <input defaultValue={provider.name} className="rounded-lg border border-stone-200 px-3 py-2 outline-sage-600" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Area
            <input defaultValue={provider.area} className="rounded-lg border border-stone-200 px-3 py-2 outline-sage-600" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium md:col-span-2">
            Description
            <textarea defaultValue={provider.description} className="min-h-24 rounded-lg border border-stone-200 px-3 py-2 outline-sage-600" />
          </label>
        </div>
        <Button className="mt-5" size="sm" onClick={() => save("save_provider_profile", "provider", provider.id, `${provider.name} profile changes saved.`, provider)}>
          Save profile
        </Button>
      </section>
    );
  }

  const inquiry = action.inquiry;
  return (
    <section className="mt-6 rounded-xl bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Follow up inquiry</h2>
          <p className="text-sm text-neutral-500">
            {inquiry.family} - {inquiry.provider}
          </p>
        </div>
        <button className="text-sm text-neutral-500 hover:text-sage-700" onClick={close}>
          Close
        </button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_260px]">
        <label className="grid gap-1.5 text-sm font-medium">
          Follow-up note
          <textarea className="min-h-28 rounded-lg border border-stone-200 px-3 py-2 outline-sage-600" defaultValue={`Check ${inquiry.status.toLowerCase()} with ${inquiry.provider}.`} />
        </label>
        <div className="grid content-start gap-2">
          <Button size="sm" onClick={() => save("save_follow_up_note", "inquiry", `${inquiry.family}-${inquiry.provider}`, `Follow-up note saved for ${inquiry.family}.`, inquiry)}>
            Save note
          </Button>
          <Button size="sm" variant="ghost" onClick={() => save("create_reminder", "inquiry", `${inquiry.family}-${inquiry.provider}`, `Reminder created for ${inquiry.family}.`, inquiry)}>
            Create reminder
          </Button>
          <Button size="sm" variant="ghost" onClick={() => save("request_provider_update", "provider", inquiry.provider, `Provider update requested from ${inquiry.provider}.`, inquiry)}>
            Ask provider update
          </Button>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 p-3 text-sm">
      <span className="block text-neutral-500">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
