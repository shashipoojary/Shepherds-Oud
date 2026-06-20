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
import { careTypeOptions, declineReasonOptions, careLevelOptions, dementiaCapacityOptions, dutchProvinces, facilityTypes, fundingTypeOptions, visitAvailabilityOptions } from "@/lib/config/content";
import {
  compareMatchPriority,
  isProviderActionNeeded,
  matchStatusBadgeClass,
  providerAcceptButtonLabel,
  providerInquiryActionMessage,
  providerInquiryBanner,
  providerInquiryStatusLabel,
  providerMatchNotes
} from "@/lib/domain/match-status";
import { sanitizeClientErrorMessage } from "@/lib/providers/errors";
import { recordAction } from "@/lib/client/actions";
import { cn } from "@/lib/core/utils";

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
  careLevels: string[];
  dementiaCapacity: string | null;
  fundingTypes: string[];
  responseTimeHours: number | null;
  visitAvailability: string | null;
  priceMin: number | null;
  priceMax: number | null;
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
  careLevels: string[];
  dementiaCapacity: string;
  fundingTypes: string[];
  responseTimeHours: string;
  visitAvailability: string;
  priceMin: string;
  priceMax: string;
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
  languages: [],
  careLevels: [],
  dementiaCapacity: dementiaCapacityOptions[0],
  fundingTypes: [],
  responseTimeHours: "",
  visitAvailability: visitAvailabilityOptions[0],
  priceMin: "",
  priceMax: ""
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
    languages: provider.languages ?? [],
    careLevels: provider.careLevels ?? [],
    dementiaCapacity: provider.dementiaCapacity || dementiaCapacityOptions[0],
    fundingTypes: provider.fundingTypes ?? [],
    responseTimeHours: provider.responseTimeHours?.toString() || "",
    visitAvailability: provider.visitAvailability || visitAvailabilityOptions[0],
    priceMin: provider.priceMin?.toString() || "",
    priceMax: provider.priceMax?.toString() || ""
  };
}

function parseOptionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.trunc(parsed);
}

