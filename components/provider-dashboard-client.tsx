"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { EmptyState } from "@/components/ui/empty-state";
import { StatGrid } from "@/components/ui/stat-grid";
import { recordAction } from "@/lib/client-actions";

export function ProviderDashboardClient() {
  const [beds, setBeds] = useState(0);
  const [availability, setAvailability] = useState("Not set");
  const [message, setMessage] = useState("");

  async function saveAvailability() {
    await recordAction({
      type: "update_availability",
      targetType: "provider",
      targetId: "self",
      label: "Availability settings saved.",
      payload: { beds, availability }
    });
    setMessage("Availability settings saved.");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[1.3rem] font-semibold">Provider dashboard</h1>
        <p className="text-sm text-neutral-500">Manage your facility profile and availability across the Netherlands</p>
      </header>

      <StatGrid
        stats={[
          [String(beds), "Available beds"],
          ["0", "New inquiries"],
          [availability, "Availability status"],
          ["—", "Active listings"]
        ]}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-semibold">Facility inquiries</h2>
          <EmptyState title="No inquiries yet" description="When families are matched to your facility, new inquiries will appear here." />
        </section>

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-semibold">Availability</h2>
          <p className="mt-2 text-sm text-neutral-600">Update your open beds and availability status.</p>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Available beds
              <input
                type="number"
                min="0"
                value={beds}
                onChange={(event) => setBeds(Number(event.target.value))}
                className="rounded-lg border border-stone-200 px-3 py-2 outline-sage-600"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Availability status
              <CustomSelect
                value={availability}
                onChange={setAvailability}
                options={["Not set", "Available now", "Waitlist", "Fully occupied"]}
              />
            </label>
            <Button size="sm" onClick={saveAvailability}>
              Save availability
            </Button>
          </div>
          {message ? <p className="mt-4 rounded-lg bg-sage-100 p-3 text-sm text-sage-700">{message}</p> : null}
        </section>
      </div>
    </main>
  );
}
