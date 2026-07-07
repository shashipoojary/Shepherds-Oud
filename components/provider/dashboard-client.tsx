"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Chip } from "@/components/ui/chip";
import { CustomSelect } from "@/components/ui/custom-select";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSearch } from "@/components/ui/list-search";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatGrid } from "@/components/ui/stat-grid";
import { UnreadDot } from "@/components/ui/unread-dot";
import { PanelSection, DetailList, panelNoticeTone, SlidePanel, StatusPill, usePanelMessage } from "@/components/ui/slide-panel";
import { careTypeOptions, declineReasonOptions, careLevelOptions, dementiaCapacityOptions, dutchProvinces, facilityTypes, fundingTypeOptions, visitAvailabilityOptions } from "@/lib/config/content";
import {
  compareMatchPriority,
  filterProviderInquiriesByTab,
  isProviderActionNeeded,
  matchStatusBadgeClass,
  providerAcceptButtonLabel,
  providerInquiryActionMessage,
  providerInquiryBanner,
  providerInquiryStatusLabel,
  providerInquiryTabLabel,
  providerMatchNotes,
  type ProviderInquiryTab
} from "@/lib/domain/match-status";
import { sanitizeClientErrorMessage } from "@/lib/providers/errors";
import { recordAction } from "@/lib/client/actions";
import {
  initProviderInquirySeenFromData,
  isProviderInquiryUnread,
  markAllProviderInquiriesSeen,
  markProviderInquirySeen
} from "@/lib/client/provider-inquiry-seen";
import {
  countUnseenProviderInquiriesInTab,
  getProviderInquiryTabSeenAt,
  initProviderInquiryTabSeenFromData,
  markProviderInquiryTabSeen
} from "@/lib/client/provider-inquiry-tab-seen";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import { brand } from "@/lib/config/brand";
import { cn } from "@/lib/core/utils";
import { formatReference, matchesListSearch, matchesReferenceQuery } from "@/lib/domain/reference";
import { PROVIDER_AVAILABILITY_OPTIONS } from "@/lib/domain/provider-availability";

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
  intakeId: string;
  score: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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

const availabilityOptions = [...PROVIDER_AVAILABILITY_OPTIONS];

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

function formatProviderVisit(inquiry: Inquiry) {
  if (!inquiry.intake.visitScheduledAt) return null;
  const date = new Date(inquiry.intake.visitScheduledAt);
  if (Number.isNaN(date.getTime())) return null;
  const when = date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const providerName = inquiry.intake.visitProviderName ? ` with ${inquiry.intake.visitProviderName}` : "";
  return `${inquiry.intake.visitType || "Visit or callback"}${providerName} — ${when}`;
}