function parseRequiredIntField(value: string): number | undefined | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return "invalid";
  }
  return parsed;
}

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as { error?: string; issues?: { fieldErrors?: Record<string, string[]> } };
    const fieldErrors = data.issues?.fieldErrors;
    if (fieldErrors) {
      const first = Object.values(fieldErrors).flat()[0];
      if (first) return sanitizeClientErrorMessage(first);
    }
    return sanitizeClientErrorMessage(data.error || "Request failed.");
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
  const [declineReason, setDeclineReason] = useState(declineReasonOptions[0]);

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

  function toggleList(key: "services" | "languages" | "careLevels" | "fundingTypes", value: string) {
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

    const bedsTotal = parseRequiredIntField(form.bedsTotal);
    if (bedsTotal === "invalid") {
      setMessageTone("error");
      setMessage("Total beds must be a whole number (0 or more).");
      setSaving(false);
      return;
    }

    const bedsOpen = parseRequiredIntField(form.bedsOpen);
    if (bedsOpen === "invalid") {
      setMessageTone("error");
      setMessage("Available beds must be a whole number (0 or more).");
      setSaving(false);
      return;
    }

    const responseTimeHours = parseOptionalInt(form.responseTimeHours);
    if (form.responseTimeHours.trim() && responseTimeHours === undefined) {
      setMessageTone("error");
      setMessage("Response time must be a whole number of hours.");
      setSaving(false);
      return;
    }

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
          ...(bedsTotal !== undefined ? { bedsTotal } : {}),
          ...(bedsOpen !== undefined ? { bedsOpen } : {}),
          availabilityStatus: form.availabilityStatus === "Not set" ? undefined : form.availabilityStatus,
          waitlistText: form.availabilityStatus === "Waitlist" ? "Waitlist open" : undefined,
          services: form.services,
          careLevels: form.careLevels,
          languages: form.languages,
          dementiaCapacity: form.dementiaCapacity === dementiaCapacityOptions[0] ? undefined : form.dementiaCapacity,
          fundingTypes: form.fundingTypes,
          ...(responseTimeHours !== undefined ? { responseTimeHours } : {}),
          visitAvailability: form.visitAvailability?.trim() || undefined,
          ...(parseOptionalInt(form.priceMin) !== undefined ? { priceMin: parseOptionalInt(form.priceMin) } : {}),
          ...(parseOptionalInt(form.priceMax) !== undefined ? { priceMax: parseOptionalInt(form.priceMax) } : {})
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

  async function updateInquiry(id: string, status: string, familyName: string, priorStatus: string, reason?: string) {
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
        body: JSON.stringify({ status, ...(reason ? { declineReason: reason } : {}) })
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
        <section className="flex min-h-0 flex-col rounded-card border border-[var(--card-border)] bg-white p-4 shadow-soft sm:p-5">
          <div className="shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">Family inquiries</h2>
                <p className="mt-1 text-sm text-ink/60">
                  When a family requests a visit or callback, accept or decline so they know you are interested. Their Care Guide will then coordinate next steps.
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
            <ScrollArea
              className="mt-4 h-[min(28rem,52vh)] min-h-[12rem] shrink-0"
              aria-label="Family inquiries list"
            >
              <ul className="divide-y divide-stone-200 pr-1">
                {sortedInquiries.map((inquiry) => {
                const needsResponse = isProviderActionNeeded(inquiry.status);
                const isAccepted = inquiry.status === "ACCEPTED";
                const isDeclined = inquiry.status === "DECLINED";
                const isClosed = inquiry.status === "CLOSED";
                const isCoordinating = inquiry.status === "CONTACTED";
                const isPlaced = inquiry.status === "PLACED";
                const isPending = pendingInquiryId === inquiry.id;
                const cardFeedback = inquiryFeedback[inquiry.id];
                const banner = providerInquiryBanner(inquiry.status);
                const activityNotes = providerMatchNotes(inquiry.notes);

                return (
                  <li
                    key={inquiry.id}
                    className={cn(
                      "space-y-3 border-l-[3px] py-4 pl-4 first:pt-0 last:pb-0",
                      needsResponse ? "border-l-brand-amber" : "border-l-transparent"
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{inquiry.intake.contactName}</p>
                        <p className="mt-1 text-sm text-ink/70">
                          {inquiry.intake.preferredArea} · {inquiry.intake.careTypes.join(", ")}
                        </p>
                        <p className="mt-1 text-sm text-ink/55">
                          {inquiry.intake.urgency} · Age {inquiry.intake.ageRange}
                        </p>
                        <p className="mt-2 break-all text-sm text-ink/70">
                          {inquiry.intake.phone} · {inquiry.intake.email}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                        <span className={cn("inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold leading-snug", matchStatusBadgeClass(inquiry.status))}>
                          {inquiry.score}% match · {providerInquiryStatusLabel(inquiry.status)}
                        </span>
                      </div>
                    </div>

                    {banner ? <p className="text-sm leading-6 text-ink/75">{banner}</p> : null}

                    {activityNotes ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Activity</p>
                        <p className="mt-1 whitespace-pre-line text-xs leading-5 text-ink/65">{activityNotes}</p>
                      </div>
                    ) : null}

                    {cardFeedback ? (
                      <p
                        className={cn(
                          "text-sm leading-6",
                          cardFeedback.startsWith("Could not") ? "text-brand-amber-dark" : "text-brand-green-dark"
                        )}
                        role="status"
                      >
                        {cardFeedback}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {needsResponse ? (
                        <>
                          <Button
                            className="w-full sm:w-auto"
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
                            className="w-full sm:w-auto"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => setConfirmDecline({ id: inquiry.id, familyName: inquiry.intake.contactName })}
                          >
                            {pendingAction === `${inquiry.id}:DECLINED` ? "Declining..." : "Decline"}
                          </Button>
                        </>
                      ) : null}
                      {isAccepted ? (
                        <span className="text-sm font-medium text-brand-green-dark">Accepted — Care Guide coordinating</span>
                      ) : null}
                      {isCoordinating ? (
                        <span className="text-sm font-medium text-ink/70">Visit or call coordinated</span>
                      ) : null}
                      {isPlaced ? (
                        <span className="text-sm font-medium text-brand-green-dark">Placement in progress</span>
                      ) : null}
                      {isDeclined ? (
                        <span className="text-sm font-medium text-neutral-600">Declined</span>
                      ) : null}
                      {isClosed ? (
                        <span className="text-sm font-medium text-neutral-600">Inquiry closed</span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
              </ul>
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
            <ChipField label="Care levels" options={careLevelOptions} selected={form.careLevels} onToggle={(value) => toggleList("careLevels", value)} />
          </div>
          <div className="md:col-span-2">
            <ChipField label="Languages spoken" options={["Dutch", "English", "Arabic", "Turkish", "German", "French"]} selected={form.languages} onToggle={(value) => toggleList("languages", value)} />
          </div>
          <Field label="Dementia capacity">
            <CustomSelect value={form.dementiaCapacity} onChange={(value) => updateForm("dementiaCapacity", value)} options={dementiaCapacityOptions} />
          </Field>
          <Field label="Visit availability">
            <CustomSelect value={form.visitAvailability} onChange={(value) => updateForm("visitAvailability", value)} options={visitAvailabilityOptions} />
          </Field>
          <Field label="Typical response time (hours)">
            <input type="number" min="1" max="168" value={form.responseTimeHours} onChange={(e) => updateForm("responseTimeHours", e.target.value)} className={inputClass} placeholder="e.g. 24" />
          </Field>
          <Field label="Monthly price min (EUR)">
            <input type="number" min="0" value={form.priceMin} onChange={(e) => updateForm("priceMin", e.target.value)} className={inputClass} placeholder="Optional" />
          </Field>
          <Field label="Monthly price max (EUR)">
            <input type="number" min="0" value={form.priceMax} onChange={(e) => updateForm("priceMax", e.target.value)} className={inputClass} placeholder="Optional" />
          </Field>
          <div className="md:col-span-2">
            <ChipField label="Funding types accepted" options={fundingTypeOptions} selected={form.fundingTypes} onToggle={(value) => toggleList("fundingTypes", value)} />
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
        description="Please select a reason. The family and their Care Guide will see that your facility cannot help right now."
        confirmLabel="Decline inquiry"
        onCancel={() => {
          setConfirmDecline(null);
          setDeclineReason(declineReasonOptions[0]);
        }}
        onConfirm={() => {
          if (!confirmDecline) return;
          void updateInquiry(
            confirmDecline.id,
            "DECLINED",
            confirmDecline.familyName,
            inquiries.find((item) => item.id === confirmDecline.id)?.status ?? "SUGGESTED",
            declineReason
          );
          setConfirmDecline(null);
          setDeclineReason(declineReasonOptions[0]);
        }}
      >
        <label className="mt-4 grid gap-2 text-left text-sm font-medium text-ink">
          Decline reason
          <CustomSelect value={declineReason} onChange={setDeclineReason} options={declineReasonOptions} />
        </label>
      </ConfirmDialog>
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
