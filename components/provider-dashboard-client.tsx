"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Chip } from "@/components/ui/chip";
import { CustomSelect } from "@/components/ui/custom-select";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatGrid } from "@/components/ui/stat-grid";
import { careTypeOptions, dutchProvinces, facilityTypes } from "@/lib/content";
import {
  compareMatchPriority,
  isProviderActionNeeded,
  matchStatusBadgeClass,
  providerAcceptButtonLabel,
  providerInquiryActionMessage,
  providerInquiryBanner,
  providerInquiryStatusLabel,
  providerMatchNotes
} from "@/lib/match-status";
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
  notes: string | null;
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
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState<{ id: string; familyName: string } | null>(null);

  async function refreshDashboard() {
    setRefreshing(true);
    setMessage("");
    try {
      const response = await fetch("/api/provider/me");
      if (response.ok) {
        const data = (await response.json()) as DashboardData;
        setForm(toForm(data.provider));
        setInquiries(data.inquiries);
        setProviderId(data.provider?.id ?? null);
        setMessageTone("success");
        setMessage("Dashboard updated.");
      } else {
        setMessageTone("error");
        setMessage(await readApiError(response));
      }
    } catch {
      setMessageTone("error");
      setMessage("Could not refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  }

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

  useEffect(() => {
    const ids = Object.keys(inquiryFeedback);
    if (!ids.length) return;
    const timer = window.setTimeout(() => {
      setInquiryFeedback((current) => {
        const next = { ...current };
        for (const id of ids) {
          delete next[id];
        }
        return next;
      });
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [inquiryFeedback]);

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

  async function updateInquiry(id: string, status: string, familyName: string, priorStatus: string) {
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
        const errorMessage = await readApiError(response);
        setInquiryFeedback((current) => ({
          ...current,
          [id]: errorMessage || "Could not update this inquiry. Please try again."
        }));
        return;
      }

      const updated = (await response.json()) as Inquiry;
      setInquiries((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)));
      const feedback = providerInquiryActionMessage(updated.status, familyName, priorStatus);
      setInquiryFeedback((current) => ({ ...current, [id]: feedback }));
    } catch {
      setInquiryFeedback((current) => ({
        ...current,
        [id]: "Could not update this inquiry. Please check your connection and try again."
      }));
    } finally {
      setPendingInquiryId(null);
      setPendingAction(null);
    }
  }

  const sortedInquiries = useMemo(
    () => [...inquiries].sort((a, b) => compareMatchPriority(a.status, b.status)),
    [inquiries]
  );
  const actionNeededCount = inquiries.filter((item) => isProviderActionNeeded(item.status)).length;
  const newInquiries = actionNeededCount;
  const bedsDisplay = form.bedsOpen.trim() === "" ? "—" : form.bedsOpen;

  if (loading) {
    return <DashboardSkeleton title="provider dashboard" />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-label">Provider dashboard</p>
          <h1 className="mt-1 text-h2 font-semibold text-ink">Manage your facility</h1>
          <p className="mt-2 text-body text-ink/70">
            {providerId
              ? "Update your profile, availability, and respond to matched family inquiries."
              : "Complete your facility profile below — your first save creates your provider record and links it to your login."}
          </p>
        </div>
        <RefreshButton onClick={() => void refreshDashboard()} loading={refreshing} />
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
          [String(newInquiries), "Action needed"],
          [form.availabilityStatus, "Availability"],
          [form.services.length ? String(form.services.length) : "—", "Services listed"]
        ]}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="flex min-h-0 flex-col rounded-card border border-[var(--card-border)] bg-white p-5 shadow-soft">
          <div className="shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">Family inquiries</h2>
                <p className="mt-1 text-sm text-ink/60">
                  When a family requests a visit or callback, accept or decline so they know you are interested. The care advisor can then coordinate.
                </p>
              </div>
              {inquiries.length ? (
                <span className="shrink-0 rounded-full bg-brand-cream px-2.5 py-1 text-xs font-semibold text-ink/55">
                  {inquiries.length}
                </span>
              ) : null}
            </div>
          </div>
          {inquiries.length ? (
            <ScrollArea className="mt-4 max-h-[min(28rem,52vh)]">
              <div className="grid gap-3 pr-1.5">
                {sortedInquiries.map((inquiry) => {
                const needsResponse = isProviderActionNeeded(inquiry.status);
                const isAccepted = inquiry.status === "ACCEPTED";
                const isDeclined = inquiry.status === "DECLINED" || inquiry.status === "CLOSED";
                const isPending = pendingInquiryId === inquiry.id;
                const cardFeedback = inquiryFeedback[inquiry.id];
                const banner = providerInquiryBanner(inquiry.status);
                const activityNotes = providerMatchNotes(inquiry.notes);

                return (
                  <article
                    key={inquiry.id}
                    className={`rounded-card border p-4 ${
                      inquiry.status === "VISIT_REQUESTED" || inquiry.status === "CALLBACK_REQUESTED"
                        ? "border-brand-amber/50 bg-brand-amber/8"
                        : needsResponse
                          ? "border-brand-amber/40 bg-brand-amber/5"
                          : isAccepted
                            ? "border-brand-green-pale bg-brand-green-pale/15"
                            : isDeclined
                              ? "border-stone-200 bg-stone-50"
                              : "border-[var(--card-border)]"
                    }`}
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
                      <span className={`rounded px-3 py-1 text-xs font-semibold ${matchStatusBadgeClass(inquiry.status)}`}>
                        {inquiry.score}% match · {providerInquiryStatusLabel(inquiry.status)}
                      </span>
                    </div>

                    {banner ? (
                      <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-sm text-ink/75">{banner}</p>
                    ) : null}

                    {activityNotes ? (
                      <p className="mt-3 rounded-lg bg-brand-cream px-3 py-2 text-xs leading-5 text-ink/65 whitespace-pre-line">
                        {activityNotes}
                      </p>
                    ) : null}

                    {cardFeedback ? (
                      <p
                        className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                          cardFeedback.startsWith("Could not")
                            ? "bg-brand-beige-light/50 text-brand-amber-dark"
                            : "bg-brand-green-pale/30 text-brand-green-dark"
                        }`}
                        role="status"
                      >
                        {cardFeedback}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {needsResponse ? (
                        <>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() =>
                              void updateInquiry(inquiry.id, "ACCEPTED", inquiry.intake.contactName, inquiry.status)
                            }
                          >
                            {pendingAction === `${inquiry.id}:ACCEPTED`
                              ? "Accepting..."
                              : providerAcceptButtonLabel(inquiry.status)}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => setConfirmDecline({ id: inquiry.id, familyName: inquiry.intake.contactName })}
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
            </ScrollArea>
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
      <ConfirmDialog
        open={Boolean(confirmDecline)}
        tone="danger"
        pending={Boolean(confirmDecline && pendingAction === `${confirmDecline.id}:DECLINED`)}
        title="Decline this inquiry?"
        description="The family will be notified that your facility cannot help with this request right now."
        confirmLabel="Decline inquiry"
        onCancel={() => setConfirmDecline(null)}
        onConfirm={() => {
          if (!confirmDecline) return;
          void updateInquiry(
            confirmDecline.id,
            "DECLINED",
            confirmDecline.familyName,
            inquiries.find((item) => item.id === confirmDecline.id)?.status ?? "SUGGESTED"
          );
          setConfirmDecline(null);
        }}
      />
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
