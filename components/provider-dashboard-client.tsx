"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { EmptyState } from "@/components/ui/empty-state";
import { StatGrid } from "@/components/ui/stat-grid";
import { careTypeOptions, dutchProvinces, facilityTypes } from "@/lib/content";
import { recordAction } from "@/lib/client-actions";

type ProviderRecord = {
  id: string;
  name: string;
  type: string;
  area: string;
  city: string | null;
  province: string | null;
  description: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  bedsTotal: number | null;
  bedsOpen: number | null;
  availabilityStatus: string | null;
  waitlistText: string | null;
  services: string[];
  languages: string[];
};

type Inquiry = {
  id: string;
  score: number;
  status: string;
  createdAt: string;
  intake: {
    contactName: string;
    preferredArea: string;
    careTypes: string[];
    urgency: string;
    ageRange: string;
    phone: string;
    email: string;
  };
};

type FormState = {
  name: string;
  type: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  description: string;
  bedsTotal: string;
  bedsOpen: string;
  availabilityStatus: string;
  services: string[];
  languages: string[];
};

const emptyForm: FormState = {
  name: "",
  type: facilityTypes[0],
  contactName: "",
  email: "",
  phone: "",
  city: "",
  province: dutchProvinces[0],
  description: "",
  bedsTotal: "",
  bedsOpen: "",
  availabilityStatus: "Not set",
  services: [],
  languages: []
};

function toForm(provider: ProviderRecord | null): FormState {
  if (!provider) return emptyForm;
  return {
    name: provider.name,
    type: provider.type,
    contactName: provider.contactName || "",
    email: provider.email || "",
    phone: provider.phone || "",
    city: provider.city || "",
    province: provider.province || dutchProvinces[0],
    description: provider.description || "",
    bedsTotal: provider.bedsTotal?.toString() || "",
    bedsOpen: provider.bedsOpen?.toString() || "",
    availabilityStatus: provider.availabilityStatus || "Not set",
    services: provider.services,
    languages: provider.languages
  };
}

