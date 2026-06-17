"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CustomSelect } from "@/components/ui/custom-select";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatGrid } from "@/components/ui/stat-grid";
import { careTypeOptions, dutchProvinces, facilityTypes } from "@/lib/content";
import { providerInquiryActionMessage, providerInquiryStatusLabel } from "@/lib/match-status";
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

type DashboardData = {
  provider: ProviderRecord | null;
  inquiries: Inquiry[];
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

const availabilityOptions = ["Not set", "Available now", "Limited availability", "Waitlist", "Fully occupied"] as const;

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
    services: provider.services ?? [],
    languages: provider.languages ?? []
  };
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.trunc(parsed);
}

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as { error?: string; issues?: { fieldErrors?: Record<string, string[]> } };
    const fieldErrors = data.issues?.fieldErrors;
    if (fieldErrors) {
      const first = Object.values(fieldErrors).flat()[0];
      if (first) return first;
    }
    return data.error || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export function ProviderDashboardClient({ initialData }: { initialData?: DashboardData }) {
  const [form, setForm] = useState<FormState>(() => toForm(initialData?.provider ?? null));
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialData?.inquiries ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [pendingInquiryId, setPendingInquiryId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [inquiryFeedback, setInquiryFeedback] = useState<Record<string, string>>({});
  const [providerId, setProviderId] = useState<string | null>(initialData?.provider?.id ?? null);

  useEffect(() => {
    if (initialData) return;

    async function load() {
      try {
        const response = await fetch("/api/provider/me");
        if (response.ok) {
          const data = (await response.json()) as DashboardData;
          setForm(toForm(data.provider));
          setInquiries(data.inquiries);
          setProviderId(data.provider?.id ?? null);
        } else {
          setMessageTone("error");
          setMessage(await readApiError(response));
        }
      } catch {
        setMessageTone("error");
        setMessage("Could not load provider dashboard.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [initialData]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 5000);
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
    if (form.name.trim().length < 2) {
      setMessageTone("error");
      setMessage("Facility name must be at least 2 characters.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/provider/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          contactName: form.contactName.trim() || undefined,
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          city: form.city.trim() || undefined,
          province: form.province,
          description: form.description.trim() || undefined,
          bedsTotal: parseOptionalInt(form.bedsTotal),
          bedsOpen: parseOptionalInt(form.bedsOpen),
          availabilityStatus: form.availabilityStatus === "Not set" ? undefined : form.availabilityStatus,
          waitlistText: form.availabilityStatus === "Waitlist" ? "Waitlist open" : undefined,
          services: form.services,
          languages: form.languages
        })
      });

      if (!response.ok) {
        setMessageTone("error");
        setMessage(await readApiError(response));
        return;
      }

      const provider = (await response.json()) as ProviderRecord;
      setForm(toForm(provider));
      setProviderId(provider.id);
      setMessageTone("success");
      setMessage("Facility profile saved.");

      try {
        await recordAction({
          type: "update_provider_profile",
          targetType: "provider",
          targetId: provider.id,
          label: "Provider profile saved to database.",
          payload: { providerId: provider.id }
        });
      } catch {
        // Profile save succeeded; action log is non-blocking.
      }
    } catch {
      setMessageTone("error");
      setMessage("Could not save profile. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateInquiry(id: string, status: string, familyName: string) {
    const actionKey = `${id}:${status}`;
    setPendingInquiryId(id);
    setPendingAction(actionKey);
    setInquiryFeedback((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        setMessageTone("error");
        setMessage(await readApiError(response));
        setInquiryFeedback((current) => ({ ...current, [id]: "Could not update this inquiry. Please try again." }));
        return;
      }

      setInquiries((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      const feedback = providerInquiryActionMessage(status, familyName);
      setInquiryFeedback((current) => ({ ...current, [id]: feedback }));
      setMessageTone("success");
      setMessage(feedback);
    } catch {
      setMessageTone("error");
      setMessage("Could not update inquiry.");
      setInquiryFeedback((current) => ({ ...current, [id]: "Could not update this inquiry. Please try again." }));
    } finally {
      setPendingInquiryId(null);
      setPendingAction(null);
    }
  }

  const newInquiries = inquiries.filter((item) => ["SUGGESTED", "VISIT_REQUESTED", "CALLBACK_REQUESTED"].includes(item.status)).length;
  const bedsDisplay = form.bedsOpen.trim() === "" ? "—" : form.bedsOpen;

  if (loading) {
    return <DashboardSkeleton title="provider dashboard" />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="section-label">Provider dashboard</p>
        <h1 className="mt-1 text-h2 font-semibold text-ink">Manage your facility</h1>
        <p className="mt-2 text-body text-ink/70">
          {providerId
            ? "Update your profile, availability, and respond to matched family inquiries."
            : "Complete your facility profile below — your first save creates your provider record and links it to your login."}
        </p>
      </header>

      {message ? (
        <div
          className={`mb-5 rounded-lg px-4 py-3 text-sm ${
            messageTone === "success" ? "bg-brand-green-pale/30 text-brand-green-dark" : "bg-brand-beige-light/50 text-brand-amber-dark"
          }`}
          role="status"
        >
          {message}
        </div>
      ) : null}

      <StatGrid
        stats={[
          [bedsDisplay, "Available beds"],
          [String(newInquiries), "New inquiries"],
          [form.availabilityStatus, "Availability"],
          [form.services.length ? String(form.services.length) : "—", "Services listed"]
        ]}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="rounded-card border border-[var(--card-border)] bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-ink">Family inquiries</h2>
          <p className="mt-1 text-sm text-ink/60">
            Respond to families matched to your facility. Accepting tells the family you are interested; declining removes the match from their results.
          </p>
          {inquiries.length ? (
            <div className="mt-4 grid gap-3">
              {inquiries.map((inquiry) => {
                const isNew = ["SUGGESTED", "VISIT_REQUESTED", "CALLBACK_REQUESTED"].includes(inquiry.status);
                const isAccepted = inquiry.status === "ACCEPTED";
                const isDeclined = inquiry.status === "DECLINED" || inquiry.status === "CLOSED";
                const isPending = pendingInquiryId === inquiry.id;
                const cardFeedback = inquiryFeedback[inquiry.id];

                return (
                  <article
                    key={inquiry.id}
                    className={`rounded-card border p-4 ${isNew ? "border-brand-amber/40 bg-brand-amber/5" : isAccepted ? "border-brand-green-pale bg-brand-green-pale/15" : isDeclined ? "border-stone-200 bg-stone-50" : "border-[var(--card-border)]"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{inquiry.intake.contactName}</p>
                        <p className="mt-1 text-sm text-ink/70">
                          {inquiry.intake.preferredArea} · {inquiry.intake.careTypes.join(", ")}
                        </p>
                        <p className="mt-1 text-sm text-ink/55">
                          Urgency: {inquiry.intake.urgency} · Age: {inquiry.intake.ageRange}
                        </p>
                        <p className="mt-2 text-sm text-ink/70">
                          {inquiry.intake.phone} · {inquiry.intake.email}
                        </p>
                      </div>
                      <span
                        className={`rounded px-3 py-1 text-xs font-semibold ${
                          isAccepted
                            ? "bg-brand-green-pale/60 text-brand-green-dark"
                            : isDeclined
                              ? "bg-stone-200 text-neutral-600"
                              : "bg-brand-green-pale/40 text-brand-green-dark"
                        }`}
                      >
                        {inquiry.score}% match · {providerInquiryStatusLabel(inquiry.status)}
                      </span>
                    </div>

                    {cardFeedback ? (
                      <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-sm text-brand-green-dark" role="status">
                        {cardFeedback}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {isNew && !isAccepted && !isDeclined ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => void updateInquiry(inquiry.id, "CONTACTED", inquiry.intake.contactName)}
                        >
                          {pendingAction === `${inquiry.id}:CONTACTED` ? "Saving..." : inquiry.status === "CONTACTED" ? "Contacted" : "Mark contacted"}
                        </Button>
                      ) : null}
                      {!isAccepted && !isDeclined ? (
                        <>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => void updateInquiry(inquiry.id, "ACCEPTED", inquiry.intake.contactName)}
                          >
                            {pendingAction === `${inquiry.id}:ACCEPTED` ? "Accepting..." : "Accept inquiry"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => void updateInquiry(inquiry.id, "DECLINED", inquiry.intake.contactName)}
                          >
                            {pendingAction === `${inquiry.id}:DECLINED` ? "Declining..." : "Decline"}
                          </Button>
                        </>
                      ) : null}
                      {isAccepted ? (
                        <Button size="sm" disabled className="bg-brand-green-pale/50 text-brand-green-dark">
                          Accepted
                        </Button>
                      ) : null}
                      {isDeclined ? (
                        <Button size="sm" variant="outline" disabled>
                          Declined
                        </Button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState title="No inquiries yet" description="When an admin matches a family to your facility, the inquiry will appear here." />
            </div>
          )}
        </section>

        <section className="rounded-card border border-[var(--card-border)] bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-ink">Availability</h2>
          <p className="mt-1 text-sm text-ink/60">Saved together with your facility profile.</p>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-ink">
              Available beds
              <input
                type="number"
                min="0"
                value={form.bedsOpen}
                placeholder="Not set"
                onChange={(event) => updateForm("bedsOpen", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              Availability status
              <CustomSelect value={form.availabilityStatus} onChange={(value) => updateForm("availabilityStatus", value)} options={availabilityOptions} />
            </label>
            <Button type="button" disabled={saving} onClick={() => void saveProfile()}>
              {saving ? "Saving..." : "Save availability"}
            </Button>
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-card border border-[var(--card-border)] bg-white p-5 shadow-soft">
        <h2 className="font-semibold text-ink">Facility profile</h2>
        <p className="mt-1 text-sm text-ink/60">This information helps families understand what your facility offers.</p>

        <form
          className="mt-5 grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void saveProfile();
          }}
        >
          <Field label="Facility name *">
            <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} className={inputClass} required minLength={2} />
          </Field>
          <Field label="Facility type">
            <CustomSelect value={form.type} onChange={(value) => updateForm("type", value)} options={facilityTypes} />
          </Field>
          <Field label="Contact person">
            <input value={form.contactName} onChange={(e) => updateForm("contactName", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} className={inputClass} placeholder="contact@facility.nl" />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className={inputClass} placeholder="+31 6 ..." />
          </Field>
          <Field label="Total beds or places">
            <input type="number" min="0" value={form.bedsTotal} onChange={(e) => updateForm("bedsTotal", e.target.value)} className={inputClass} placeholder="Optional" />
          </Field>
          <Field label="City">
            <input value={form.city} onChange={(e) => updateForm("city", e.target.value)} className={inputClass} placeholder="e.g. Utrecht" />
          </Field>
          <Field label="Province">
            <CustomSelect value={form.province} onChange={(value) => updateForm("province", value)} options={dutchProvinces} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Facility description">
              <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} className={`${inputClass} min-h-24`} placeholder="Describe your care approach, environment, and specialties." />
            </Field>
          </div>
          <div className="md:col-span-2">
            <ChipField label="Services offered" options={careTypeOptions} selected={form.services} onToggle={(value) => toggleList("services", value)} />
          </div>
          <div className="md:col-span-2">
            <ChipField label="Languages spoken" options={["Dutch", "English", "Arabic", "Turkish", "German", "French"]} selected={form.languages} onToggle={(value) => toggleList("languages", value)} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving} className="min-w-[180px]">
              {saving ? "Saving..." : providerId ? "Save facility profile" : "Create facility profile"}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--card-border)] px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-amber";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
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
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip key={option} selected={selected.includes(option)} onClick={() => onToggle(option)}>
            {option}
          </Chip>
        ))}
      </div>
    </div>
  );
}
