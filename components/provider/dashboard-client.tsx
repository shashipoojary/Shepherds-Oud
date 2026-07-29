"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Copy, Mail, Phone, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Chip } from "@/components/ui/chip";
import { CustomSelect } from "@/components/ui/custom-select";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSearch } from "@/components/ui/list-search";
import { RefreshButton } from "@/components/ui/refresh-button";
import { UnreadDot } from "@/components/ui/unread-dot";
import { PanelSection, DetailList, panelNoticeTone, SlidePanel, StatusPill, usePanelMessage } from "@/components/ui/slide-panel";
import { ProviderCalendarSettings } from "@/components/provider/calendar-settings";
import { VisitSlotPicker } from "@/components/scheduling/visit-slot-picker";
import { postMatchSchedule } from "@/lib/client/match-request";
import { careTypeOptions, declineReasonOptions, careLevelOptions, dementiaCapacityOptions, dutchProvinces, facilityTypes, fundingTypeOptions, visitAvailabilityOptions } from "@/lib/config/content";
import {
  compareMatchPriority,
  filterProviderInquiriesByTab,
  isProviderActionNeeded,
  matchStatusBadgeClass,
  providerAcceptButtonLabel,
  providerInquiryBanner,
  providerInquiryStatusLabel,
  providerInquiryTabLabel,
  providerMatchNotes,
  type ProviderInquiryTab
} from "@/lib/domain/match-status";
import { buildProviderInquiryInsights } from "@/lib/domain/provider-inquiry-insights";
import { occupiedBeds, occupancyPercent } from "@/lib/domain/provider-occupancy";
import { sanitizeClientErrorMessage } from "@/lib/providers/errors";
import { recordAction } from "@/lib/client/actions";
import {
  initProviderInquirySeenFromData,
  isProviderInquiryUnread,
  markProviderInquirySeen
} from "@/lib/client/provider-inquiry-seen";
import {
  countUnseenProviderInquiriesInTab,
  getProviderInquiryTabSeenAt,
  initProviderInquiryTabSeenFromData,
  markProviderInquiryTabSeen
} from "@/lib/client/provider-inquiry-tab-seen";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import { useLocale } from "@/components/i18n/locale-provider";
import { dateLocale, optionLabel, productUi } from "@/lib/i18n/ui";
import type { Locale } from "@/lib/i18n/config";
import { brand } from "@/lib/config/brand";
import { cn } from "@/lib/core/utils";
import { formatReference, matchesListSearch, matchesReferenceQuery } from "@/lib/domain/reference";
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

