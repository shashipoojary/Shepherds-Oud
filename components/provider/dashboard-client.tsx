"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CustomSelect } from "@/components/ui/custom-select";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { RefreshButton } from "@/components/ui/refresh-button";
import { ListPager } from "@/components/ui/list-pager";
import { PanelSection, panelNoticeTone, SlidePanel, usePanelMessage } from "@/components/ui/slide-panel";
import { ProviderCalendarSettings } from "@/components/provider/calendar-settings";
import {
  careTypeOptions,
  careLevelOptions,
  dementiaCapacityOptions,
  dutchProvinces,
  facilityTypes,
  fundingTypeOptions,
  visitAvailabilityOptions
} from "@/lib/config/content";
import { occupiedBeds, occupancyPercent } from "@/lib/domain/provider-occupancy";
import { sanitizeClientErrorMessage } from "@/lib/providers/errors";
import { recordAction } from "@/lib/client/actions";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import { useLocale } from "@/components/i18n/locale-provider";
import { dateLocale, optionLabel, productUi } from "@/lib/i18n/ui";
import type { Locale } from "@/lib/i18n/config";
import { brand } from "@/lib/config/brand";
import { cn } from "@/lib/core/utils";
import { PROVIDER_AVAILABILITY_OPTIONS } from "@/lib/domain/provider-availability";
import {
  formatWaitEstimateDays,
  hasStructuredWaitEstimate,
  isWaitEstimateStale,
  waitEstimateAgeDays
} from "@/lib/domain/wait-estimate";

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
  waitEstimateMinDays: number | null;
  waitEstimateMaxDays: number | null;
  waitEstimateUpdatedAt: string | null;
  services: string[];
  languages: string[];
  careLevels: string[];
  dementiaCapacity: string | null;
  fundingTypes: string[];
  responseTimeHours: number | null;
  visitAvailability: string | null;
  priceMin: number | null;
  priceMax: number | null;
  roomTypes: string[];
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
  website: string;
  roomTypesText: string;
  bedsTotal: string;
  bedsOpen: string;
  availabilityStatus: string;
  waitEstimateMinDays: string;
  waitEstimateMaxDays: string;
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

type CrisisReferral = {
  id: string;
  feeStatus: string;
  referredAt: string;
  confirmedAt: string | null;
  caseId: string;
  path: string | null;
  urgency: string | null;
  familyName: string;
  patientName: string | null;
  relationship: string | null;
  directoryName: string;
  municipality: string;
};

