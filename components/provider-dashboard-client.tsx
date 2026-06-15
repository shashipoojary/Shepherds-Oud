"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { EmptyState } from "@/components/ui/empty-state";
import { StatGrid } from "@/components/ui/stat-grid";
import { recordAction } from "@/lib/client-actions";

export function ProviderDashboardClient() {
  const [bedsInput, setBedsInput] = useState("");
  const [availability, setAvailability] = useState("Not set");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const bedsValue = bedsInput.trim() === "" ? null : Number(bedsInput);
  const bedsDisplay = bedsValue === null || Number.isNaN(bedsValue) ? "—" : String(bedsValue);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function saveAvailability() {
    if (bedsInput.trim() !== "" && (Number.isNaN(bedsValue) || bedsValue! < 0)) {
      setMessage("Enter a valid number of beds, or leave the field empty.");
      return;
    }

    setSaving(true);
    try {
      await recordAction({
        type: "update_availability",
        targetType: "provider",
        targetId: "self",
        label: "Availability settings saved.",
        payload: { beds: bedsValue, availability }
      });
      setMessage("Availability settings saved.");
    } catch {
      setMessage("Could not save availability. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveAvailability();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[1.3rem] font-semibold">Provider dashboard</h1>
        <p className="text-sm text-neutral-500">Manage your facility profile and availability across the Netherlands</p>
      </header>

      <StatGrid
        stats={[
          [bedsDisplay, "Available beds"],
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
          <p className="mt-2 text-sm text-neutral-600">Update your open beds and availability status. Leave beds empty if not set yet.</p>
          <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium">
              Available beds
              <input
                type="number"
                min="0"
                value={bedsInput}
                placeholder="Not set"
                onChange={(event) => setBedsInput(event.target.value)}
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
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save availability"}
            </Button>
          </form>
          {message ? <p className="mt-4 rounded-lg bg-sage-100 p-3 text-sm text-sage-700">{message}</p> : null}
        </section>
      </div>
    </main>
  );
}