type Inquiry = {
  id: string;
  intakeId: string;
  score: number;
  status: string;
  notes: string | null;
  declineReason: string | null;
  createdAt: string;
  updatedAt: string;
  proposedStartsAt?: string | null;
  proposedEndsAt?: string | null;
  alternateStartsAt?: string | null;
  alternateEndsAt?: string | null;
  confirmedStartsAt?: string | null;
  confirmedEndsAt?: string | null;
  schedulingStatus?: string | null;
  schedulingMode?: string | null;
  schedulingExpiresAt?: string | null;
  intake: {
    contactName: string;
    preferredArea: string;
    careTypes: string[];
    urgency: string;
    ageRange: string;
    phone: string;
    email: string;
    status: string;
    visitScheduledAt: string | null;
    visitType: string | null;
    visitProviderName: string | null;
    visitNotes: string | null;
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

type DashboardData = {
  provider: ProviderRecord | null;
  profileComplete: boolean;
  profileMissingRequirements: string[];
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

function formatProviderVisit(inquiry: Inquiry, locale: Locale) {
  const p = productUi(locale).provider;
  if (!inquiry.intake.visitScheduledAt) return null;
  const date = new Date(inquiry.intake.visitScheduledAt);
  if (Number.isNaN(date.getTime())) return null;
  const when = date.toLocaleString(dateLocale(locale), { dateStyle: "medium", timeStyle: "short" });
  const kind = inquiry.intake.visitType === "CALLBACK" ? p.visitCallback : p.visitOnSite;
  const providerName = inquiry.intake.visitProviderName ? p.visitWithProvider(inquiry.intake.visitProviderName) : "";
  return `${kind}${providerName} — ${when}`;
}

function providerNextStep(inquiry: Inquiry, locale: Locale) {
  const p = productUi(locale).provider;
  const visit = formatProviderVisit(inquiry, locale);

  switch (inquiry.status) {
    case "ACCEPTED":
      if (visit) {
        return {
          title: p.nextStepAcceptedVisitTitle,
          description: p.nextStepAcceptedVisitDesc,
          visitLine: visit,
          tone: "visit" as const
        };
      }
      return {
        title: p.nextStepAcceptedWaitTitle,
        description: p.nextStepAcceptedWaitDesc
      };
    case "CONTACTED":
      return {
        title: p.nextStepContactedTitle,
        description: visit ? p.nextStepContactedDescWithVisit : p.nextStepContactedDescNoVisit,
        visitLine: visit || undefined,
        tone: visit ? ("visit" as const) : undefined
      };
    case "PLACED":
      return {
        title: p.nextStepPlacedTitle,
        description: p.nextStepPlacedDesc
      };
    case "DECLINED":
      return {
        title: p.nextStepDeclinedTitle,
        description: p.nextStepDeclinedDesc
      };
    case "CLOSED":
      return {
        title: p.nextStepClosedTitle,
        description: p.nextStepClosedDesc
      };
    default:
      return null;
  }
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
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialData?.inquiries ?? []);
  const [profileComplete, setProfileComplete] = useState(initialData?.profileComplete ?? false);
  const [profileMissingRequirements, setProfileMissingRequirements] = useState<string[]>(
    initialData?.profileMissingRequirements ?? []
  );
  const [loading, setLoading] = useState(!initialData);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [pendingInquiryId, setPendingInquiryId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [inquiryFeedback, setInquiryFeedback] = useState<Record<string, string>>({});
  const [providerId, setProviderId] = useState<string | null>(initialData?.provider?.id ?? null);
  const [waitEstimateUpdatedAt, setWaitEstimateUpdatedAt] = useState<string | null>(
    initialData?.provider?.waitEstimateUpdatedAt ?? null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState<{ id: string } | null>(null);
  const [declineReason, setDeclineReason] = useState(declineReasonOptions[0]);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [inquiryTab, setInquiryTab] = useState<ProviderInquiryTab>("new");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiryTabSeenAt, setInquiryTabSeenAt] = useState(getProviderInquiryTabSeenAt);
  const [inquirySeenVersion, setInquirySeenVersion] = useState(0);
  const [inquirySearch, setInquirySearch] = useState("");

  const providerInquiryTabs: ProviderInquiryTab[] = ["new", "ongoing", "closed", "all"];

  const bumpInquirySeen = useCallback(() => {
    setInquirySeenVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    setInquiryTabSeenAt(getProviderInquiryTabSeenAt());
  }, []);

  function openInquiry(inquiry: Inquiry) {
    markProviderInquirySeen(inquiry.id, inquiry.updatedAt, inquiry.createdAt);
    bumpInquirySeen();
    setSelectedInquiry(inquiry);
  }

  async function refreshDashboard() {
    setRefreshing(true);
    setMessage("");
    try {
      const response = await fetch("/api/provider/me");
      if (response.ok) {
        const data = (await response.json()) as DashboardData;
        setForm(toForm(data.provider));
        setInquiries(data.inquiries);
        setProfileComplete(data.profileComplete);
        setProfileMissingRequirements(data.profileMissingRequirements);
        setProviderId(data.provider?.id ?? null);
        setWaitEstimateUpdatedAt(data.provider?.waitEstimateUpdatedAt ?? null);
        setSelectedInquiry((current) => {
          if (!current) return null;
          const fresh = data.inquiries.find((item) => item.id === current.id) ?? null;
          if (fresh) {
            markProviderInquirySeen(fresh.id, fresh.updatedAt, fresh.createdAt);
            bumpInquirySeen();
          }
          return fresh;
        });
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
          setInquiries(data.inquiries);
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
    initProviderInquirySeenFromData(
      inquiries.map((item) => ({ id: item.id, updatedAt: item.updatedAt, createdAt: item.createdAt }))
    );
    initProviderInquiryTabSeenFromData(inquiries);
  }, [inquiries]);

  useEffect(() => {
    setSelectedInquiry((current) => {
      if (!current) return null;
      const fresh = inquiries.find((item) => item.id === current.id) ?? null;
      if (fresh) {
        markProviderInquirySeen(fresh.id, fresh.updatedAt, fresh.createdAt);
        bumpInquirySeen();
      }
      return fresh;
    });
  }, [inquiries, bumpInquirySeen]);

  // Tab badge watermark: acknowledge whatever is on the active tab (including after refresh).
  // Card pulse stays until the inquiry is opened — do not mark items seen here.
  useEffect(() => {
    if (!profileComplete) return;
    setInquiryTabSeenAt(markProviderInquiryTabSeen(inquiryTab, inquiries));
  }, [inquiryTab, profileComplete, inquiries]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), TOAST_DISMISS_MS);
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
    }, TOAST_DISMISS_MS);
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
      // Profile PATCH does not re-fetch inquiries; keep the current queue.
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

  async function updateInquiry(id: string, status: string, reason?: string) {
    const actionKey = `${id}:${status}`;
    setPendingInquiryId(id);
    setPendingAction(actionKey);
    setInquiryFeedback((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

    try {
      const current = inquiries.find((item) => item.id === id) || selectedInquiry;
      let response: Response;

      if (status === "ACCEPTED" && current?.proposedStartsAt) {
        response = await fetch(`/api/matches/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "confirm" })
        });
      } else {
        response = await fetch(`/api/matches/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, ...(reason ? { declineReason: reason } : {}) })
        });
      }

      if (!response.ok) {
        const errorMessage = await readApiError(response, locale);
        setInquiryFeedback((current) => ({
          ...current,
          [id]: errorMessage || ui.provider.inquiryUpdateFailed
        }));
        return;
      }

      const updated = (await response.json()) as Inquiry;
      setInquiries((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)));
      setSelectedInquiry((current) => (current?.id === id ? { ...current, ...updated } : current));
      markProviderInquirySeen(id, updated.updatedAt, updated.createdAt);
      bumpInquirySeen();
      void refreshDashboard();
    } catch {
      setInquiryFeedback((current) => ({
        ...current,
        [id]: ui.provider.inquiryUpdateConnectionFailed
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
  const inquiryTabBadges = useMemo(
    () => ({
      new: inquiryTab === "new" ? 0 : countUnseenProviderInquiriesInTab(inquiries, "new", inquiryTabSeenAt.new),
      ongoing: inquiryTab === "ongoing" ? 0 : countUnseenProviderInquiriesInTab(inquiries, "ongoing", inquiryTabSeenAt.ongoing),
      closed: inquiryTab === "closed" ? 0 : countUnseenProviderInquiriesInTab(inquiries, "closed", inquiryTabSeenAt.closed),
      all: inquiryTab === "all" ? 0 : countUnseenProviderInquiriesInTab(inquiries, "all", inquiryTabSeenAt.all)
    }),
    [inquiries, inquiryTab, inquiryTabSeenAt]
  );
  const filteredInquiries = useMemo(() => {
    const tabbed = filterProviderInquiriesByTab(sortedInquiries, inquiryTab);
    return tabbed.filter(
      (inquiry) =>
        matchesReferenceQuery(inquiry.id, inquirySearch) ||
        matchesReferenceQuery(inquiry.intakeId, inquirySearch) ||
        matchesListSearch(
          inquirySearch,
          inquiry.intake.contactName,
          inquiry.intake.preferredArea,
          inquiry.intake.careTypes.join(", "),
          inquiry.intake.urgency
        )
    );
  }, [sortedInquiries, inquiryTab, inquirySearch]);

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

  const inquiryInsights = useMemo(() => buildProviderInquiryInsights(inquiries, locale), [inquiries, locale]);

  if (loading) {
    return <DashboardSkeleton title="provider dashboard" />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="section-label">{ui.provider.dashboardTitle}</p>
          <h1 className="mt-1 text-h2 font-semibold text-ink">{ui.provider.inquiries}</h1>
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
              [
                profileComplete ? String(inquiryInsights.actionNeeded) : ui.provider.locked,
                ui.provider.actionNeeded
              ],
              [profileComplete ? String(inquiryInsights.ongoing) : "—", ui.provider.insightsOngoing],
              [profileComplete ? String(inquiryInsights.closed) : "—", ui.provider.insightsClosed],
              [
                profileComplete
                  ? inquiryInsights.acceptanceRatePercent != null
                    ? ui.provider.insightsAcceptanceApprox(inquiryInsights.acceptanceRatePercent)
                    : "—"
                  : ui.provider.missingCount(profileMissingRequirements.length),
                profileComplete ? ui.provider.insightsAcceptanceRate : ui.provider.profileStatus
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

      {profileComplete && inquiryInsights.recent.length ? (
        <section className="mb-3 rounded-xl border border-stone-200 bg-white px-3 py-3 shadow-soft sm:px-4">
          <h2 className="text-sm font-semibold text-ink">{ui.provider.insightsRecentTitle}</h2>
          <ul className="mt-1.5 divide-y divide-stone-100">
            {inquiryInsights.recent.slice(0, 3).map((item) => {
              const match = inquiries.find((inquiry) => inquiry.id === item.id);
              return (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{item.familyName}</p>
                    <p className="mt-0.5 truncate text-xs text-ink/55">
                      {item.statusLabel}
                      {" · "}
                      {new Date(item.updatedAt).toLocaleString(dateLocale(locale), {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </p>
                  </div>
                  {match ? (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      className="bg-white"
                      onClick={() => openInquiry(match)}
                    >
                      {ui.provider.insightsOpenInquiry}
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

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

      <div className="mb-3 flex w-full gap-1 overflow-x-auto rounded-[10px] bg-white p-1 shadow-soft sm:inline-flex sm:w-auto">
        {providerInquiryTabs.map((item) => {
          const badge = inquiryTabBadges[item];
          const isActive = inquiryTab === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => setInquiryTab(item)}
              className={cn(
                "relative min-w-fit flex-1 rounded-lg px-3 py-2 text-sm transition sm:flex-none sm:px-4",
                isActive ? "bg-brand-amber text-white" : "text-ink/70 hover:bg-brand-cream hover:text-brand-amber"
              )}
            >
              <span className="inline-flex items-center gap-2">
                {providerInquiryTabLabel(item, locale)}
                {badge > 0 && !isActive ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-amber px-1.5 text-[10px] font-bold leading-none text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl bg-white shadow-soft">
        <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-ink sm:text-lg">{ui.provider.inquiryQueue}</h2>
            {profileComplete && inquiries.length ? (
              <span className="inline-flex max-w-full shrink-0 rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-ink/55">
                {ui.provider.inquiryCountInTab(
                  filteredInquiries.length,
                  providerInquiryTabLabel(inquiryTab, locale).toLowerCase()
                )}
              </span>
            ) : null}
          </div>
        </div>

        {profileComplete && inquiries.length ? (
          <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
            <ListSearch
              value={inquirySearch}
              onChange={setInquirySearch}
              placeholder={ui.provider.searchPlaceholder}
            />
          </div>
        ) : null}

        {!profileComplete ? (
          <div className="px-4 py-8 text-center sm:px-5">
            <p className="text-sm text-ink/60">{ui.provider.emptyProfileDescription}</p>
          </div>
        ) : !inquiries.length ? (
          <EmptyState
            title={ui.provider.noInquiries}
            description={ui.provider.noInquiriesHint}
          />
        ) : !filteredInquiries.length ? (
          <EmptyState
            title={ui.provider.noInquiriesInTab(providerInquiryTabLabel(inquiryTab, locale).toLowerCase())}
            description={ui.provider.tryAnotherTab}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-3 py-2.5 sm:px-4">{ui.provider.colFamily}</th>
                    <th className="hidden px-3 py-2.5 sm:table-cell sm:px-4">{ui.provider.colCareNeeded}</th>
                    <th className="hidden px-3 py-2.5 md:table-cell md:px-4">{ui.provider.colLocation}</th>
                    <th className="hidden px-3 py-2.5 lg:table-cell lg:px-4">{ui.provider.colUpdated}</th>
                    <th className="px-3 py-2.5 sm:px-4">{ui.provider.colStatus}</th>
                    <th className="px-3 py-2.5 sm:px-4">{ui.provider.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredInquiries.map((inquiry) => {
                    const isUnread =
                      selectedInquiry?.id !== inquiry.id &&
                      inquirySeenVersion >= 0 &&
                      isProviderInquiryUnread(inquiry.id, inquiry.updatedAt, inquiry.createdAt);
                    const isPending = pendingInquiryId === inquiry.id;
                    const careLabels = inquiry.intake.careTypes.map((item) => optionLabel(locale, item));
                    const careSummary =
                      careLabels.length === 0
                        ? "—"
                        : careLabels.length <= 2
                          ? careLabels.join(", ")
                          : `${careLabels.slice(0, 2).join(", ")} +${careLabels.length - 2}`;

                    return (
                      <tr
                        key={inquiry.id}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-cream",
                          isUnread ? "border-l-[3px] border-l-brand-amber bg-brand-amber/[0.07]" : "border-l-[3px] border-l-transparent"
                        )}
                        onClick={() => openInquiry(inquiry)}
                      >
                        <td className="max-w-[12rem] px-3 py-2.5 align-middle text-sm sm:max-w-[14rem] sm:px-4">
                          <div className="flex min-w-0 items-center gap-1.5">
                            {isUnread ? <UnreadDot /> : null}
                            <strong className="truncate text-ink">{inquiry.intake.contactName}</strong>
                          </div>
                          <span className="mt-0.5 block truncate text-xs text-neutral-500">
                            {inquiry.score}% · {optionLabel(locale, inquiry.intake.urgency)}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[10px] text-neutral-400">
                            {ui.provider.refLabel} {formatReference(inquiry.intakeId)}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-neutral-500 sm:hidden">
                            {inquiry.intake.preferredArea}
                          </span>
                        </td>
                        <td className="hidden max-w-[14rem] px-3 py-2.5 align-middle text-sm text-neutral-600 sm:table-cell sm:px-4">
                          <span className="line-clamp-1" title={careLabels.join(", ") || undefined}>
                            {careSummary}
                          </span>
                        </td>
                        <td className="hidden max-w-[8rem] truncate px-3 py-2.5 align-middle text-sm text-neutral-600 md:table-cell md:px-4">
                          {inquiry.intake.preferredArea}
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-2.5 align-middle text-sm text-neutral-600 lg:table-cell lg:px-4">
                          {new Date(inquiry.updatedAt).toLocaleString(dateLocale(locale), {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="px-3 py-2.5 align-middle sm:px-4">
                          <span
                            className={cn(
                              "inline-flex max-w-[7.5rem] truncate rounded-md px-2 py-0.5 text-[11px] font-semibold leading-none sm:max-w-none",
                              matchStatusBadgeClass(inquiry.status)
                            )}
                            title={providerInquiryStatusLabel(inquiry.status, locale)}
                          >
                            {providerInquiryStatusLabel(inquiry.status, locale)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 align-middle sm:px-4" onClick={(event) => event.stopPropagation()}>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="bg-white"
                            disabled={isPending}
                            onClick={() => openInquiry(inquiry)}
                          >
                            {ui.provider.open}
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <ProviderInquiryDetailPanel
        inquiry={selectedInquiry}
        pendingInquiryId={pendingInquiryId}
        pendingAction={pendingAction}
        inquiryFeedback={inquiryFeedback}
        onClose={() => setSelectedInquiry(null)}
        onAccept={(inquiry) => void updateInquiry(inquiry.id, "ACCEPTED")}
        onDecline={(inquiry) => setConfirmDecline({ id: inquiry.id })}
        onMatchPatched={(updated) => {
          setInquiries((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
          setSelectedInquiry((current) => (current?.id === updated.id ? { ...current, ...updated } : current));
        }}
        onScheduleRefresh={() => void refreshDashboard()}
      />

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
          void saveProfile((message, tone) => {
            if (message) panelNotify(message);
            if (message) {
              setMessageTone(tone ?? "success");
              setMessage(message);
            }
          })
        }
      />

      <ConfirmDialog
        open={Boolean(confirmDecline)}
        tone="danger"
        pending={Boolean(confirmDecline && pendingAction === `${confirmDecline.id}:DECLINED`)}
        title={ui.provider.declineTitle}
        description={ui.provider.declineDescription}
        confirmLabel={ui.provider.declineConfirm}
        onCancel={() => {
          setConfirmDecline(null);
          setDeclineReason(declineReasonOptions[0]);
        }}
        onConfirm={() => {
          if (!confirmDecline) return;
          void updateInquiry(confirmDecline.id, "DECLINED", declineReason);
          setConfirmDecline(null);
          setDeclineReason(declineReasonOptions[0]);
        }}
      >
        <label className="mt-4 grid gap-2 text-left text-sm font-medium text-ink">
          {ui.provider.declineReasonLabel}
          <CustomSelect value={declineReason} onChange={setDeclineReason} options={declineReasonOptions} formatOption={(value) => optionLabel(locale, value)} />
        </label>
      </ConfirmDialog>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--card-border)] px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-amber";

function ProviderInquiryDetailPanel({
  inquiry,
  pendingInquiryId,
  pendingAction,
  inquiryFeedback,
  onClose,
  onAccept,
  onDecline,
  onMatchPatched,
  onScheduleRefresh
}: {
  inquiry: Inquiry | null;
  pendingInquiryId: string | null;
  pendingAction: string | null;
  inquiryFeedback: Record<string, string>;
  onClose: () => void;
  onAccept: (inquiry: Inquiry) => void;
  onDecline: (inquiry: Inquiry) => void;
  onMatchPatched: (inquiry: Inquiry) => void;
  onScheduleRefresh: () => void;
}) {
  const { locale, ui } = useLocale();
  const [copiedField, setCopiedField] = useState<"phone" | "email" | null>(null);
  const isPending = inquiry ? pendingInquiryId === inquiry.id : false;
  const needsResponse = inquiry ? isProviderActionNeeded(inquiry.status) : false;
  const hasProposedSlot = Boolean(inquiry?.proposedStartsAt);
  const awaitingFamilyAlternate =
    inquiry?.schedulingStatus === "AWAITING_FAMILY" && Boolean(inquiry?.alternateStartsAt);
  const canConfirmProposed = needsResponse && hasProposedSlot && !awaitingFamilyAlternate;
  const banner = inquiry ? providerInquiryBanner(inquiry.status, locale) : null;
  const nextStep = inquiry ? providerNextStep(inquiry, locale) : null;
  const activityNotes = inquiry ? providerMatchNotes(inquiry.notes) : null;
  const cardFeedback = inquiry ? inquiryFeedback[inquiry.id] : undefined;
  const visitSummary = inquiry ? formatProviderVisit(inquiry, locale) : null;
  const showVisitInBanner = Boolean(nextStep?.visitLine);
  const p = ui.provider;
  const phone = inquiry?.intake.phone?.trim() || "";
  const email = inquiry?.intake.email?.trim() || "";
  const en = locale === "en";

  useEffect(() => {
    if (!copiedField) return;
    const timer = window.setTimeout(() => setCopiedField(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copiedField]);

  async function copyValue(field: "phone" | "email", value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
    } catch {
      // Clipboard may be unavailable; links still work.
    }
  }

  const details = inquiry
    ? [
        { label: p.detailFamilyContact, value: inquiry.intake.contactName },
        {
          label: p.detailPhone,
          value: phone ? (
            <a href={`tel:${phone.replace(/\s+/g, "")}`} className="font-medium text-brand-amber hover:text-brand-amber-mid">
              {phone}
            </a>
          ) : (
            "—"
          )
        },
        {
          label: p.detailEmail,
          value: email ? (
            <a href={`mailto:${email}`} className="font-medium text-brand-amber hover:text-brand-amber-mid">
              {email}
            </a>
          ) : (
            "—"
          )
        },
        { label: p.detailPreferredArea, value: inquiry.intake.preferredArea },
        { label: p.detailCareNeeded, value: inquiry.intake.careTypes.map((item) => optionLabel(locale, item)).join(", ") || "—" },
        { label: p.detailUrgency, value: optionLabel(locale, inquiry.intake.urgency) },
        { label: p.detailAgeRange, value: optionLabel(locale, inquiry.intake.ageRange) },
        { label: p.detailMatchScore, value: `${inquiry.score}%` },
        { label: p.detailStatus, value: providerInquiryStatusLabel(inquiry.status, locale) },
        ...(inquiry.status === "DECLINED" && inquiry.declineReason
          ? [{ label: p.detailDeclineReason, value: optionLabel(locale, inquiry.declineReason) }]
          : []),
        {
          label: p.detailReceived,
          value: new Date(inquiry.createdAt).toLocaleString(dateLocale(locale), { dateStyle: "medium", timeStyle: "short" })
        },
        {
          label: p.detailLastUpdated,
          value: new Date(inquiry.updatedAt).toLocaleString(dateLocale(locale), { dateStyle: "medium", timeStyle: "short" })
        },
        ...(visitSummary && !showVisitInBanner ? [{ label: p.detailVisitOrPhone, value: visitSummary }] : []),
        // Proposed time is shown in the scheduling section when action is needed.
        ...(inquiry.proposedStartsAt && !needsResponse
          ? [
              {
                label: "Family proposed time",
                value: new Date(inquiry.proposedStartsAt).toLocaleString(dateLocale(locale), {
                  dateStyle: "full",
                  timeStyle: "short"
                })
              }
            ]
          : []),
        ...(activityNotes ? [{ label: p.detailActivity, value: <span className="whitespace-pre-line">{activityNotes}</span> }] : [])
      ]
    : [];

  return (
    <SlidePanel
      open={Boolean(inquiry)}
      onClose={onClose}
      size="wide"
      title={inquiry?.intake.contactName || p.inquiryTitleFallback}
      subtitle={
        inquiry
          ? `${providerInquiryStatusLabel(inquiry.status, locale)} · ${inquiry.score}% match · ${inquiry.intake.preferredArea}`
          : p.inquiryDetailsSubtitle
      }
      footer={
        inquiry && needsResponse ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
            {awaitingFamilyAlternate ? (
              <p className="w-full text-sm leading-6 text-ink/65">
                {en
                  ? "Waiting for the family to accept your alternate time. You can still decline this inquiry."
                  : "Wachten tot de familie uw alternatieve tijdstip accepteert. U kunt dit verzoek nog afwijzen."}
              </p>
            ) : (
              <Button type="button" className="w-full sm:w-auto" disabled={isPending} onClick={() => onAccept(inquiry)}>
                {pendingAction === `${inquiry.id}:ACCEPTED`
                  ? p.accepting
                  : canConfirmProposed
                    ? en
                      ? "Confirm this time"
                      : "Dit tijdstip bevestigen"
                    : providerAcceptButtonLabel(inquiry.status, locale)}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white sm:w-auto"
              disabled={isPending}
              onClick={() => onDecline(inquiry)}
            >
              {pendingAction === `${inquiry.id}:DECLINED` ? p.declining : ui.provider.decline}
            </Button>
          </div>
        ) : inquiry ? (
          <p className="text-sm text-ink/65">
            {nextStep?.visitLine
              ? nextStep.visitLine
              : inquiry.status === "ACCEPTED"
                ? p.footerAccepted
                : inquiry.status === "CONTACTED"
                  ? p.footerContacted
                  : inquiry.status === "PLACED"
                    ? p.footerPlaced
                    : inquiry.status === "DECLINED"
                      ? p.footerDeclined
                      : inquiry.status === "CLOSED"
                        ? p.footerClosed
                        : p.footerNoAction}
          </p>
        ) : null
      }
    >
      {inquiry ? (
        <div className="grid gap-6">
          {banner ? <StatusPill className={matchStatusBadgeClass(inquiry.status)}>{banner}</StatusPill> : null}

          {nextStep ? (
            <PanelSection title={ui.provider.whatNext}>
              <div
                className={cn(
                  "rounded-xl px-4 py-4",
                  nextStep.tone === "visit"
                    ? "border border-brand-amber/35 bg-brand-amber/10"
                    : "border border-brand-green-pale/70 bg-brand-green-pale/15"
                )}
              >
                <p className={cn("text-sm font-semibold", nextStep.tone === "visit" ? "text-brand-amber-dark" : "text-brand-green-dark")}>
                  {nextStep.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink/70">{nextStep.description}</p>
                {nextStep.visitLine ? (
                  <p className="mt-3 rounded-lg bg-white/80 px-3 py-2.5 text-sm font-medium leading-6 text-ink">{nextStep.visitLine}</p>
                ) : null}
              </div>
            </PanelSection>
          ) : null}

          {(phone || email) ? (
            <PanelSection title={p.contactFamilyTitle}>
              <div className="flex flex-wrap gap-2">
                {phone ? (
                  <>
                    <Button asChild size="sm">
                      <a href={`tel:${phone.replace(/\s+/g, "")}`}>
                        <Phone className="h-4 w-4" aria-hidden />
                        {p.contactCall}
                      </a>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-white"
                      onClick={() => void copyValue("phone", phone)}
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                      {copiedField === "phone" ? p.contactCopied : p.contactCopyPhone}
                    </Button>
                  </>
                ) : null}
                {email ? (
                  <>
                    <Button asChild size="sm" variant="outline" className="bg-white">
                      <a href={`mailto:${email}`}>
                        <Mail className="h-4 w-4" aria-hidden />
                        {p.contactEmail}
                      </a>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-white"
                      onClick={() => void copyValue("email", email)}
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                      {copiedField === "email" ? p.contactCopied : p.contactCopyEmail}
                    </Button>
                  </>
                ) : null}
              </div>
            </PanelSection>
          ) : null}

          <PanelSection title={ui.provider.familyDetails}>
            <DetailList items={details} columns={2} />
          </PanelSection>

          {needsResponse && inquiry.proposedStartsAt ? (
            <PanelSection
              title={
                awaitingFamilyAlternate
                  ? en
                    ? "Alternate time sent"
                    : "Alternatief verzonden"
                  : en
                    ? "Proposed visit time"
                    : "Voorgesteld bezoektijdstip"
              }
              description={
                awaitingFamilyAlternate
                  ? en
                    ? "The family can accept this time from their dashboard."
                    : "De familie kan dit tijdstip accepteren in hun dashboard."
                  : en
                    ? "Confirm below, or suggest one alternate."
                    : "Bevestig hieronder, of stel één alternatief voor."
              }
            >
              <ProviderScheduleActions
                inquiry={inquiry}
                locale={locale}
                disabled={isPending}
                onMatchPatched={onMatchPatched}
                onRefresh={onScheduleRefresh}
              />
            </PanelSection>
          ) : null}

          {cardFeedback ? (
            <p
              className={cn(
                "rounded-xl px-4 py-3 text-sm leading-6",
                p.feedbackErrorPrefixes.some((prefix) => cardFeedback.startsWith(prefix))
                  ? "border border-red-200 bg-red-50 text-red-800"
                  : "border border-brand-green-pale bg-brand-green-pale/20 text-brand-green-dark"
              )}
              role="status"
            >
              {cardFeedback}
            </p>
          ) : null}
        </div>
      ) : null}
    </SlidePanel>
  );
}

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
          onSave((message, tone) => {
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

        <ProviderCalendarSettings onNotify={setPanelMessage} />


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

function ProviderScheduleActions({
  inquiry,
  locale,
  disabled,
  onMatchPatched,
  onRefresh
}: {
  inquiry: Inquiry;
  locale: "en" | "nl";
  disabled?: boolean;
  onMatchPatched: (inquiry: Inquiry) => void;
  onRefresh: () => void;
}) {
  const en = locale === "en";
  const [showAlternate, setShowAlternate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const awaitingFamily =
    inquiry.schedulingStatus === "AWAITING_FAMILY" && Boolean(inquiry.alternateStartsAt);

  async function suggestAlternate(slot: { start: string; end: string }) {
    setBusy(true);
    setMessage("");
    const result = await postMatchSchedule(inquiry.id, {
      action: "alternate",
      startsAt: slot.start,
      endsAt: slot.end
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    if (result.match) {
      onMatchPatched({ ...inquiry, ...(result.match as Partial<Inquiry>) });
    }
    setShowAlternate(false);
    onRefresh();
  }

  const formatCompact = (iso: string) =>
    new Date(iso).toLocaleString(en ? "en-GB" : "nl-NL", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });

  return (
    <div className="grid min-w-0 gap-3">
      {inquiry.proposedStartsAt ? (
        <div className="min-w-0 rounded-lg bg-brand-cream/70 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/55">
            {en ? "Family asked for" : "Familie vroeg om"}
          </p>
          <p className="mt-1 break-words text-sm font-semibold leading-6 text-ink">
            {formatCompact(inquiry.proposedStartsAt)}
          </p>
        </div>
      ) : null}

      {awaitingFamily && inquiry.alternateStartsAt ? (
        <div className="min-w-0 rounded-lg bg-brand-amber/10 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/55">
            {en ? "Your alternate offer" : "Uw alternatief"}
          </p>
          <p className="mt-1 break-words text-sm font-semibold leading-6 text-ink">
            {formatCompact(inquiry.alternateStartsAt)}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink/60">
            {en
              ? "Waiting for the family to accept or the Care Guide to help."
              : "Wachten op acceptatie door de familie of hulp van de Care Guide."}
          </p>
        </div>
      ) : null}

      {!showAlternate ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full bg-white"
          disabled={disabled || busy}
          onClick={() => setShowAlternate(true)}
        >
          {awaitingFamily
            ? en
              ? "Change alternate time"
              : "Alternatief wijzigen"
            : en
              ? "Suggest another time"
              : "Ander tijdstip voorstellen"}
        </Button>
      ) : (
        <div className="grid min-w-0 gap-3">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-ink">
              {en ? "Offer an alternate time" : "Stel een alternatief voor"}
            </p>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className="shrink-0"
              disabled={disabled || busy}
              onClick={() => {
                setShowAlternate(false);
                setMessage("");
              }}
            >
              {en ? "Cancel" : "Annuleren"}
            </Button>
          </div>
          <VisitSlotPicker
            matchId={inquiry.id}
            kind={inquiry.status === "CALLBACK_REQUESTED" ? "CALLBACK" : "VISIT"}
            locale={locale}
            disabled={disabled || busy}
            excludeStartIso={inquiry.proposedStartsAt}
            helperText={en ? "Pick a different open slot for the family" : "Kies een ander vrij tijdstip voor de familie"}
            submitLabel={en ? "Send this alternate time" : "Dit alternatief versturen"}
            onSelect={(slot) => void suggestAlternate(slot)}
          />
        </div>
      )}
      {message ? <p className="break-words text-sm text-red-700">{message}</p> : null}
    </div>
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
