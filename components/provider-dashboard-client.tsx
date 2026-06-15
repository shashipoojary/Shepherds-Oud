"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { StatGrid } from "@/components/ui/stat-grid";
import { providerDashboard } from "@/lib/content";

export function ProviderDashboardClient() {
  const [beds, setBeds] = useState(providerDashboard.beds);
  const [availability, setAvailability] = useState("Available now");
  const [acceptsDementia, setAcceptsDementia] = useState(true);
  const [acceptsUrgent, setAcceptsUrgent] = useState(true);
  const [message, setMessage] = useState("");
  const [inquiries, setInquiries] = useState(providerDashboard.inquiries);
  const [selectedInquiry, setSelectedInquiry] = useState<(typeof providerDashboard.inquiries)[number] | null>(providerDashboard.inquiries[0]);
  const [profile, setProfile] = useState({
    contactName: "Yasmine El-Amin",
    phone: "+31 70 123 4567",
    email: "info@woonzorgarchipel.nl"
  });

  function updateInquiry(family: string, status: string) {
    setInquiries((current) => current.map((inquiry) => (inquiry.family === family ? { ...inquiry, status } : inquiry)));
    setSelectedInquiry((current) => (current?.family === family ? { ...current, status } : current));
    setMessage(`${family} marked as ${status.toLowerCase()}.`);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[1.3rem] font-semibold">Provider dashboard</h1>
        <p className="text-sm text-neutral-500">
          {providerDashboard.providerName} - Last updated {providerDashboard.lastUpdated.toLowerCase()}
        </p>
      </header>

      <StatGrid
        stats={[
          [String(beds), "Available beds"],
          ["Yes", "Dementia referrals"],
          ["Yes", "Urgent placements"],
          [availability, "Availability status"]
        ]}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="rounded-xl bg-white p-5 shadow-soft sm:p-6">
        <h2 className="mb-4 text-[15px] font-semibold">Current availability</h2>
        <div className="divide-y divide-stone-200">
          <div className="flex items-center justify-between gap-4 py-2 text-sm">
            <span className="text-neutral-500">Available beds</span>
            <span className="flex items-center gap-3 font-semibold">
              {beds}
              <span className="flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setBeds((value) => Math.max(0, value - 1))}>
                  -
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setBeds((value) => value + 1)}>
                  +
                </Button>
              </span>
            </span>
          </div>
          <div className="grid gap-2 py-2 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
            <span className="text-neutral-500">Availability status</span>
            <CustomSelect className="w-full sm:w-56" value={availability} onChange={setAvailability} options={["Available now", "Limited availability", "Waitlist only", "Not available"]} />
          </div>
          <div className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="text-neutral-500">Accepting dementia referrals</span>
            <Toggle checked={acceptsDementia} onChange={setAcceptsDementia} />
          </div>
          <div className="flex items-center justify-between gap-4 py-3 text-sm">
            <span className="text-neutral-500">Accepting urgent placements</span>
            <Toggle checked={acceptsUrgent} onChange={setAcceptsUrgent} />
          </div>
        </div>
        <Button size="sm" className="mt-4" onClick={() => setMessage(`Availability saved: ${beds} beds, ${availability}, dementia ${acceptsDementia ? "on" : "off"}, urgent ${acceptsUrgent ? "on" : "off"}.`)}>
          Save availability
        </Button>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-soft sm:p-6">
        <h2 className="mb-4 text-[15px] font-semibold">Provider contact</h2>
        <div className="grid gap-3">
          <label className="grid gap-1.5 text-sm font-medium">
            Contact person
            <input value={profile.contactName} onChange={(event) => setProfile((current) => ({ ...current, contactName: event.target.value }))} className="rounded-lg border border-stone-200 px-3 py-2 outline-sage-600" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Phone
            <input value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} className="rounded-lg border border-stone-200 px-3 py-2 outline-sage-600" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Email
            <input value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className="rounded-lg border border-stone-200 px-3 py-2 outline-sage-600" />
          </label>
        </div>
        <Button size="sm" className="mt-4" onClick={() => setMessage(`Provider contact saved for ${profile.contactName}.`)}>
          Save profile
        </Button>
      </section>
      </div>

      {message ? <div className="mt-4 rounded-[10px] bg-sage-100 px-5 py-4 text-sm text-sage-700">{message}</div> : null}

      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold">Incoming inquiries</h2>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-3">
          {inquiries.map((inquiry) => (
            <article key={inquiry.family} className={`grid gap-4 rounded-xl bg-white p-5 shadow-soft lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start ${selectedInquiry?.family === inquiry.family ? "ring-2 ring-sage-600" : ""}`}>
              <div>
                <h3 className="text-[15px] font-semibold">
                  {inquiry.family} - {inquiry.context}
                </h3>
                <p className="mt-1 text-[13px] text-neutral-500">{inquiry.summary}</p>
                <span className="mt-3 inline-flex rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">{inquiry.status}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => setSelectedInquiry(inquiry)}>
                  Open
                </Button>
                <Button size="sm" onClick={() => updateInquiry(inquiry.family, "Accepted")}>
                  Accept
                </Button>
                <Button size="sm" variant="ghost" onClick={() => updateInquiry(inquiry.family, "More info requested")}>
                  Request info
                </Button>
                <Button size="sm" variant="ghost" className="text-red-700" onClick={() => updateInquiry(inquiry.family, "Declined")}>
                  Decline
                </Button>
              </div>
            </article>
          ))}
        </div>
        {selectedInquiry ? (
          <aside className="rounded-xl bg-white p-5 shadow-soft">
            <h3 className="font-semibold">Inquiry workspace</h3>
            <p className="mt-1 text-sm text-neutral-500">{selectedInquiry.family}</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-lg bg-cream p-3">{selectedInquiry.summary}</div>
              <label className="grid gap-1.5 font-medium">
                Internal note
                <textarea className="min-h-28 rounded-lg border border-stone-200 px-3 py-2 outline-sage-600" placeholder="Add call notes, missing details, or next steps." />
              </label>
              <CustomSelect value={selectedInquiry.status} onChange={(status) => updateInquiry(selectedInquiry.family, status)} options={["New inquiry", "Under review", "Accepted", "More info requested", "Declined", "Placed"]} />
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <Button size="sm" onClick={() => setMessage(`Call scheduled with ${selectedInquiry.family}.`)}>
                  Schedule call
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMessage(`Note saved for ${selectedInquiry.family}.`)}>
                  Save note
                </Button>
              </div>
            </div>
          </aside>
        ) : null}
        </div>
      </section>
    </main>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex h-7 w-12 items-center rounded-full p-1 transition ${checked ? "bg-sage-600" : "bg-stone-300"}`}
      aria-pressed={checked}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}