type DashboardData = {
  provider: ProviderRecord | null;
  profileComplete: boolean;
  profileMissingRequirements: string[];
  referrals?: CrisisReferral[];
  referralsPagination?: { page: number; pageSize: number; total: number };
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
  website: "",
  roomTypesText: "",
  bedsTotal: "",
  bedsOpen: "",
  availabilityStatus: "Not set",
  waitEstimateMinDays: "",
  waitEstimateMaxDays: "",
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

const availabilityOptions = [...PROVIDER_AVAILABILITY_OPTIONS];

function parseRoomTypesText(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

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
    website: provider.website || "",
    roomTypesText: (provider.roomTypes ?? []).join(", "),
    bedsTotal: provider.bedsTotal?.toString() || "",
    bedsOpen: provider.bedsOpen?.toString() || "",
    availabilityStatus: provider.availabilityStatus || "Not set",
    waitEstimateMinDays: provider.waitEstimateMinDays?.toString() || "",
    waitEstimateMaxDays: provider.waitEstimateMaxDays?.toString() || "",
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

async function readApiError(response: Response, locale: Locale) {
  const fallback = productUi(locale).provider.requestFailed;
  try {
    const data = (await response.json()) as { error?: string; issues?: { fieldErrors?: Record<string, string[]> } };
    const fieldErrors = data.issues?.fieldErrors;
    if (fieldErrors) {
      const first = Object.values(fieldErrors).flat()[0];
      if (first) return sanitizeClientErrorMessage(first);
    }
    return sanitizeClientErrorMessage(data.error || fallback);
  } catch {
    return fallback;
  }
}

export function ProviderDashboardClient({ initialData }: { initialData?: DashboardData }) {
  const { locale, ui } = useLocale();
  const [form, setForm] = useState<FormState>(() => toForm(initialData?.provider ?? null));
  const [referrals, setReferrals] = useState<CrisisReferral[]>(initialData?.referrals ?? []);
  const [referralsPagination, setReferralsPagination] = useState(
    initialData?.referralsPagination ?? { page: 1, pageSize: 25, total: initialData?.referrals?.length ?? 0 }
  );
  const [referralsPending, setReferralsPending] = useState(false);
  const [confirmingReferralId, setConfirmingReferralId] = useState<string | null>(null);
  const [profileComplete, setProfileComplete] = useState(initialData?.profileComplete ?? false);
  const [profileMissingRequirements, setProfileMissingRequirements] = useState<string[]>(
    initialData?.profileMissingRequirements ?? []
  );
  const [loading, setLoading] = useState(!initialData);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(initialData?.provider?.id ?? null);
  const [waitEstimateUpdatedAt, setWaitEstimateUpdatedAt] = useState<string | null>(
    initialData?.provider?.waitEstimateUpdatedAt ?? null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);

  async function confirmReferral(referralId: string) {
    setConfirmingReferralId(referralId);
    setMessage("");
    try {
      const response = await fetch("/api/v2/partner/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralId })
      });
      const data = (await response.json()) as { error?: string; feeStatus?: string; confirmedAt?: string };
      if (!response.ok) {
        setMessageTone("error");
        setMessage(data.error || "Could not confirm placement.");
        return;
      }
      setReferrals((current) =>
        current.map((item) =>
          item.id === referralId
            ? {
                ...item,
                feeStatus: data.feeStatus || "INVOICED",
                confirmedAt: data.confirmedAt || new Date().toISOString()
              }
            : item
        )
      );
      setMessageTone("success");
      setMessage("Placement confirmed — fee status moved to invoiced.");
    } catch {
      setMessageTone("error");
      setMessage("Could not confirm placement.");
    } finally {
      setConfirmingReferralId(null);
    }
  }

  async function refreshDashboard(referralsPage = referralsPagination.page) {
    setRefreshing(true);
    setMessage("");
    try {
      const response = await fetch(`/api/provider/me?referralsPage=${referralsPage}`);
      if (response.ok) {
        const data = (await response.json()) as DashboardData;
        setForm(toForm(data.provider));
        setReferrals(data.referrals ?? []);
        setReferralsPagination(
          data.referralsPagination ?? { page: 1, pageSize: 25, total: data.referrals?.length ?? 0 }
        );
        setProfileComplete(data.profileComplete);
        setProfileMissingRequirements(data.profileMissingRequirements);
        setProviderId(data.provider?.id ?? null);
        setWaitEstimateUpdatedAt(data.provider?.waitEstimateUpdatedAt ?? null);
        setMessageTone("success");
        setMessage(ui.provider.dashboardRefreshed);
      } else {
        setMessageTone("error");
        setMessage(await readApiError(response, locale));
      }
    } catch {
      setMessageTone("error");
      setMessage(ui.provider.refreshFailed);
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
          setReferrals(data.referrals ?? []);
          setReferralsPagination(
            data.referralsPagination ?? { page: 1, pageSize: 25, total: data.referrals?.length ?? 0 }
          );
          setProfileComplete(data.profileComplete);
          setProfileMissingRequirements(data.profileMissingRequirements);
          setProviderId(data.provider?.id ?? null);
          setWaitEstimateUpdatedAt(data.provider?.waitEstimateUpdatedAt ?? null);
        } else {
          setMessageTone("error");
          setMessage(await readApiError(response, locale));
        }
      } catch {
        setMessageTone("error");
        setMessage(ui.provider.loadFailed);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [initialData, locale]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), TOAST_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

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

  async function saveProfile(notify: (message: string, tone?: "success" | "error") => void = (text, tone = "success") => {
    setMessageTone(tone);
    setMessage(text);
  }) {
    if (form.name.trim().length < 2) {
      notify(ui.provider.nameMinLength, "error");
      return;
    }

    setSaving(true);
    setMessage("");

    const bedsTotal = parseRequiredIntField(form.bedsTotal);
    if (bedsTotal === "invalid") {
      notify(ui.provider.bedsTotalInvalid, "error");
      setSaving(false);
      return;
    }

    const bedsOpen = parseRequiredIntField(form.bedsOpen);
    if (bedsOpen === "invalid") {
      notify(ui.provider.bedsOpenInvalid, "error");
      setSaving(false);
      return;
    }

    const responseTimeHours = parseOptionalInt(form.responseTimeHours);
    if (form.responseTimeHours.trim() && responseTimeHours === undefined) {
      notify(ui.provider.responseTimeInvalid, "error");
      setSaving(false);
      return;
    }

    const waitMinRaw = form.waitEstimateMinDays.trim();
    const waitMaxRaw = form.waitEstimateMaxDays.trim();
    const waitEstimateMinDays = waitMinRaw ? parseRequiredIntField(form.waitEstimateMinDays) : null;
    const waitEstimateMaxDays = waitMaxRaw ? parseRequiredIntField(form.waitEstimateMaxDays) : null;

    if (waitEstimateMinDays === "invalid" || waitEstimateMaxDays === "invalid") {
      notify(ui.validation.waitEstimateWhole, "error");
      setSaving(false);
      return;
    }

    if ((waitEstimateMinDays == null) !== (waitEstimateMaxDays == null)) {
      notify(ui.validation.waitEstimateBothRequired, "error");
      setSaving(false);
      return;
    }

    if (
      waitEstimateMinDays != null &&
      waitEstimateMaxDays != null &&
      waitEstimateMinDays > waitEstimateMaxDays
    ) {
      notify(ui.validation.waitEstimateMinMaxOrder, "error");
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
          website: form.website.trim() || undefined,
          roomTypes: parseRoomTypesText(form.roomTypesText),
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
          ...(parseOptionalInt(form.priceMax) !== undefined ? { priceMax: parseOptionalInt(form.priceMax) } : {}),
          waitEstimateMinDays,
          waitEstimateMaxDays
        })
      });

      if (!response.ok) {
        notify(await readApiError(response, locale), "error");
        return;
      }

      const data = (await response.json()) as DashboardData;
      const provider = data.provider;
      if (!provider) {
        notify(ui.provider.profileReadFailed, "error");
        return;
      }
      setForm(toForm(provider));
      setProviderId(provider.id);
      setWaitEstimateUpdatedAt(provider.waitEstimateUpdatedAt ?? null);
      setProfileComplete(data.profileComplete);
      setProfileMissingRequirements(data.profileMissingRequirements);
      notify(
        data.profileComplete ? ui.provider.profileSavedComplete : ui.provider.profileSavedIncomplete
      );

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
      notify(ui.provider.profileSaveFailed, "error");
    } finally {
      setSaving(false);
    }
  }

  const bedsOpenParsed = parseOptionalInt(form.bedsOpen) ?? null;
  const bedsTotalParsed = parseOptionalInt(form.bedsTotal) ?? null;
  const occupancyPct = occupancyPercent({ bedsOpen: bedsOpenParsed, bedsTotal: bedsTotalParsed });
  const occupiedCount = occupiedBeds({ bedsOpen: bedsOpenParsed, bedsTotal: bedsTotalParsed });
  const waitMinParsed = parseOptionalInt(form.waitEstimateMinDays);
  const waitMaxParsed = parseOptionalInt(form.waitEstimateMaxDays);
  const waitFields = {
    waitEstimateMinDays: waitMinParsed ?? null,
    waitEstimateMaxDays: waitMaxParsed ?? null,
    waitEstimateUpdatedAt
  };
  const waitHasEstimate = hasStructuredWaitEstimate(waitFields);
  const waitDisplay = waitHasEstimate
    ? formatWaitEstimateDays(waitFields.waitEstimateMinDays!, waitFields.waitEstimateMaxDays!, locale)
    : null;
  const waitStale = waitHasEstimate && isWaitEstimateStale(waitEstimateUpdatedAt);

  const pendingReferrals = referrals.filter((item) => item.feeStatus === "PENDING").length;
  const confirmedReferrals = referrals.filter((item) => item.feeStatus !== "PENDING").length;

  if (loading) {
    return <DashboardSkeleton title="provider dashboard" />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="section-label">{ui.provider.dashboardTitle}</p>
          <h1 className="mt-1 text-h2 font-semibold text-ink">Crisis triage referrals</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink/60">
            Confirm directory placements and keep your facility profile and bed capacity up to date.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 bg-white sm:flex-none"
            onClick={() => setProfilePanelOpen(true)}
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{ui.provider.facilityProfileButton}</span>
            {!profileComplete ? (
              <span
                className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-amber px-1.5 text-[11px] font-bold leading-none tabular-nums text-white"
                aria-label={ui.provider.profileItemsNeededAria(profileMissingRequirements.length)}
              >
                {profileMissingRequirements.length}
              </span>
            ) : null}
          </Button>
          <RefreshButton onClick={() => void refreshDashboard()} loading={refreshing} />
        </div>
      </header>

      {message ? (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            messageTone === "success" ? "bg-brand-green-pale/30 text-brand-green-dark" : "bg-brand-beige-light/50 text-brand-amber-dark"
          }`}
          role="status"
        >
          {message}
        </div>
      ) : null}

      <section className="mb-3 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-soft">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {(
            [
              [String(pendingReferrals), "Pending referrals"],
              [String(confirmedReferrals), "Confirmed"],
              [bedsOpenParsed != null ? String(bedsOpenParsed) : "—", "Open beds"],
              [
                profileComplete ? "Complete" : ui.provider.missingCount(profileMissingRequirements.length),
                ui.provider.profileStatus
              ]
            ] as Array<[string, string]>
          ).map(([value, label], index) => (
            <div
              key={label}
              className={cn(
                "min-w-0 px-3 py-3 text-center sm:px-4 sm:py-3.5",
                index % 2 === 1 && "border-l border-stone-100",
                index >= 2 && "border-t border-stone-100 sm:border-t-0",
                index > 0 && "sm:border-l sm:border-stone-100"
              )}
            >
              <p className="text-xl font-semibold tabular-nums leading-none text-brand-amber sm:text-2xl">{value}</p>
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-ink/45">{label}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-stone-100 bg-brand-cream/35 px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 min-[480px]:grid-cols-3">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-ink/45">
                  {ui.provider.occupancyBedsLabel}
                </p>
                <p className="mt-0.5 text-base font-semibold tabular-nums text-ink sm:text-lg">
                  {bedsOpenParsed != null ? bedsOpenParsed : "—"}
                </p>
                {occupancyPct != null && occupiedCount != null && bedsTotalParsed != null ? (
                  <p className="mt-0.5 text-xs leading-snug text-ink/55">
                    {occupancyPct}% {ui.provider.occupancyPercentLabel.toLowerCase()}
                    {" · "}
                    {ui.provider.occupancyOccupiedCount(occupiedCount, bedsTotalParsed)}
                  </p>
                ) : bedsOpenParsed != null && bedsTotalParsed != null && bedsOpenParsed <= bedsTotalParsed ? (
                  <p className="mt-0.5 text-xs text-ink/55">
                    {ui.provider.occupancyBedsOfTotal(bedsOpenParsed, bedsTotalParsed)}
                  </p>
                ) : null}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-ink/45">
                  {ui.provider.occupancyAvailability}
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-ink sm:text-base">
                  {optionLabel(locale, form.availabilityStatus)}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-ink/45">
                  {ui.provider.occupancyWaitEstimate}
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-ink sm:text-base">
                  {waitDisplay ?? "—"}
                </p>
                {waitHasEstimate && waitStale ? (
                  <p className="mt-0.5 text-xs text-brand-amber-dark">{ui.provider.occupancyWaitStale}</p>
                ) : null}
              </div>
            </div>

            <Button
              type="button"
              size="xs"
              variant="outline"
              className="w-full shrink-0 bg-white sm:mt-0.5 sm:w-auto"
              onClick={() => setProfilePanelOpen(true)}
            >
              {ui.provider.occupancyEditCapacity}
            </Button>
          </div>
        </div>
      </section>

      {!profileComplete ? (
        <section className="mb-4 rounded-xl border border-brand-amber/25 bg-brand-amber/10 px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-semibold text-ink">{ui.provider.completeProfile}</h2>
              {profileMissingRequirements.length ? (
                <p className="mt-1.5 text-sm text-ink/65">
                  {profileMissingRequirements.slice(0, 3).join(" · ")}
                  {profileMissingRequirements.length > 3
                    ? ` · +${profileMissingRequirements.length - 3}`
                    : ""}
                </p>
              ) : null}
            </div>
            <Button type="button" size="sm" className="w-full shrink-0 sm:w-auto" onClick={() => setProfilePanelOpen(true)}>
              {ui.provider.openProfile}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="mb-4 overflow-hidden rounded-xl bg-white shadow-soft">
        <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-ink sm:text-lg">Directory referrals</h2>
            <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-ink/55">
              {referralsPagination.total}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink/55">
            Families who contacted your linked directory listing from a triage case. Confirm when a placement starts.
          </p>
        </div>
        {!referrals.length ? (
          <div className="px-4 py-8 text-center sm:px-5">
            <p className="text-sm text-ink/60">
              No triage referrals yet. Link your facility to a Haaglanden directory listing to receive introductions here.
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-stone-100">
              {referrals.map((referral) => (
                <li key={referral.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{referral.familyName}</p>
                    <p className="mt-0.5 text-xs text-ink/55">
                      {referral.patientName ? `${referral.patientName} · ` : ""}
                      {referral.path?.replaceAll("_", " ") || "Path pending"} · {referral.feeStatus}
                    </p>
                    <p className="mt-0.5 text-xs text-ink/45">
                      {new Date(referral.referredAt).toLocaleDateString(dateLocale(locale))}
                      {referral.municipality ? ` · ${referral.municipality}` : ""}
                    </p>
                  </div>
                  {referral.feeStatus === "PENDING" ? (
                    <Button
                      size="sm"
                      disabled={confirmingReferralId === referral.id}
                      onClick={() => void confirmReferral(referral.id)}
                    >
                      Confirm placement
                    </Button>
                  ) : (
                    <span className="text-xs font-medium uppercase tracking-wide text-ink/45">{referral.feeStatus}</span>
                  )}
                </li>
              ))}
            </ul>
            <ListPager
              page={referralsPagination.page}
              pageSize={referralsPagination.pageSize}
              total={referralsPagination.total}
              pending={referralsPending || refreshing}
              onPageChange={(page) => {
                setReferralsPending(true);
                void refreshDashboard(page).finally(() => setReferralsPending(false));
              }}
            />
          </>
        )}
      </section>

      <section className="mt-5 rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-soft sm:px-5 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">{ui.provider.needHelp}</p>
            <p className="mt-1 text-sm text-ink/65">{ui.provider.supportHint}</p>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
            <a href={`mailto:${brand.email}`}>{ui.provider.emailSupport}</a>
          </Button>
        </div>
      </section>

      <ProviderProfilePanel
        open={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        form={form}
        updateForm={updateForm}
        toggleList={toggleList}
        saving={saving}
        providerId={providerId}
        waitEstimateUpdatedAt={waitEstimateUpdatedAt}
        profileComplete={profileComplete}
        profileMissingRequirements={profileMissingRequirements}
        onSave={(panelNotify) =>
          void saveProfile((msg, tone) => {
            if (msg) panelNotify(msg);
            if (msg) {
              setMessageTone(tone ?? "success");
              setMessage(msg);
            }
          })
        }
      />
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--card-border)] px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-amber";

function ProviderProfilePanel({
  open,
  onClose,
  form,
  updateForm,
  toggleList,
  saving,
  providerId,
  waitEstimateUpdatedAt,
  profileComplete,
  profileMissingRequirements,
  onSave
}: {
  open: boolean;
  onClose: () => void;
  form: FormState;
  updateForm: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  toggleList: (key: "services" | "languages" | "careLevels" | "fundingTypes", value: string) => void;
  saving: boolean;
  providerId: string | null;
  waitEstimateUpdatedAt: string | null;
  profileComplete: boolean;
  profileMissingRequirements: string[];
  onSave: (notify: (message: string, tone?: "success" | "error") => void) => void;
}) {
  const { locale, ui } = useLocale();
  const p = ui.provider;
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();

  const waitAgeDays = waitEstimateAgeDays(waitEstimateUpdatedAt);
  const waitIsStale = Boolean(
    form.waitEstimateMinDays.trim() &&
      form.waitEstimateMaxDays.trim() &&
      isWaitEstimateStale(waitEstimateUpdatedAt)
  );

  useEffect(() => {
    if (!open) clearPanelMessage();
  }, [open, clearPanelMessage]);

  function notifyPanel(message: string) {
    setPanelMessage(message);
  }

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      size="wide"
      title={ui.provider.facilityProfile}
      subtitle={
        profileComplete
          ? p.profileSubtitleComplete
          : p.profileSubtitleIncomplete(profileMissingRequirements.length)
      }
      notice={panelMessage}
      noticeTone={panelNoticeTone(panelMessage)}
      footer={
        <Button type="submit" form="provider-facility-profile-form" disabled={saving} className="w-full sm:w-auto sm:min-w-[200px]">
          {saving ? p.saving : providerId ? ui.provider.saveProfile : p.createProfile}
        </Button>
      }
    >
      <form
        id="provider-facility-profile-form"
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSave((message) => {
            if (message) notifyPanel(message);
          });
        }}
      >
        <PanelSection step={1} title={ui.provider.availability} description={p.availabilitySectionDesc}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={ui.provider.availableBeds}>
              <input
                type="number"
                min="0"
                value={form.bedsOpen}
                placeholder={p.notSetPlaceholder}
                onChange={(event) => updateForm("bedsOpen", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={p.availabilityStatusLabel}>
              <CustomSelect value={form.availabilityStatus} onChange={(value) => updateForm("availabilityStatus", value)} options={availabilityOptions} formatOption={(value) => optionLabel(locale, value)} />
            </Field>
            <Field label={p.totalBedsLabel}>
              <input type="number" min="0" value={form.bedsTotal} onChange={(e) => updateForm("bedsTotal", e.target.value)} className={inputClass} placeholder={p.optionalPlaceholder} />
            </Field>
          </div>
        </PanelSection>

        <PanelSection title={p.waitEstimateSectionTitle} description={p.waitEstimateSectionDesc}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={p.waitEstimateMinLabel}>
              <input
                type="number"
                min="0"
                step="1"
                value={form.waitEstimateMinDays}
                onChange={(event) => updateForm("waitEstimateMinDays", event.target.value)}
                className={inputClass}
                placeholder={p.optionalPlaceholder}
              />
            </Field>
            <Field label={p.waitEstimateMaxLabel}>
              <input
                type="number"
                min="0"
                step="1"
                value={form.waitEstimateMaxDays}
                onChange={(event) => updateForm("waitEstimateMaxDays", event.target.value)}
                className={inputClass}
                placeholder={p.optionalPlaceholder}
              />
            </Field>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink/65">{p.waitEstimateHelper}</p>
          {waitEstimateUpdatedAt && waitAgeDays != null ? (
            <p className={cn("mt-2 text-sm leading-6", waitIsStale ? "text-brand-amber-dark" : "text-ink/65")}>
              {p.waitEstimateStalePrompt(waitAgeDays)}
              {waitIsStale ? ` ${p.waitEstimateStaleForFamilies}` : null}
            </p>
          ) : null}
        </PanelSection>

        <PanelSection step={2} title={ui.provider.facilityDetails} description={p.facilityDetailsDesc}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={p.facilityNameLabel}>
              <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} className={inputClass} required minLength={2} />
            </Field>
            <Field label={p.facilityTypeLabel}>
              <CustomSelect value={form.type} onChange={(value) => updateForm("type", value)} options={facilityTypes} formatOption={(value) => optionLabel(locale, value)} />
            </Field>
            <Field label={p.contactPersonLabel}>
              <input value={form.contactName} onChange={(e) => updateForm("contactName", e.target.value)} className={inputClass} />
            </Field>
            <Field label={p.detailEmail}>
              <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} className={inputClass} placeholder="contact@facility.nl" />
            </Field>
            <Field label={p.detailPhone}>
              <input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className={inputClass} placeholder="+31 6 ..." />
            </Field>
            <Field label={p.cityLabel}>
              <input value={form.city} onChange={(e) => updateForm("city", e.target.value)} className={inputClass} placeholder={p.cityPlaceholder} />
            </Field>
            <Field label={p.provinceLabel}>
              <CustomSelect value={form.province} onChange={(value) => updateForm("province", value)} options={dutchProvinces} />
            </Field>
            <Field label={p.websiteLabel}>
              <input
                type="url"
                value={form.website}
                onChange={(e) => updateForm("website", e.target.value)}
                className={inputClass}
                placeholder={p.websitePlaceholder}
              />
            </Field>
            <Field label={p.roomTypesLabel}>
              <input
                value={form.roomTypesText}
                onChange={(e) => updateForm("roomTypesText", e.target.value)}
                className={inputClass}
                placeholder={p.roomTypesPlaceholder}
              />
            </Field>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink/65">{p.roomTypesHelper}</p>
          <div className="mt-4">
            <Field label={p.descriptionLabel}>
              <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} className={`${inputClass} min-h-24`} placeholder={p.descriptionPlaceholder} />
            </Field>
          </div>
        </PanelSection>

        <PanelSection step={3} title={ui.provider.careProfile} description={p.careProfileDesc}>
          <div className="space-y-4">
            <ChipField label={p.servicesOfferedLabel} options={careTypeOptions} selected={form.services} onToggle={(value) => toggleList("services", value)} locale={locale} />
            <ChipField label={p.careLevelsLabel} options={careLevelOptions} selected={form.careLevels} onToggle={(value) => toggleList("careLevels", value)} locale={locale} />
            <ChipField label={p.languagesSpokenLabel} options={["Dutch", "English", "Arabic", "Turkish", "German", "French"]} selected={form.languages} onToggle={(value) => toggleList("languages", value)} locale={locale} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={p.dementiaCapacityLabel}>
                <CustomSelect value={form.dementiaCapacity} onChange={(value) => updateForm("dementiaCapacity", value)} options={dementiaCapacityOptions} formatOption={(value) => optionLabel(locale, value)} />
              </Field>
              <Field label={p.visitAvailabilityLabel}>
                <CustomSelect value={form.visitAvailability} onChange={(value) => updateForm("visitAvailability", value)} options={visitAvailabilityOptions} formatOption={(value) => optionLabel(locale, value)} />
              </Field>
            </div>
          </div>
        </PanelSection>

        <PanelSection step={4} title={ui.provider.pricingResponse} description={p.pricingSectionDesc}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={p.typicalResponseLabel}>
              <input type="number" min="1" max="168" value={form.responseTimeHours} onChange={(e) => updateForm("responseTimeHours", e.target.value)} className={inputClass} placeholder={p.exampleResponsePlaceholder} />
            </Field>
            <Field label={p.priceMinLabel}>
              <input type="number" min="0" value={form.priceMin} onChange={(e) => updateForm("priceMin", e.target.value)} className={inputClass} placeholder={p.optionalPlaceholder} />
            </Field>
            <Field label={p.priceMaxLabel}>
              <input type="number" min="0" value={form.priceMax} onChange={(e) => updateForm("priceMax", e.target.value)} className={inputClass} placeholder={p.optionalPlaceholder} />
            </Field>
          </div>
          <div className="mt-4">
            <ChipField label={p.fundingAcceptedLabel} options={fundingTypeOptions} selected={form.fundingTypes} onToggle={(value) => toggleList("fundingTypes", value)} locale={locale} />
          </div>
        </PanelSection>

        {open ? <ProviderCalendarSettings onNotify={setPanelMessage} /> : null}

        {!profileComplete && profileMissingRequirements.length ? (
          <div className="rounded-xl border border-brand-amber/25 bg-brand-amber/10 px-4 py-3">
            <p className="text-sm font-semibold text-ink">{p.stillNeededForInquiries}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {profileMissingRequirements.map((item) => (
                <li key={item} className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-ink/75">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </SlidePanel>
  );
}

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
  onToggle,
  locale
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  locale: ReturnType<typeof useLocale>["locale"];
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip key={option} selected={selected.includes(option)} onClick={() => onToggle(option)}>
            {optionLabel(locale, option)}
          </Chip>
        ))}
      </div>
    </div>
  );
}