function providerNextStep(inquiry: Inquiry) {
  const visit = formatProviderVisit(inquiry);

  switch (inquiry.status) {
    case "ACCEPTED":
      if (visit) {
        return {
          title: "Visit or call scheduled",
          description: "Your Care Guide has arranged the next step with this family.",
          visitLine: visit,
          tone: "visit" as const
        };
      }
      return {
        title: "Accepted — waiting for Care Guide",
        description: "No extra action is needed right now. The Care Guide will arrange the visit or callback and update you here."
      };
    case "CONTACTED":
      return {
        title: "Visit or call arranged",
        description: visit ? "Confirmed with the family. Use the details below if you need to prepare." : "The Care Guide has coordinated the next step. Watch for timing details here or by email.",
        visitLine: visit || undefined,
        tone: visit ? ("visit" as const) : undefined
      };
    case "PLACED":
      return {
        title: "Family chose your facility",
        description: "The family is moving forward with your facility. The Care Guide will coordinate final details."
      };
    case "DECLINED":
      return {
        title: "Previously declined",
        description:
          "You declined this inquiry earlier. If your Care Guide re-opens it after case updates, it will appear under New with accept/decline actions again."
      };
    case "CLOSED":
      return {
        title: "Inquiry closed",
        description: "No further action is needed for this family."
      };
    default:
      return null;
  }
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
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState<{ id: string; familyName: string } | null>(null);
  const [declineReason, setDeclineReason] = useState(declineReasonOptions[0]);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [inquiryTab, setInquiryTab] = useState<ProviderInquiryTab>("new");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiryTabSeenAt, setInquiryTabSeenAt] = useState(getProviderInquiryTabSeenAt);
  const [inquirySeenVersion, setInquirySeenVersion] = useState(0);
  const [inquirySearch, setInquirySearch] = useState("");

  const providerInquiryTabs: ProviderInquiryTab[] = ["new", "ongoing", "closed", "all"];
  const inquiriesRef = useRef(inquiries);
  inquiriesRef.current = inquiries;

  const bumpInquirySeen = useCallback(() => {
    setInquirySeenVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    setInquiryTabSeenAt(getProviderInquiryTabSeenAt());
  }, []);

  function openInquiry(inquiry: Inquiry) {
    markProviderInquirySeen(inquiry.id, inquiry.updatedAt);
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
        setSelectedInquiry((current) => {
          if (!current) return null;
          const fresh = data.inquiries.find((item) => item.id === current.id) ?? null;
          if (fresh) {
            markProviderInquirySeen(fresh.id, fresh.updatedAt);
            bumpInquirySeen();
          }
          return fresh;
        });
        setMessageTone("success");
        setMessage("Your dashboard is up to date.");
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
          setProfileComplete(data.profileComplete);
          setProfileMissingRequirements(data.profileMissingRequirements);
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
    initProviderInquirySeenFromData(inquiries.map((item) => ({ id: item.id, updatedAt: item.updatedAt })));
    initProviderInquiryTabSeenFromData(inquiries);
  }, [inquiries]);

  useEffect(() => {
    setSelectedInquiry((current) => {
      if (!current) return null;
      const fresh = inquiries.find((item) => item.id === current.id) ?? null;
      if (fresh) {
        markProviderInquirySeen(fresh.id, fresh.updatedAt);
        bumpInquirySeen();
      }
      return fresh;
    });
  }, [inquiries, bumpInquirySeen]);

  useEffect(() => {
    if (!profileComplete) return;
    const tabInquiries = filterProviderInquiriesByTab(inquiriesRef.current, inquiryTab);
    markAllProviderInquiriesSeen(tabInquiries.map((item) => ({ id: item.id, updatedAt: item.updatedAt })));
    bumpInquirySeen();
    setInquiryTabSeenAt(markProviderInquiryTabSeen(inquiryTab, inquiriesRef.current));
  }, [inquiryTab, profileComplete, bumpInquirySeen]);

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
      notify("Facility name must be at least 2 characters.", "error");
      return;
    }

    setSaving(true);
    setMessage("");

    const bedsTotal = parseRequiredIntField(form.bedsTotal);
    if (bedsTotal === "invalid") {
      notify("Total beds must be a whole number (0 or more).", "error");
      setSaving(false);
      return;
    }

    const bedsOpen = parseRequiredIntField(form.bedsOpen);
    if (bedsOpen === "invalid") {
      notify("Available beds must be a whole number (0 or more).", "error");
      setSaving(false);
      return;
    }

    const responseTimeHours = parseOptionalInt(form.responseTimeHours);
    if (form.responseTimeHours.trim() && responseTimeHours === undefined) {
      notify("Response time must be a whole number of hours.", "error");
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
        notify(await readApiError(response), "error");
        return;
      }

      const data = (await response.json()) as DashboardData;
      const provider = data.provider;
      if (!provider) {
        notify("Could not read the saved provider profile.", "error");
        return;
      }
      setForm(toForm(provider));
      setProviderId(provider.id);
      setProfileComplete(data.profileComplete);
      setProfileMissingRequirements(data.profileMissingRequirements);
      setInquiries(data.inquiries ?? []);
      notify(
        data.profileComplete
          ? "You saved your facility profile. You can now receive care requests."
          : "You saved your facility profile. Complete the remaining items to receive care requests."
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
      notify("Could not save your facility profile. Please check your connection and try again.", "error");
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
      setSelectedInquiry((current) => (current?.id === id ? { ...current, ...updated } : current));
      markProviderInquirySeen(id, updated.updatedAt);
      bumpInquirySeen();
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
  const actionNeededCount = inquiries.filter((item) => isProviderActionNeeded(item.status)).length;
  const newInquiries = actionNeededCount;
  const bedsDisplay = form.bedsOpen.trim() === "" ? "—" : form.bedsOpen;

  if (loading) {
    return <DashboardSkeleton title="provider dashboard" />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="section-label">Provider dashboard</p>
          <h1 className="mt-1 text-h2 font-semibold text-ink">Family inquiries</h1>
          <p className="mt-2 max-w-2xl text-body text-ink/70">
            Review matched families, accept or decline requests, and track updates from your Care Guide.
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
            <span className="truncate">Facility profile</span>
            {!profileComplete ? (
              <span
                className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-amber px-1.5 text-[11px] font-bold leading-none tabular-nums text-white"
                aria-label={`${profileMissingRequirements.length} profile item${profileMissingRequirements.length === 1 ? "" : "s"} still needed`}
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
          className={`mb-5 rounded-lg px-4 py-3 text-sm ${
            messageTone === "success" ? "bg-brand-green-pale/30 text-brand-green-dark" : "bg-brand-beige-light/50 text-brand-amber-dark"
          }`}
          role="status"
        >
          {message}
        </div>
      ) : null}

      <StatGrid
        className="mb-5"
        stats={[
          [bedsDisplay, "Available beds"],
          [profileComplete ? String(newInquiries) : "Locked", "Action needed"],
          [form.availabilityStatus, "Availability"],
          [profileComplete ? "Complete" : `${profileMissingRequirements.length} missing`, "Profile status"]
        ]}
      />

      {!profileComplete ? (
        <section className="mb-5 rounded-xl border border-brand-amber/25 bg-brand-amber/10 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-ink">Complete your facility profile to unlock inquiries</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/70">
                Care requests stay locked until your profile and availability are ready for families and Care Guides to review.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {profileMissingRequirements.map((item) => (
                  <li key={item} className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-ink/75">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Button type="button" size="sm" className="w-full shrink-0 sm:w-auto" onClick={() => setProfilePanelOpen(true)}>
              Open facility profile
            </Button>
          </div>
        </section>
      ) : null}

      <div className="mb-5 flex w-full gap-1 overflow-x-auto rounded-[10px] bg-white p-1 shadow-soft sm:inline-flex sm:w-auto">
        {providerInquiryTabs.map((item) => {
          const badge = inquiryTabBadges[item];
          const isActive = inquiryTab === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => setInquiryTab(item)}
              className={cn(
                "relative min-w-fit flex-1 rounded-lg px-4 py-2 text-sm transition sm:flex-none",
                isActive ? "bg-brand-amber text-white" : "text-ink/70 hover:bg-brand-cream hover:text-brand-amber"
              )}
            >
              <span className="inline-flex items-center gap-2">
                {providerInquiryTabLabel(item)}
                {badge > 0 && !isActive ? <UnreadDot /> : null}
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
        <div className="border-b border-stone-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">Inquiry queue</h2>
              </div>
              <p className="mt-1 text-sm text-ink/60">
                Open an inquiry to review details, accept or decline requests, and track updates from your Care Guide.
              </p>
            </div>
            {inquiries.length ? (
              <span className="shrink-0 rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-ink/55">
                {filteredInquiries.length} in {providerInquiryTabLabel(inquiryTab).toLowerCase()}
              </span>
            ) : null}
          </div>
        </div>

        {profileComplete && inquiries.length ? (
          <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
            <ListSearch
              value={inquirySearch}
              onChange={setInquirySearch}
              placeholder="Search inquiries by family name, area, or reference…"
            />
          </div>
        ) : null}

        {!profileComplete ? (
          <div className="flex flex-col items-center justify-center gap-4 p-8">
            <EmptyState
              title="Complete your profile to receive care requests"
              description="Open your facility profile to add contact details, services, care levels, and availability."
            />
            <Button type="button" size="sm" onClick={() => setProfilePanelOpen(true)}>
              Open facility profile
            </Button>
          </div>
        ) : !inquiries.length ? (
          <EmptyState
            title="No inquiries yet"
            description="When Shepherds Oud matches a family to your facility, the inquiry will appear here for you to review."
          />
        ) : !filteredInquiries.length ? (
          <EmptyState
            title={`No ${providerInquiryTabLabel(inquiryTab).toLowerCase()} inquiries`}
            description="Try another tab to see inquiries in a different stage."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Family</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Care needed</th>
                    <th className="hidden px-4 py-3 md:table-cell">Location</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Updated</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredInquiries.map((inquiry) => {
                    const isUnread =
                      selectedInquiry?.id !== inquiry.id &&
                      inquirySeenVersion >= 0 &&
                      isProviderInquiryUnread(inquiry.id, inquiry.updatedAt);
                    const isPending = pendingInquiryId === inquiry.id;

                    return (
                      <tr
                        key={inquiry.id}
                        className={cn("cursor-pointer hover:bg-cream", isUnread ? "bg-brand-green-pale/[0.08]" : undefined)}
                        onClick={() => openInquiry(inquiry)}
                      >
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            {isUnread ? <UnreadDot /> : null}
                            <strong className="text-ink">{inquiry.intake.contactName}</strong>
                          </div>
                          <span className="mt-1 block text-xs text-neutral-500">
                            {inquiry.score}% match · {inquiry.intake.urgency}
                          </span>
                          <span className="mt-1 block font-mono text-[11px] text-neutral-400">
                            Ref {formatReference(inquiry.intakeId)}
                          </span>
                          <span className="mt-1 block text-xs text-neutral-500 sm:hidden">{inquiry.intake.preferredArea}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-sm text-neutral-600 sm:table-cell">
                          {inquiry.intake.careTypes.join(", ") || "—"}
                        </td>
                        <td className="hidden px-4 py-3 text-sm text-neutral-600 md:table-cell">{inquiry.intake.preferredArea}</td>
                        <td className="hidden px-4 py-3 text-sm text-neutral-600 lg:table-cell">
                          {new Date(inquiry.updatedAt).toLocaleString("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-snug", matchStatusBadgeClass(inquiry.status))}>
                            {providerInquiryStatusLabel(inquiry.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            className="bg-white"
                            disabled={isPending}
                            onClick={() => openInquiry(inquiry)}
                          >
                            Open
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
        onAccept={(inquiry) => void updateInquiry(inquiry.id, "ACCEPTED", inquiry.intake.contactName, inquiry.status)}
        onDecline={(inquiry) => setConfirmDecline({ id: inquiry.id, familyName: inquiry.intake.contactName })}
      />

      <section className="mt-5 rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-soft sm:px-5 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Need help from Shepherds Oud?</p>
            <p className="mt-1 text-sm text-ink/65">Platform or profile questions — not family-specific coordination.</p>
          </div>
          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
            <a href={`mailto:${brand.email}`}>Email support</a>
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

function ProviderInquiryDetailPanel({
  inquiry,
  pendingInquiryId,
  pendingAction,
  inquiryFeedback,
  onClose,
  onAccept,
  onDecline
}: {
  inquiry: Inquiry | null;
  pendingInquiryId: string | null;
  pendingAction: string | null;
  inquiryFeedback: Record<string, string>;
  onClose: () => void;
  onAccept: (inquiry: Inquiry) => void;
  onDecline: (inquiry: Inquiry) => void;
}) {
  const isPending = inquiry ? pendingInquiryId === inquiry.id : false;
  const needsResponse = inquiry ? isProviderActionNeeded(inquiry.status) : false;
  const banner = inquiry ? providerInquiryBanner(inquiry.status) : null;
  const nextStep = inquiry ? providerNextStep(inquiry) : null;
  const activityNotes = inquiry ? providerMatchNotes(inquiry.notes) : null;
  const cardFeedback = inquiry ? inquiryFeedback[inquiry.id] : undefined;
  const visitSummary = inquiry ? formatProviderVisit(inquiry) : null;
  const showVisitInBanner = Boolean(nextStep?.visitLine);

  const details = inquiry
    ? [
        { label: "Family contact", value: inquiry.intake.contactName },
        { label: "Phone", value: inquiry.intake.phone },
        { label: "Email", value: inquiry.intake.email },
        { label: "Preferred area", value: inquiry.intake.preferredArea },
        { label: "Care needed", value: inquiry.intake.careTypes.join(", ") || "—" },
        { label: "Urgency", value: inquiry.intake.urgency },
        { label: "Age range", value: inquiry.intake.ageRange },
        { label: "Match score", value: `${inquiry.score}%` },
        { label: "Status", value: providerInquiryStatusLabel(inquiry.status) },
        {
          label: "Received",
          value: new Date(inquiry.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
        },
        {
          label: "Last updated",
          value: new Date(inquiry.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
        },
        ...(visitSummary && !showVisitInBanner ? [{ label: "Visit or call", value: visitSummary }] : []),
        ...(activityNotes ? [{ label: "Activity", value: <span className="whitespace-pre-line">{activityNotes}</span> }] : [])
      ]
    : [];

  return (
    <SlidePanel
      open={Boolean(inquiry)}
      onClose={onClose}
      size="wide"
      title={inquiry?.intake.contactName || "Family inquiry"}
      subtitle={
        inquiry
          ? `${providerInquiryStatusLabel(inquiry.status)} · ${inquiry.score}% match · ${inquiry.intake.preferredArea}`
          : "Inquiry details"
      }
      footer={
        inquiry && needsResponse ? (
          <div className="flex w-full flex-wrap gap-2">
            <Button type="button" disabled={isPending} onClick={() => onAccept(inquiry)}>
              {pendingAction === `${inquiry.id}:ACCEPTED` ? "Accepting..." : providerAcceptButtonLabel(inquiry.status)}
            </Button>
            <Button type="button" variant="outline" className="bg-white" disabled={isPending} onClick={() => onDecline(inquiry)}>
              {pendingAction === `${inquiry.id}:DECLINED` ? "Declining..." : "Decline"}
            </Button>
          </div>
        ) : inquiry ? (
          <p className="text-sm text-ink/65">
            {nextStep?.visitLine
              ? nextStep.visitLine
              : inquiry.status === "ACCEPTED"
                ? "Accepted — your Care Guide will coordinate next steps."
                : inquiry.status === "CONTACTED"
                  ? "Visit or call coordinated — watch for timing details here or by email."
                  : inquiry.status === "PLACED"
                    ? "Placement in progress for this family."
                    : inquiry.status === "DECLINED"
                      ? "You declined this inquiry."
                      : inquiry.status === "CLOSED"
                        ? "This inquiry is closed."
                        : "No action needed right now."}
          </p>
        ) : null
      }
    >
      {inquiry ? (
        <div className="grid gap-6">
          {banner ? <StatusPill className={matchStatusBadgeClass(inquiry.status)}>{banner}</StatusPill> : null}

          {nextStep ? (
            <PanelSection title="What happens next">
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

          <PanelSection title="Family details">
            <DetailList items={details} columns={2} />
          </PanelSection>

          {cardFeedback ? (
            <p
              className={cn(
                "rounded-xl px-4 py-3 text-sm leading-6",
                cardFeedback.startsWith("Could not")
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
  profileComplete: boolean;
  profileMissingRequirements: string[];
  onSave: (notify: (message: string, tone?: "success" | "error") => void) => void;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();

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
      title="Facility profile & availability"
      subtitle={
        profileComplete
          ? "Update how your facility appears to families and Care Guides."
          : `${profileMissingRequirements.length} item${profileMissingRequirements.length === 1 ? "" : "s"} still needed before inquiries unlock.`
      }
      notice={panelMessage}
      noticeTone={panelNoticeTone(panelMessage)}
      footer={
        <Button type="submit" form="provider-facility-profile-form" disabled={saving} className="w-full sm:w-auto sm:min-w-[200px]">
          {saving ? "Saving..." : providerId ? "Save facility profile" : "Create facility profile"}
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
        <PanelSection step={1} title="Availability" description="Keep beds and status current so families see accurate capacity.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Available beds">
              <input
                type="number"
                min="0"
                value={form.bedsOpen}
                placeholder="Not set"
                onChange={(event) => updateForm("bedsOpen", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Availability status">
              <CustomSelect value={form.availabilityStatus} onChange={(value) => updateForm("availabilityStatus", value)} options={availabilityOptions} />
            </Field>
            <Field label="Total beds or places">
              <input type="number" min="0" value={form.bedsTotal} onChange={(e) => updateForm("bedsTotal", e.target.value)} className={inputClass} placeholder="Optional" />
            </Field>
          </div>
        </PanelSection>

        <PanelSection step={2} title="Facility details" description="Core information families and Care Guides use to assess fit.">
          <div className="grid gap-4 sm:grid-cols-2">
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
            <Field label="City">
              <input value={form.city} onChange={(e) => updateForm("city", e.target.value)} className={inputClass} placeholder="e.g. Utrecht" />
            </Field>
            <Field label="Province">
              <CustomSelect value={form.province} onChange={(value) => updateForm("province", value)} options={dutchProvinces} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Facility description">
              <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} className={`${inputClass} min-h-24`} placeholder="Describe your care approach, environment, and specialties." />
            </Field>
          </div>
        </PanelSection>

        <PanelSection step={3} title="Care profile" description="Services, languages, and care levels you offer.">
          <div className="space-y-4">
            <ChipField label="Services offered" options={careTypeOptions} selected={form.services} onToggle={(value) => toggleList("services", value)} />
            <ChipField label="Care levels" options={careLevelOptions} selected={form.careLevels} onToggle={(value) => toggleList("careLevels", value)} />
            <ChipField label="Languages spoken" options={["Dutch", "English", "Arabic", "Turkish", "German", "French"]} selected={form.languages} onToggle={(value) => toggleList("languages", value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dementia capacity">
                <CustomSelect value={form.dementiaCapacity} onChange={(value) => updateForm("dementiaCapacity", value)} options={dementiaCapacityOptions} />
              </Field>
              <Field label="Visit availability">
                <CustomSelect value={form.visitAvailability} onChange={(value) => updateForm("visitAvailability", value)} options={visitAvailabilityOptions} />
              </Field>
            </div>
          </div>
        </PanelSection>

        <PanelSection step={4} title="Pricing & response" description="Optional details that help families compare options.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Typical response time (hours)">
              <input type="number" min="1" max="168" value={form.responseTimeHours} onChange={(e) => updateForm("responseTimeHours", e.target.value)} className={inputClass} placeholder="e.g. 24" />
            </Field>
            <Field label="Monthly price min (EUR)">
              <input type="number" min="0" value={form.priceMin} onChange={(e) => updateForm("priceMin", e.target.value)} className={inputClass} placeholder="Optional" />
            </Field>
            <Field label="Monthly price max (EUR)">
              <input type="number" min="0" value={form.priceMax} onChange={(e) => updateForm("priceMax", e.target.value)} className={inputClass} placeholder="Optional" />
            </Field>
          </div>
          <div className="mt-4">
            <ChipField label="Funding types accepted" options={fundingTypeOptions} selected={form.fundingTypes} onToggle={(value) => toggleList("fundingTypes", value)} />
          </div>
        </PanelSection>

        {!profileComplete && profileMissingRequirements.length ? (
          <div className="rounded-xl border border-brand-amber/25 bg-brand-amber/10 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Still needed for inquiries</p>
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