export function ProviderDashboardClient() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingInquiryId, setPendingInquiryId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/provider/me");
        if (response.ok) {
          const data = (await response.json()) as { provider: ProviderRecord | null; inquiries: Inquiry[] };
          setForm(toForm(data.provider));
          setInquiries(data.inquiries);
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleList(key: "services" | "languages", value: string) {
    setForm((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
      };
    });
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const response = await fetch("/api/provider/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          city: form.city,
          province: form.province,
          description: form.description,
          bedsTotal: form.bedsTotal.trim() === "" ? null : Number(form.bedsTotal),
          bedsOpen: form.bedsOpen.trim() === "" ? null : Number(form.bedsOpen),
          availabilityStatus: form.availabilityStatus,
          waitlistText: form.availabilityStatus === "Waitlist" ? "Waitlist open" : null,
          services: form.services,
          languages: form.languages
        })
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const provider = (await response.json()) as ProviderRecord;
      setForm(toForm(provider));
      await recordAction({
        type: "update_provider_profile",
        targetType: "provider",
        targetId: provider.id,
        label: "Provider profile saved to database.",
        payload: { providerId: provider.id }
      });
      setMessage("Facility profile saved.");
    } catch {
      setMessage("Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateInquiry(id: string, status: string) {
    setPendingInquiryId(id);
    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      setInquiries((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      setMessage("Inquiry status updated.");
    } catch {
      setMessage("Could not update inquiry.");
    } finally {
      setPendingInquiryId(null);
    }
  }

  const newInquiries = inquiries.filter((item) => ["SUGGESTED", "VISIT_REQUESTED", "CALLBACK_REQUESTED"].includes(item.status)).length;
  const bedsDisplay = form.bedsOpen.trim() === "" ? "—" : form.bedsOpen;

  if (loading) {
    return <main className="mx-auto max-w-7xl px-4 py-8 text-sm text-neutral-500">Loading provider dashboard...</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-[1.3rem] font-semibold">Provider dashboard</h1>
        <p className="text-sm text-neutral-500">Save your facility profile to the database and manage matched family inquiries.</p>
      </header>

      <StatGrid
        stats={[
          [bedsDisplay, "Available beds"],
          [String(newInquiries), "New inquiries"],
          [form.availabilityStatus, "Availability"],
          [form.services.length ? String(form.services.length) : "—", "Services listed"]
        ]}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-semibold">Family inquiries</h2>
          {inquiries.length ? (
            <div className="mt-4 grid gap-3">
              {inquiries.map((inquiry) => (
                <article key={inquiry.id} className="rounded-xl border border-stone-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{inquiry.intake.contactName}</p>
                      <p className="mt-1 text-sm text-neutral-600">
                        {inquiry.intake.preferredArea} · {inquiry.intake.careTypes.join(", ")}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        Urgency: {inquiry.intake.urgency} · Age: {inquiry.intake.ageRange}
                      </p>
                    </div>
                    <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">
                      {inquiry.score}% match · {inquiry.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {inquiry.status === "SUGGESTED" || inquiry.status === "VISIT_REQUESTED" || inquiry.status === "CALLBACK_REQUESTED" ? (
                      <Button size="sm" disabled={pendingInquiryId === inquiry.id} onClick={() => void updateInquiry(inquiry.id, "CONTACTED")}>
                        Mark contacted
                      </Button>
                    ) : null}
                    {inquiry.status !== "ACCEPTED" && inquiry.status !== "DECLINED" && inquiry.status !== "CLOSED" ? (
                      <>
                        <Button size="sm" variant="ghost" disabled={pendingInquiryId === inquiry.id} onClick={() => void updateInquiry(inquiry.id, "ACCEPTED")}>
                          Accept
                        </Button>
                        <Button size="sm" variant="ghost" disabled={pendingInquiryId === inquiry.id} onClick={() => void updateInquiry(inquiry.id, "DECLINED")}>
                          Decline
                        </Button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No inquiries yet" description="When an admin matches a family to your facility, the inquiry will appear here." />
          )}
        </section>

        <section className="rounded-xl bg-white p-5 shadow-soft">
          <h2 className="font-semibold">Availability</h2>
          <p className="mt-2 text-sm text-neutral-600">Saved together with your facility profile.</p>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Available beds
              <input
                type="number"
                min="0"
                value={form.bedsOpen}
                placeholder="Not set"
                onChange={(event) => updateForm("bedsOpen", event.target.value)}
                className="rounded-lg border border-stone-200 px-3 py-2 outline-sage-600"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Availability status
              <CustomSelect
                value={form.availabilityStatus}
                onChange={(value) => updateForm("availabilityStatus", value)}
                options={["Not set", "Available now", "Limited availability", "Waitlist", "Fully occupied"]}
              />
            </label>
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-xl bg-white p-5 shadow-soft">
        <h2 className="font-semibold">Facility profile</h2>
        <p className="mt-2 text-sm text-neutral-600">First save creates your provider record and links it to your login.</p>

        <form
          className="mt-5 grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void saveProfile();
          }}
        >
          <Field label="Facility name">
            <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} className={inputClass} required />
          </Field>
          <Field label="Facility type">
            <CustomSelect value={form.type} onChange={(value) => updateForm("type", value)} options={facilityTypes} />
          </Field>
          <Field label="Contact person">
            <input value={form.contactName} onChange={(e) => updateForm("contactName", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className={inputClass} placeholder="+31 6 ..." />
          </Field>
          <Field label="Total beds or places">
            <input type="number" min="0" value={form.bedsTotal} onChange={(e) => updateForm("bedsTotal", e.target.value)} className={inputClass} placeholder="Optional" />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={(e) => updateForm("city", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Province">
            <CustomSelect value={form.province} onChange={(value) => updateForm("province", value)} options={dutchProvinces} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Facility description">
              <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} className={`${inputClass} min-h-24`} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <ChipField label="Services offered" options={careTypeOptions} selected={form.services} onToggle={(value) => toggleList("services", value)} />
          </div>
          <div className="md:col-span-2">
            <ChipField label="Languages spoken" options={["Dutch", "English", "Arabic", "Turkish", "German", "French"]} selected={form.languages} onToggle={(value) => toggleList("languages", value)} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save facility profile"}
            </Button>
          </div>
        </form>
        {message ? <p className="mt-4 rounded-lg bg-sage-100 p-3 text-sm text-sage-700">{message}</p> : null}
      </section>
    </main>
  );
}

const inputClass = "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-sage-600";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function ChipField({
  label,
  options,
  selected,
  onToggle
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full px-3 py-2 text-sm transition ${active ? "bg-sage-600 text-white" : "bg-stone-100 text-neutral-700 hover:bg-sage-100"}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
