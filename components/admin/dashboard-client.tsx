"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  Mail,
  X
} from "lucide-react";
import { AdminResetDataButton } from "@/components/admin/reset-data-button";
import { ComposeAnnouncementBar } from "@/components/admin/compose-announcement";
import { FamilyDetailPanel } from "@/components/admin/family-detail-panel";
import { HospitalInvitePanel } from "@/components/admin/hospital-invite-panel";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { ListSearch } from "@/components/ui/list-search";
import { RefreshButton } from "@/components/ui/refresh-button";
import { UnreadDot } from "@/components/ui/unread-dot";
import { DetailList, PanelSection, PanelTopic, panelNoticeTone, SlidePanel, StatusPill, TagList, usePanelMessage } from "@/components/ui/slide-panel";
import { StatGrid } from "@/components/ui/stat-grid";
import type { AdminDashboardData } from "@/lib/data/admin";
import { recordAction } from "@/lib/client/actions";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import { cn } from "@/lib/core/utils";
import {
  countUnseenFamilies,
  countUnseenInquiries,
  countUnseenProviders,
  countUnseenWaitlist,
  getTabSeenAt,
  initTabSeenFromData,
  markTabSeen
} from "@/lib/client/admin-seen";
import {
  initAdminInquirySeenFromData,
  isAdminInquiryUnread,
  markAdminInquirySeen
} from "@/lib/client/admin-inquiry-seen";
import { initAdminItemsSeenFromData, isAdminItemUnread, markAdminItemSeen } from "@/lib/client/admin-item-seen";
import { getAdminCaseNextAction } from "@/lib/domain/admin-case-next-action";
import {
  adminIntakeActionMeta,
  adminIntakeStatusLabel,
  normalizeIntakeStatus,
  type IntakeStatus
} from "@/lib/domain/intake-workflow";
import {
  adminInquiryActionMeta,
  adminInquiryHint,
  canAdminCloseProviderMatch,
  adminMatchNotes,
  adminMatchStatusLabel,
  compareMatchPriority,
  isAdminActionNeeded,
  matchStatusBadgeClass
} from "@/lib/domain/match-status";
import { INTAKE_STALE_CONFLICT_MESSAGE, isIntakeStaleConflictError } from "@/lib/domain/intake-stale-conflict";
import { displayProviderAvailability, formatAvailabilityLastUpdated } from "@/lib/domain/provider-availability";
import {
  PROVIDER_VERIFICATION_STATUSES,
  isProviderMatchable,
  providerVerificationBadgeVariant,
  providerVerificationLabel
} from "@/lib/domain/provider-verification";
import { formatReference, matchesListSearch, matchesReferenceQuery } from "@/lib/domain/reference";
import { isResolvedWaitlistStatus, waitlistStatusLabel } from "@/lib/domain/waitlist-status";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/config";

type AdminTab = "families" | "providers" | "inquiries" | "waitlist";
type WaitlistEntry = AdminDashboardData["waitlist"][number];
type FamilyEntry = AdminDashboardData["families"][number];
type CareGuideOption = AdminDashboardData["careGuides"][number];
type ProviderOption = AdminDashboardData["providerList"][number];
type InquiryEntry = AdminDashboardData["inquiries"][number];
type MatchStatus =
  | "SUGGESTED"
  | "CONTACTED"
  | "VISIT_REQUESTED"
  | "CALLBACK_REQUESTED"
  | "ACCEPTED"
  | "DECLINED"
  | "PLACED"
  | "CLOSED";

const inquiryCoordinationStatuses = new Set(["VISIT_REQUESTED", "CALLBACK_REQUESTED", "ACCEPTED", "CONTACTED"]);

function normalizeRecordLocale(value?: string | null): Locale {
  return value === "en" ? "en" : "nl";
}

function localeLanguageLabel(locale: Locale) {
  return locale === "en" ? "English" : "Dutch";
}

/** Compact multi-value cells in admin tables (e.g. "A, B +3"). */
function summarizeAdminList(value: string | string[] | null | undefined, maxVisible = 2) {
  const items = Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  if (!items.length) return "—";
  if (items.length <= maxVisible) return items.join(", ");
  return `${items.slice(0, maxVisible).join(", ")} +${items.length - maxVisible}`;
}

function canInviteProvider(entry: WaitlistEntry) {
  return entry.type === "FACILITY" && entry.canSendProviderInvite;
}

/** Verified flag stays editable until mark-contacted or any non-revoked invite. */
function isRegistrationVerificationLocked(entry: WaitlistEntry) {
  return (
    entry.status !== "NEW" ||
    entry.providerInviteAttemptsUsed > 0 ||
    entry.hasActivePendingProviderInvite
  );
}

function providerInviteButtonLabel(entry: WaitlistEntry) {
  if (entry.canSendProviderInvite) {
    return entry.providerInviteAttemptsUsed > 0 ? "Re-send invite" : "Invite provider";
  }
  if (entry.hasActivePendingProviderInvite) {
    return "Invite pending";
  }
  if (entry.providerInviteAttemptsRemaining === 0) {
    return "Invite limit reached";
  }
  return "Invite locked";
}

function providerInviteLockMessage(entry: WaitlistEntry) {
  if (entry.providerInviteLockReason) {
    return entry.providerInviteLockReason;
  }
  return "This waitlist entry is not eligible for a provider invite.";
}

function groupInquiriesByIntake(inquiries: InquiryEntry[]) {
  const grouped = new Map<string, InquiryEntry[]>();
  for (const inquiry of inquiries) {
    const current = grouped.get(inquiry.intakeId) ?? [];
    current.push(inquiry);
    grouped.set(inquiry.intakeId, current);
  }
  return grouped;
}

export function AdminDashboardClient({
  data: initialData,
  currentUserId,
  allowDataReset = false
}: {
  data: AdminDashboardData;
  currentUserId: string;
  /** When true, show the wipe button (ALLOW_ADMIN_DATA_RESET=true). */
  allowDataReset?: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<AdminTab>("families");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tabSeenAt, setTabSeenAt] = useState(getTabSeenAt);
  const [itemSeenVersion, setItemSeenVersion] = useState(0);
  const [inquiryHandoffSearch, setInquiryHandoffSearch] = useState("");
  const intakeSavePendingRef = useRef(false);
  const focusRefetchTimerRef = useRef<number | null>(null);
  /** Avoid full dashboard reloads every time the admin tab is re-focused. */
  const lastFocusSyncAtRef = useRef(0);

  const onMarkItemSeen = useCallback(() => {
    setItemSeenVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    setTabSeenAt(getTabSeenAt());
  }, []);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    initTabSeenFromData(initialData);
    initAdminInquirySeenFromData(
      initialData.inquiries.map((inquiry) => ({
        id: inquiry.id,
        updatedAtIso: inquiry.updatedAtIso,
        createdAtIso: inquiry.createdAtIso
      }))
    );
    initAdminItemsSeenFromData([
      ...initialData.families.map((family) => ({
        scope: "family" as const,
        id: family.id,
        createdAtIso: family.createdAtIso,
        updatedAtIso: family.updatedAtIso
      })),
      ...initialData.providerList.map((provider) => ({
        scope: "provider" as const,
        id: provider.id,
        createdAtIso: provider.createdAtIso,
        updatedAtIso: provider.updatedAtIso
      })),
      ...initialData.waitlist.map((entry) => ({
        scope: "waitlist" as const,
        id: entry.id,
        createdAtIso: entry.createdAtIso,
        updatedAtIso: entry.updatedAtIso
      })),
      ...initialData.inquiries.map((inquiry) => ({
        scope: "inquiry" as const,
        id: inquiry.id,
        createdAtIso: inquiry.createdAtIso,
        updatedAtIso: inquiry.updatedAtIso
      }))
    ]);
  }, [initialData]);

  // Tab badge watermark only — row pulse clears when a row is opened, not on tab visit.
  useEffect(() => {
    setTabSeenAt(markTabSeen(tab, data));
  }, [tab, data]);

  const tabBadges = useMemo(
    () => ({
      families: tab === "families" ? 0 : countUnseenFamilies(data.families, tabSeenAt.families),
      providers: tab === "providers" ? 0 : countUnseenProviders(data.providerList, tabSeenAt.providers),
      inquiries: tab === "inquiries" ? 0 : countUnseenInquiries(data.inquiries, tabSeenAt.inquiries),
      waitlist: tab === "waitlist" ? 0 : countUnseenWaitlist(data.waitlist, tabSeenAt.waitlist)
    }),
    [data, tab, tabSeenAt]
  );

  function selectTab(next: AdminTab) {
    setTab(next);
  }

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), TOAST_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const FOCUS_SYNC_COOLDOWN_MS = 5 * 60 * 1000;

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (intakeSavePendingRef.current) return;
      if (Date.now() - lastFocusSyncAtRef.current < FOCUS_SYNC_COOLDOWN_MS) return;

      if (focusRefetchTimerRef.current !== null) {
        window.clearTimeout(focusRefetchTimerRef.current);
      }

      focusRefetchTimerRef.current = window.setTimeout(() => {
        focusRefetchTimerRef.current = null;
        if (document.visibilityState !== "visible" || intakeSavePendingRef.current) return;
        if (Date.now() - lastFocusSyncAtRef.current < FOCUS_SYNC_COOLDOWN_MS) return;
        lastFocusSyncAtRef.current = Date.now();
        void syncDashboard();
      }, 500);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (focusRefetchTimerRef.current !== null) {
        window.clearTimeout(focusRefetchTimerRef.current);
        focusRefetchTimerRef.current = null;
      }
    };
  }, []);

  async function syncDashboard() {
    const response = await fetch("/api/admin/dashboard");
    lastFocusSyncAtRef.current = Date.now();
    if (!response.ok) return false;
    setData((await response.json()) as AdminDashboardData);
    return true;
  }

  async function refreshDashboard() {
    setRefreshing(true);
    try {
      const ok = await syncDashboard();
      setMessage(ok ? "Dashboard updated." : "Could not refresh dashboard.");
    } catch {
      setMessage("Could not refresh dashboard.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-[1.3rem] font-semibold text-ink">Admin dashboard</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Shepherds Oud Care — Netherlands-wide operations</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <HospitalInvitePanel onNotify={setMessage} />
          <ComposeAnnouncementBar onNotify={setMessage} />
          <RefreshButton onClick={() => void refreshDashboard()} loading={refreshing} />
          {allowDataReset ? <AdminResetDataButton /> : null}
        </div>
      </header>

      <StatGrid stats={data.stats} />

      <div className="mt-5 flex w-full gap-1 overflow-x-auto rounded-[10px] bg-white p-1 shadow-soft [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-6 sm:inline-flex sm:w-auto [&::-webkit-scrollbar]:hidden">
        {(["families", "providers", "inquiries", "waitlist"] as const).map((item) => {
          const label = item === "waitlist" ? "Waitlist" : item[0].toUpperCase() + item.slice(1);
          const badge = tabBadges[item];
          const isActive = tab === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => selectTab(item)}
              className={cn(
                "relative min-w-fit flex-1 rounded-lg px-3 py-2 text-sm transition sm:flex-none sm:px-4",
                isActive ? "bg-brand-amber text-white" : "text-ink/70 hover:bg-brand-cream hover:text-brand-amber"
              )}
            >
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                {label}
                {badge > 0 && !isActive ? (
                  <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-amber px-1.5 text-[10px] font-bold leading-none text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {message ? <div className="mt-4 rounded-lg bg-brand-green-pale/30 px-5 py-4 text-sm text-brand-green-dark">{message}</div> : null}

      <div className="mt-4 rounded-xl bg-white shadow-soft">
        <div className="overflow-x-auto">
          {tab === "families" ? (
            data.families.length ? (
              <FamiliesTable
                families={data.families}
                inquiries={data.inquiries}
                providers={data.providerList}
                careGuides={data.careGuides}
                currentUserId={currentUserId}
                setMessage={setMessage}
                onSync={syncDashboard}
                onIntakeSavePendingChange={(pending) => {
                  intakeSavePendingRef.current = pending;
                }}
                itemSeenVersion={itemSeenVersion}
                onMarkItemSeen={onMarkItemSeen}
                onOpenInquiries={(familyName) => {
                  setInquiryHandoffSearch(familyName);
                  setTab("inquiries");
                }}
              />
            ) : (
              <EmptyState title="No family intakes yet" description="New submissions from the intake form will appear here." />
            )
          ) : null}

          {tab === "providers" ? (
            data.providerList.length ? (
              <ProvidersTable
                providers={data.providerList}
                itemSeenVersion={itemSeenVersion}
                onMarkItemSeen={onMarkItemSeen}
                onSync={syncDashboard}
              />
            ) : (
              <EmptyState title="No active providers yet" description="Providers appear here after invitation acceptance or profile creation." />
            )
          ) : null}

          {tab === "inquiries" ? (
            data.inquiries.length ? (
              <InquiriesTable
                inquiries={data.inquiries}
                currentUserId={currentUserId}
                setMessage={setMessage}
                onSync={syncDashboard}
                itemSeenVersion={itemSeenVersion}
                onMarkItemSeen={onMarkItemSeen}
                handoffSearch={inquiryHandoffSearch}
                onHandoffSearchConsumed={() => setInquiryHandoffSearch("")}
              />
            ) : (
              <EmptyState
                title="No inquiries yet"
                description="When families are matched to providers, those records appear here."
              />
            )
          ) : null}

          {tab === "waitlist" ? (
            data.waitlist.length ? (
              <WaitlistTable
                entries={data.waitlist}
                setMessage={setMessage}
                itemSeenVersion={itemSeenVersion}
                onMarkItemSeen={onMarkItemSeen}
              />
            ) : (
              <EmptyState title="No waitlist registrations yet" description="Family and facility pre-launch sign-ups appear here only — not in Families or Providers." />
            )
          ) : null}
        </div>
      </div>
    </main>
  );
}

function FamiliesTable({
  families,
  inquiries,
  providers,
  careGuides,
  currentUserId,
  setMessage,
  onSync,
  onIntakeSavePendingChange,
  itemSeenVersion,
  onMarkItemSeen,
  onOpenInquiries
}: {
  families: FamilyEntry[];
  inquiries: InquiryEntry[];
  providers: ProviderOption[];
  careGuides: CareGuideOption[];
  currentUserId: string;
  setMessage: (message: string) => void;
  onSync: () => Promise<boolean>;
  onIntakeSavePendingChange: (pending: boolean) => void;
  itemSeenVersion: number;
  onMarkItemSeen: () => void;
  onOpenInquiries: (familyName: string) => void;
}) {
  const [rows, setRows] = useState(families);
  const [selected, setSelected] = useState<FamilyEntry | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const matchesByIntakeId = useMemo(() => groupInquiriesByIntake(inquiries), [inquiries]);

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (family) =>
          matchesReferenceQuery(family.id, search) ||
          matchesListSearch(search, family.name, family.location, family.care, family.careGuideName, family.context, family.email)
      ),
    [rows, search]
  );

  useEffect(() => {
    onIntakeSavePendingChange(pendingId !== null);
  }, [pendingId, onIntakeSavePendingChange]);

  function openFamily(family: FamilyEntry) {
    markAdminItemSeen("family", family.id, family.createdAtIso, family.updatedAtIso);
    onMarkItemSeen();
    setSelected(family);
  }

  useEffect(() => {
    setRows(families);
    setSelected((current) => {
      if (!current) return null;
      const fresh = families.find((family) => family.id === current.id) ?? null;
      if (fresh) {
        markAdminItemSeen("family", fresh.id, fresh.createdAtIso, fresh.updatedAtIso);
        onMarkItemSeen();
      }
      return fresh;
    });
  }, [families, onMarkItemSeen]);

  async function patchIntake(
    id: string,
    body: Record<string, unknown>,
    name: string,
    successMessage: string,
    notify: (message: string) => void = setMessage
  ) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/intakes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        if (response.status === 409) {
          const err = new Error(data.error || INTAKE_STALE_CONFLICT_MESSAGE);
          err.name = "IntakeStaleConflictError";
          throw err;
        }
        throw new Error(data.error || "Could not update intake.");
      }

      const result = (await response.json()) as { status?: string; careGuideId?: string | null; carePathway?: string | null };
      setRows((current) =>
        current.map((family) =>
          family.id === id
            ? {
                ...family,
                ...(result.status ? { status: result.status as IntakeStatus } : {}),
                ...(body.careGuideId !== undefined
                  ? {
                      careGuideId: body.careGuideId as string | null,
                      careGuideName:
                        careGuides.find((guide) => guide.id === body.careGuideId)?.name ||
                        careGuides.find((guide) => guide.id === body.careGuideId)?.email ||
                        null,
                      careGuideEmail: careGuides.find((guide) => guide.id === body.careGuideId)?.email || null
                    }
                  : {}),
                ...(body.carePathway !== undefined ? { carePathway: body.carePathway as string } : {}),
                ...(body.assessmentNotes !== undefined ? { assessmentNotes: body.assessmentNotes as string } : {}),
                ...(body.carePlanSummary !== undefined ? { carePlanSummary: body.carePlanSummary as string } : {}),
                ...(body.caseOutcome !== undefined ? { caseOutcome: body.caseOutcome as string | null } : {})
              }
            : family
        )
      );
      setSelected((current) => {
        if (current?.id !== id) return current;
        const guide = careGuides.find((item) => item.id === (body.careGuideId ?? current.careGuideId));
        return {
          ...current,
          ...(result.status ? { status: result.status as IntakeStatus } : {}),
          ...(body.careGuideId !== undefined
            ? { careGuideId: body.careGuideId as string | null, careGuideName: guide?.name || guide?.email || null, careGuideEmail: guide?.email || null }
            : {}),
          ...(body.carePathway !== undefined ? { carePathway: body.carePathway as string } : {}),
          ...(body.assessmentNotes !== undefined ? { assessmentNotes: body.assessmentNotes as string } : {}),
          ...(body.carePlanSummary !== undefined ? { carePlanSummary: body.carePlanSummary as string } : {}),
          ...(body.caseOutcome !== undefined ? { caseOutcome: body.caseOutcome as string | null } : {})
        };
      });

      if (body.status) {
        try {
          await recordAction({
            type: "intake_status_updated",
            targetType: "intake",
            targetId: id,
            label: `Updated ${name} to ${body.status}.`,
            payload: { id, status: body.status, name }
          });
        } catch {
          // Action log is optional; the intake update already succeeded.
        }
      }

      notify(successMessage);
      await onSync();
    } catch (error) {
      if (isIntakeStaleConflictError(error)) {
        throw error;
      }
      notify(error instanceof Error ? error.message : `Could not update ${name}. Please try again.`);
    } finally {
      setPendingId(null);
    }
  }

  async function updateStatus(
    id: string,
    status: IntakeStatus,
    name: string,
    notify?: (message: string) => void,
    expectedUpdatedAt?: string | null
  ) {
    await patchIntake(
      id,
      { status, ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}) },
      name,
      `You advanced ${name} to ${adminIntakeStatusLabel(status).toLowerCase()}.`,
      notify
    );
  }

  return (
    <>
      <div className="border-b border-stone-100 px-3 py-3 sm:px-4">
        <ListSearch value={search} onChange={setSearch} placeholder="Search families by name, area, care guide, or reference…" />
      </div>
      <table className="w-full min-w-[320px] border-collapse text-left sm:min-w-[560px]">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-3 py-3 sm:px-4">Family</th>
            <th className="hidden px-4 py-3 sm:table-cell">Care needed</th>
            <th className="hidden px-4 py-3 md:table-cell">Location</th>
            <th className="hidden px-4 py-3 xl:table-cell">Urgency</th>
            <th className="hidden px-4 py-3 xl:table-cell">Care Guide</th>
            <th className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">Status</th>
            <th className="hidden px-4 py-3 lg:table-cell">Next action</th>
            <th className="whitespace-nowrap px-3 py-3 sm:px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {filteredRows.map((family) => {
            const isPending = pendingId === family.id;
            const assignMeta = adminIntakeActionMeta("CARE_GUIDE_ASSIGNED");
            const nextAction = getAdminCaseNextAction(family, matchesByIntakeId.get(family.id) ?? []);
            const isUnread =
              selected?.id !== family.id &&
              itemSeenVersion >= 0 &&
              isAdminItemUnread("family", family.id, family.createdAtIso, family.updatedAtIso);
            const statusLabel = adminIntakeStatusLabel(family.status);
            const nextActionVariant =
              nextAction.severity === "action"
                ? ("softPending" as const)
                : nextAction.severity === "waiting"
                  ? ("softMuted" as const)
                  : ("softSuccess" as const);
            return (
              <tr key={family.id} className={cn("cursor-pointer hover:bg-cream", isUnread && "bg-brand-amber/[0.06] shadow-[inset_3px_0_0_0_var(--brand-amber)]")} onClick={() => openFamily(family)}>
                <td className="min-w-0 max-w-[16rem] px-3 py-3 text-sm sm:max-w-[18rem] sm:px-4">
                  <div className="flex min-w-0 items-start gap-2">
                    {isUnread ? <UnreadDot className="mt-1.5 shrink-0" /> : null}
                    <div className="min-w-0 space-y-1">
                      <strong className="block truncate text-ink">{family.name}</strong>
                      {(family.emergencyStopped || family.referralSource === "HOSPITAL") && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {family.emergencyStopped ? <Badge variant="softDanger">Emergency</Badge> : null}
                          {family.referralSource === "HOSPITAL" ? (
                            <Badge
                              variant="softPending"
                              title={
                                family.referringHospitalName
                                  ? `Hospital referral · ${family.referringHospitalName}`
                                  : "Hospital referral"
                              }
                            >
                              Hospital
                            </Badge>
                          ) : null}
                        </div>
                      )}
                      <p className="text-xs leading-5 text-neutral-500">
                        {family.ageRange ? `Age ${family.ageRange}` : "Age not specified"}
                        <span className="md:hidden">
                          {" · "}
                          {family.location}
                        </span>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 lg:hidden">
                        <Badge variant="softSage">{statusLabel}</Badge>
                        <Badge variant={nextActionVariant} title={nextAction.instruction}>
                          {nextAction.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hidden max-w-[12rem] px-4 py-3 text-sm text-neutral-600 sm:table-cell">
                  {summarizeAdminList(family.careTypes?.length ? family.careTypes : family.care, 2)}
                </td>
                <td className="hidden px-4 py-3 text-sm text-neutral-600 md:table-cell">{family.location}</td>
                <td className="hidden max-w-[9rem] px-4 py-3 text-sm text-neutral-600 xl:table-cell">
                  <span className="line-clamp-1">{summarizeAdminList(family.urgency, 1)}</span>
                </td>
                <td className="hidden max-w-[8rem] truncate px-4 py-3 text-sm text-neutral-600 xl:table-cell">
                  {family.careGuideName || "—"}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
                  <Badge variant="softSage">{statusLabel}</Badge>
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <Badge variant={nextActionVariant} className="max-w-[12rem] truncate" title={nextAction.instruction}>
                    {nextAction.label}
                  </Badge>
                </td>                <td className="whitespace-nowrap px-3 py-3 sm:px-4" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {family.status === "NEW" ? (
                      <IconActionButton
                        label={assignMeta.label}
                        icon={ClipboardList}
                        loading={isPending}
                        disabled={isPending}
                        onClick={() => openFamily(family)}
                      />
                    ) : (
                      <IconActionButton label="Open details" icon={ArrowUpRight} onClick={() => openFamily(family)} />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <FamilyDetailPanel
        family={selected}
        matches={selected ? matchesByIntakeId.get(selected.id) ?? [] : []}
        providers={providers}
        careGuides={careGuides}
        currentUserId={currentUserId}
        onClose={() => setSelected(null)}
        onUpdateStatus={updateStatus}
        onPatchIntake={patchIntake}
        onSync={onSync}
        pendingId={pendingId}
        setGlobalMessage={setMessage}
        onOpenInquiries={onOpenInquiries}
      />
    </>
  );
}

function ProvidersTable({
  providers,
  itemSeenVersion,
  onMarkItemSeen,
  onSync
}: {
  providers: AdminDashboardData["providerList"];
  itemSeenVersion: number;
  onMarkItemSeen: () => void;
  onSync: () => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<AdminDashboardData["providerList"][number] | null>(null);
  const [search, setSearch] = useState("");

  const filteredProviders = useMemo(
    () =>
      providers.filter(
        (provider) =>
          matchesReferenceQuery(provider.id, search) ||
          matchesListSearch(
            search,
            provider.name,
            provider.type,
            provider.area,
            provider.city,
            provider.province,
            provider.email,
            displayProviderAvailability(provider)
          )
      ),
    [providers, search]
  );

  function openProvider(provider: AdminDashboardData["providerList"][number]) {
    markAdminItemSeen("provider", provider.id, provider.createdAtIso, provider.updatedAtIso);
    onMarkItemSeen();
    setSelected(provider);
  }

  useEffect(() => {
    setSelected((current) => {
      if (!current) return null;
      const fresh = providers.find((provider) => provider.id === current.id) ?? null;
      if (fresh) {
        markAdminItemSeen("provider", fresh.id, fresh.createdAtIso, fresh.updatedAtIso);
        onMarkItemSeen();
      }
      return fresh;
    });
  }, [providers, onMarkItemSeen]);

  return (
    <>
      <div className="border-b border-stone-100 px-3 py-3 sm:px-4">
        <ListSearch value={search} onChange={setSearch} placeholder="Search providers by name, area, availability, or reference…" />
      </div>
      <table className="w-full min-w-[320px] border-collapse text-left sm:min-w-[520px]">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-3 py-3 sm:px-4">Provider</th>
            <th className="hidden px-4 py-3 sm:table-cell">Type</th>
            <th className="hidden px-4 py-3 md:table-cell">Area</th>
            <th className="hidden px-4 py-3 lg:table-cell">Availability</th>
            <th className="hidden px-4 py-3 xl:table-cell">Beds open</th>
            <th className="whitespace-nowrap px-3 py-3 sm:px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {filteredProviders.map((provider) => {
            const isUnread =
              selected?.id !== provider.id &&
              itemSeenVersion >= 0 &&
              isAdminItemUnread("provider", provider.id, provider.createdAtIso, provider.updatedAtIso);
            const availability = displayProviderAvailability(provider);

            return (
            <tr key={provider.id} className={cn("cursor-pointer hover:bg-cream", isUnread && "bg-brand-amber/[0.06] shadow-[inset_3px_0_0_0_var(--brand-amber)]")} onClick={() => openProvider(provider)}>
              <td className="min-w-0 max-w-[20rem] px-3 py-3 align-middle text-sm sm:px-4">
                <div className="flex min-w-0 items-center gap-2">
                  {isUnread ? <UnreadDot className="shrink-0" /> : null}
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <strong className="min-w-0 truncate text-ink">{provider.name}</strong>
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <Badge variant={provider.profileComplete ? "softSuccess" : "softPending"}>
                          {provider.profileComplete ? "Active" : "Locked"}
                        </Badge>
                        <Badge variant={providerVerificationBadgeVariant(provider.verificationStatus)}>
                          {provider.verificationLabel || providerVerificationLabel(provider.verificationStatus)}
                        </Badge>
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-neutral-400">
                      Ref {formatReference(provider.id)}
                      <span className="sm:hidden">
                        {" · "}
                        {provider.type} · {provider.area}
                      </span>
                    </p>
                    {!provider.profileComplete ? (
                      <p className="mt-0.5 text-xs text-neutral-500">Complete profile to unlock</p>
                    ) : !provider.matchable ? (
                      <p className="mt-0.5 text-xs text-neutral-500">Needs Verified status to match</p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 align-middle text-sm text-neutral-600 sm:table-cell">{provider.type}</td>
              <td className="hidden px-4 py-3 align-middle text-sm text-neutral-600 md:table-cell">{provider.area}</td>
              <td className="hidden px-4 py-3 align-middle text-sm text-neutral-600 lg:table-cell">{availability}</td>
              <td className="hidden px-4 py-3 align-middle text-sm text-neutral-600 xl:table-cell">
                {provider.bedsOpen ?? "—"}
                {provider.bedsTotal ? ` / ${provider.bedsTotal}` : ""}
              </td>
              <td className="px-3 py-3 align-middle sm:px-4" onClick={(event) => event.stopPropagation()}>
                <IconActionButton label="Open details" icon={ArrowUpRight} onClick={() => openProvider(provider)} />
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>

      <ProviderDetailPanel provider={selected} onClose={() => setSelected(null)} onSync={onSync} />
    </>
  );
}

function ProviderDetailPanel({
  provider,
  onClose,
  onSync
}: {
  provider: AdminDashboardData["providerList"][number] | null;
  onClose: () => void;
  onSync: () => Promise<boolean>;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();
  const [adminNotes, setAdminNotes] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<string>("REGISTRATION_RECEIVED");
  const [legalOrganisationName, setLegalOrganisationName] = useState("");
  const [kvkNumber, setKvkNumber] = useState("");
  const [agbCode, setAgbCode] = useState("");
  const [wtzaStatus, setWtzaStatus] = useState("");
  const [roomTypesText, setRoomTypesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingVerification, setSavingVerification] = useState(false);
  const previousProviderIdRef = useRef<string | null>(null);

  const roomTypesFromProvider = (provider?.roomTypes ?? []).join(", ");
  const hasUnsavedAdminNotes = provider ? adminNotes !== (provider.adminNotes ?? "") : false;
  const hasUnsavedVerification = provider
    ? verificationStatus !== (provider.verificationStatus || "REGISTRATION_RECEIVED") ||
      legalOrganisationName !== (provider.legalOrganisationName ?? "") ||
      kvkNumber !== (provider.kvkNumber ?? "") ||
      agbCode !== (provider.agbCode ?? "") ||
      wtzaStatus !== (provider.wtzaStatus ?? "") ||
      roomTypesText !== roomTypesFromProvider
    : false;

  useEffect(() => {
    if (!provider) clearPanelMessage();
  }, [provider, clearPanelMessage]);

  useEffect(() => {
    if (!provider) {
      previousProviderIdRef.current = null;
      setAdminNotes("");
      setVerificationStatus("REGISTRATION_RECEIVED");
      setLegalOrganisationName("");
      setKvkNumber("");
      setAgbCode("");
      setWtzaStatus("");
      setRoomTypesText("");
      return;
    }

    const isNewProvider = previousProviderIdRef.current !== provider.id;
    if (isNewProvider) {
      previousProviderIdRef.current = provider.id;
      setAdminNotes(provider.adminNotes ?? "");
      setVerificationStatus(provider.verificationStatus || "REGISTRATION_RECEIVED");
      setLegalOrganisationName(provider.legalOrganisationName ?? "");
      setKvkNumber(provider.kvkNumber ?? "");
      setAgbCode(provider.agbCode ?? "");
      setWtzaStatus(provider.wtzaStatus ?? "");
      setRoomTypesText((provider.roomTypes ?? []).join(", "));
      return;
    }

    if (!hasUnsavedAdminNotes) {
      setAdminNotes(provider.adminNotes ?? "");
    }
    if (!hasUnsavedVerification) {
      setVerificationStatus(provider.verificationStatus || "REGISTRATION_RECEIVED");
      setLegalOrganisationName(provider.legalOrganisationName ?? "");
      setKvkNumber(provider.kvkNumber ?? "");
      setAgbCode(provider.agbCode ?? "");
      setWtzaStatus(provider.wtzaStatus ?? "");
      setRoomTypesText((provider.roomTypes ?? []).join(", "));
    }
  }, [provider, hasUnsavedAdminNotes, hasUnsavedVerification]);

  const priceRange = provider ? formatProviderPriceRange(provider.priceMin, provider.priceMax) : null;
  const availability = provider ? displayProviderAvailability(provider) : null;
  const bedsSummary =
    provider && (provider.bedsOpen != null || provider.bedsTotal != null)
      ? `${provider.bedsOpen ?? "—"} open · ${provider.bedsTotal ?? "—"} total`
      : null;
  const availabilityUpdatedLabel = provider
    ? formatAvailabilityLastUpdated(provider.updatedAtIso) ?? provider.updatedAt
    : null;

  async function saveAdminNotes() {
    if (!provider) return;
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/admin/providers/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: adminNotes.trim() || null })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setPanelMessage(payload?.error || "Could not save internal notes.");
        return;
      }
      const ok = await onSync();
      setPanelMessage(ok ? "Internal notes saved." : "Notes saved, but the dashboard could not refresh.");
    } catch {
      setPanelMessage("Could not save internal notes.");
    } finally {
      setSavingNotes(false);
    }
  }

  async function saveVerification() {
    if (!provider) return;
    setSavingVerification(true);
    try {
      const roomTypes = roomTypesText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const response = await fetch(`/api/admin/providers/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus,
          legalOrganisationName: legalOrganisationName.trim() || null,
          kvkNumber: kvkNumber.trim() || null,
          agbCode: agbCode.trim() || null,
          wtzaStatus: wtzaStatus.trim() || null,
          roomTypes
        })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setPanelMessage(payload?.error || "Could not save verification details.");
        return;
      }
      const ok = await onSync();
      setPanelMessage(ok ? "Verification details saved." : "Verification saved, but the dashboard could not refresh.");
    } catch {
      setPanelMessage("Could not save verification details.");
    } finally {
      setSavingVerification(false);
    }
  }

  return (
    <SlidePanel
      open={Boolean(provider)}
      onClose={onClose}
      size="xl"
      title={provider?.name || "Provider"}
      subtitle={provider ? `${provider.type} · ${provider.area}` : "Facility profile"}
      notice={panelMessage}
      noticeTone={panelNoticeTone(panelMessage)}
    >
      {provider ? (
        <div className="space-y-5">
          {!provider.profileComplete ? (
            <div className="rounded-lg bg-brand-amber/10 px-4 py-3">
              <p className="text-sm font-semibold text-brand-amber-dark">Provider locked</p>
              <p className="mt-1 text-sm leading-6 text-neutral-700">
                This provider stays locked until their facility profile is complete.
              </p>
              {provider.profileMissingRequirements.length ? (
                <p className="mt-2 text-xs leading-5 text-neutral-600">
                  Missing: {provider.profileMissingRequirements.join(", ")}
                </p>
              ) : null}
            </div>
          ) : !isProviderMatchable(provider.verificationStatus) ? (
            <div className="rounded-lg bg-stone-50 px-4 py-3">
              <p className="text-sm font-semibold text-ink">Not yet matchable</p>
              <p className="mt-1 text-sm leading-6 text-neutral-700">
                Set verification to Verified, Onboarding complete, or Listing live before creating family matches.
              </p>
            </div>
          ) : null}

          <StatusPill className="bg-transparent px-0 py-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <span className="text-xs font-medium text-neutral-500">Verification</span>
                <p className="mt-1 font-semibold text-ink">
                  {provider.verificationLabel || providerVerificationLabel(provider.verificationStatus)}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Availability</span>
                <p className="mt-1 font-semibold text-ink">{availability || "Not set"}</p>
                {availabilityUpdatedLabel ? (
                  <p className="mt-0.5 text-xs text-neutral-500">Last updated {availabilityUpdatedLabel}</p>
                ) : null}
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Beds</span>
                <p className="mt-1 font-semibold text-ink">{bedsSummary || "Not set"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Response time</span>
                <p className="mt-1 font-semibold text-ink">
                  {provider.responseTimeHours ? `${provider.responseTimeHours} hours` : "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Visit availability</span>
                <p className="mt-1 font-semibold text-ink">{provider.visitAvailability || "Visits welcome"}</p>
              </div>
            </div>
          </StatusPill>

          <PanelSection
            step={1}
            title="Verification and registration"
            description="Controls matching eligibility. Listing live is required for public recommendation."
            collapsible
            defaultOpen
          >
            <div className="space-y-3">
              <label className="grid gap-2 text-sm font-medium">
                Verification status
                <select
                  value={verificationStatus}
                  onChange={(event) => setVerificationStatus(event.target.value)}
                  className={adminFieldClass}
                >
                  {PROVIDER_VERIFICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {providerVerificationLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Legal organisation name
                <input
                  value={legalOrganisationName}
                  onChange={(event) => setLegalOrganisationName(event.target.value)}
                  className={adminFieldClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                KvK number
                <input
                  value={kvkNumber}
                  onChange={(event) => setKvkNumber(event.target.value)}
                  className={adminFieldClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                AGB code
                <input
                  value={agbCode}
                  onChange={(event) => setAgbCode(event.target.value)}
                  className={adminFieldClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Wtza status
                <input
                  value={wtzaStatus}
                  onChange={(event) => setWtzaStatus(event.target.value)}
                  className={adminFieldClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Room types (comma-separated)
                <input
                  value={roomTypesText}
                  onChange={(event) => setRoomTypesText(event.target.value)}
                  placeholder="Single room, Shared room"
                  className={adminFieldClass}
                />
              </label>
              <AdminPanelActions>
                <Button
                  type="button"
                  size="sm"
                  disabled={savingVerification || !hasUnsavedVerification}
                  onClick={() => void saveVerification()}
                >
                  {savingVerification ? "Saving..." : "Save verification"}
                </Button>
              </AdminPanelActions>
            </div>
          </PanelSection>

          <div className="divide-y divide-stone-100 border-t border-stone-100">
            <PanelTopic title="Contact" defaultOpen>
              <DetailList
                columns={1}
                items={[
                  { label: "Contact name", value: provider.contactName },
                  { label: "Email", value: provider.email },
                  { label: "Phone", value: provider.phone },
                  { label: "Website", value: provider.website },
                  {
                    label: "UI language (emails)",
                    value: localeLanguageLabel(normalizeRecordLocale(provider.preferredLocale))
                  }
                ]}
              />
            </PanelTopic>
            <PanelTopic title="Location">
              <DetailList
                columns={1}
                items={[
                  { label: "Facility name", value: provider.name },
                  { label: "Type", value: provider.type },
                  { label: "Area", value: provider.area },
                  { label: "City", value: provider.city },
                  { label: "Province", value: provider.province }
                ]}
              />
            </PanelTopic>
            <PanelTopic title="Capacity and pricing">
              <DetailList
                columns={1}
                items={[
                  { label: "Available beds", value: provider.bedsOpen != null ? String(provider.bedsOpen) : null },
                  { label: "Total beds / places", value: provider.bedsTotal != null ? String(provider.bedsTotal) : null },
                  { label: "Availability status", value: provider.availabilityStatus },
                  { label: "Waitlist", value: provider.waitlistText },
                  { label: "Price range", value: priceRange }
                ]}
              />
            </PanelTopic>
            <PanelTopic title="Care profile">
              <DetailList columns={1} items={[{ label: "Dementia capacity", value: provider.dementiaCapacity }]} />
              <div className="mt-2 space-y-3">
                <div>
                  <p className="text-xs font-medium text-neutral-500">Care levels</p>
                  <div className="mt-1.5">
                    <TagList items={provider.careLevels ?? []} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">Room types</p>
                  <div className="mt-1.5">
                    <TagList items={provider.roomTypes ?? []} />
                  </div>
                </div>
              </div>
            </PanelTopic>
            <PanelTopic title="Services and languages">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-neutral-500">Services offered</p>
                  <div className="mt-1.5">
                    <TagList items={provider.services ?? []} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">Languages spoken</p>
                  <div className="mt-1.5">
                    <TagList items={provider.languages ?? []} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">Funding types accepted</p>
                  <div className="mt-1.5">
                    <TagList items={provider.fundingTypes ?? []} />
                  </div>
                </div>
              </div>
            </PanelTopic>
            <PanelTopic title="Quality and accessibility">
              <DetailList
                columns={1}
                items={[
                  { label: "Quality information", value: provider.qualityInfo },
                  { label: "Accessibility notes", value: provider.accessibilityNotes }
                ]}
              />
            </PanelTopic>
            <PanelTopic title="Description">
              <p className="text-sm leading-7 text-neutral-700">{provider.description?.trim() || "—"}</p>
            </PanelTopic>
            <PanelTopic title="Record">
              <DetailList
                columns={1}
                items={[
                  { label: "Provider ID", value: provider.id },
                  { label: "Added", value: provider.createdAt },
                  { label: "Last updated", value: provider.updatedAt }
                ]}
              />
            </PanelTopic>
          </div>

          <PanelSection
            title="Internal notes"
            description="Visible to admins only. Use for vetting notes, referral context, or follow-up reminders."
            collapsible
            defaultOpen={false}
          >
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              placeholder="Add internal notes about this provider..."
              className={`${adminFieldClass} min-h-28 w-full`}
            />
            <AdminPanelActions>
              <Button type="button" size="sm" disabled={savingNotes} onClick={() => void saveAdminNotes()}>
                {savingNotes ? "Saving..." : "Save notes"}
              </Button>
            </AdminPanelActions>
          </PanelSection>

          <PanelSection title="Quick actions">
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={`/providers/${provider.id}`} target="_blank" rel="noreferrer">
                  Public profile
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(provider.id);
                  setPanelMessage(`Copied provider ID for ${provider.name}.`);
                }}
              >
                Copy ID
              </Button>
            </div>
          </PanelSection>
        </div>
      ) : null}
    </SlidePanel>
  );
}

function formatProviderPriceRange(priceMin: number | null, priceMax: number | null) {
  if (priceMin != null && priceMax != null) {
    return `EUR ${priceMin.toLocaleString("en-GB")} – EUR ${priceMax.toLocaleString("en-GB")} per month`;
  }
  if (priceMin != null) {
    return `From EUR ${priceMin.toLocaleString("en-GB")} per month`;
  }
  if (priceMax != null) {
    return `Up to EUR ${priceMax.toLocaleString("en-GB")} per month`;
  }
  return null;
}

function inquiryAssignedToOtherGuide(inquiry: InquiryEntry, currentUserId: string) {
  return Boolean(inquiry.careGuideId) && inquiry.careGuideId !== currentUserId;
}

function InquiriesTable({
  inquiries,
  currentUserId,
  setMessage,
  onSync,
  itemSeenVersion,
  onMarkItemSeen,
  handoffSearch = "",
  onHandoffSearchConsumed
}: {
  inquiries: InquiryEntry[];
  currentUserId: string;
  setMessage: (message: string) => void;
  onSync: () => Promise<boolean>;
  itemSeenVersion: number;
  onMarkItemSeen: () => void;
  handoffSearch?: string;
  onHandoffSearchConsumed?: () => void;
}) {
  const [rows, setRows] = useState(inquiries);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<InquiryEntry | null>(null);
  const [confirmClose, setConfirmClose] = useState<InquiryEntry | null>(null);
  const [confirmContacted, setConfirmContacted] = useState<InquiryEntry | null>(null);
  const [listFilter, setListFilter] = useState<"follow_up" | "all">("follow_up");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!handoffSearch) return;
    setSearch(handoffSearch);
    setListFilter("all");
    onHandoffSearchConsumed?.();
  }, [handoffSearch, onHandoffSearchConsumed]);

  function openInquiry(inquiry: InquiryEntry) {
    markAdminInquirySeen(inquiry.id, inquiry.updatedAtIso, inquiry.createdAtIso);
    onMarkItemSeen();
    setSelected(inquiry);
  }

  useEffect(() => {
    setRows(inquiries);
    setSelected((current) => {
      if (!current) return null;
      const fresh = inquiries.find((item) => item.id === current.id) ?? null;
      if (fresh) {
        markAdminInquirySeen(fresh.id, fresh.updatedAtIso, fresh.createdAtIso);
        onMarkItemSeen();
      }
      return fresh;
    });
  }, [inquiries, onMarkItemSeen]);

  const visibleRows = useMemo(
    () =>
      listFilter === "all" ? rows : rows.filter((item) => inquiryCoordinationStatuses.has(item.statusRaw)),
    [rows, listFilter]
  );
  const filteredRows = useMemo(
    () =>
      visibleRows.filter(
        (inquiry) =>
          matchesReferenceQuery(inquiry.id, search) ||
          matchesReferenceQuery(inquiry.intakeId, search) ||
          matchesListSearch(
            search,
            inquiry.family,
            inquiry.provider,
            inquiry.familyArea,
            inquiry.familyEmail,
            inquiry.familyPhone,
            inquiry.status
          )
      ),
    [visibleRows, search]
  );
  const sortedInquiries = useMemo(
    () => [...filteredRows].sort((a, b) => compareMatchPriority(a.statusRaw, b.statusRaw)),
    [filteredRows]
  );
  const followUpCount = useMemo(
    () =>
      rows.filter((item) => {
        if (inquiryAssignedToOtherGuide(item, currentUserId)) return false;
        if (!isAdminActionNeeded(item.statusRaw)) return false;
        if (selected?.id === item.id) return false;
        return itemSeenVersion >= 0 && isAdminInquiryUnread(item.id, item.updatedAtIso, item.createdAtIso);
      }).length,
    [rows, currentUserId, selected?.id, itemSeenVersion]
  );

  async function updateMatchStatus(id: string, status: MatchStatus, notify: (message: string) => void = setMessage) {
    setPendingActionKey(`${id}:${status}`);
    setPendingId(id);
    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Could not update inquiry.");
      }

      const updated = (await response.json()) as { status: MatchStatus; notes?: string | null; updatedAt?: string };
      const updatedAtIso = updated.updatedAt ?? new Date().toISOString();

      setRows((current) =>
        current.map((inquiry) =>
          inquiry.id === id
            ? {
                ...inquiry,
                statusRaw: updated.status,
                status: adminMatchStatusLabel(updated.status),
                notes: updated.notes ?? inquiry.notes,
                updatedAtIso,
                updatedAt: new Date(updatedAtIso).toLocaleDateString("en-GB")
              }
            : inquiry
        )
      );
      setSelected((current) =>
        current?.id === id
          ? {
              ...current,
              statusRaw: updated.status,
              status: adminMatchStatusLabel(updated.status),
              notes: updated.notes ?? current.notes,
              updatedAtIso,
              updatedAt: new Date(updatedAtIso).toLocaleDateString("en-GB")
            }
          : current
      );
      markAdminInquirySeen(id, updatedAtIso);
      onMarkItemSeen();
      notify(`You updated this inquiry to ${adminMatchStatusLabel(updated.status).toLowerCase()}.`);
      await onSync();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update inquiry.");
    } finally {
      setPendingId(null);
      setPendingActionKey(null);
    }
  }

  return (
    <>
      <div className="space-y-3 border-b border-stone-100 px-3 py-3 sm:px-4">
        <div className="inline-flex w-full gap-1 rounded-lg bg-stone-100 p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setListFilter("follow_up")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition sm:flex-none",
              listFilter === "follow_up" ? "bg-white font-semibold text-ink shadow-sm" : "text-ink/60 hover:text-ink"
            )}
          >
            Needs follow-up
            {followUpCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-amber px-1.5 text-[10px] font-bold leading-none text-white">
                {followUpCount > 9 ? "9+" : followUpCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setListFilter("all")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm transition sm:flex-none",
              listFilter === "all" ? "bg-white font-semibold text-ink shadow-sm" : "text-ink/60 hover:text-ink"
            )}
          >
            All matches
          </button>
        </div>
        <ListSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by family, provider, phone, or reference…"
        />
      </div>

      {!sortedInquiries.length ? (
        <EmptyState
          title={listFilter === "all" ? "No inquiries yet" : "Nothing needs follow-up"}
          description={
            listFilter === "all"
              ? "Matched family–provider records will show up here."
              : "When a family requests a visit or callback, or a provider accepts, it appears here."
          }
        />
      ) : (

      <table className="w-full min-w-[320px] border-collapse text-left sm:min-w-[560px]">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-3 py-3 sm:px-4">Family</th>
            <th className="hidden px-4 py-3 sm:table-cell">Provider</th>
            <th className="hidden px-4 py-3 md:table-cell">Match</th>
            <th className="hidden px-4 py-3 lg:table-cell">Updated</th>
            <th className="hidden px-4 py-3 md:table-cell">Status</th>
            <th className="whitespace-nowrap px-3 py-3 sm:px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {sortedInquiries.map((inquiry) => {
            const isPending = pendingId === inquiry.id;
            const readOnly = inquiryAssignedToOtherGuide(inquiry, currentUserId);
            const needsFollowUp = !readOnly && isAdminActionNeeded(inquiry.statusRaw);
            const placementReady = inquiry.statusRaw === "ACCEPTED" || inquiry.statusRaw === "CONTACTED";
            const isUnread =
              selected?.id !== inquiry.id &&
              itemSeenVersion >= 0 &&
              isAdminInquiryUnread(inquiry.id, inquiry.updatedAtIso, inquiry.createdAtIso);

            return (
              <tr
                key={inquiry.id}
                className={cn(
                  "cursor-pointer hover:bg-cream",
                  isUnread && "bg-brand-amber/[0.06] shadow-[inset_3px_0_0_0_var(--brand-amber)]",
                  needsFollowUp && !isUnread && "bg-brand-amber/[0.04]"
                )}
                onClick={() => openInquiry(inquiry)}
              >
                <td className="min-w-0 max-w-[16rem] px-3 py-3 text-sm sm:px-4">
                  <div className="flex min-w-0 items-start gap-2">
                    {isUnread ? <UnreadDot className="mt-1.5 shrink-0" /> : null}
                    <div className="min-w-0 space-y-1">
                      <strong className="block truncate text-ink">{inquiry.family}</strong>
                      <p className="font-mono text-[11px] text-neutral-400">Ref {formatReference(inquiry.intakeId)}</p>
                      <p className="text-xs text-neutral-500 sm:hidden">{inquiry.provider}</p>
                      <div className="flex flex-wrap items-center gap-1.5 md:hidden">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
                            matchStatusBadgeClass(inquiry.statusRaw)
                          )}
                        >
                          {adminMatchStatusLabel(inquiry.statusRaw)}
                        </span>
                        {needsFollowUp ? <Badge variant="softPending">Follow up</Badge> : null}
                      </div>
                      {readOnly ? (
                        <p className="text-[11px] text-neutral-500">
                          Read-only · {inquiry.careGuideName || "another Care Guide"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="hidden max-w-[12rem] truncate px-4 py-3 text-sm text-neutral-700 sm:table-cell">
                  {inquiry.provider}
                </td>
                <td className="hidden px-4 py-3 text-sm font-semibold text-sage-700 md:table-cell">{inquiry.match}</td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-neutral-600 lg:table-cell">
                  {inquiry.updatedAt}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
                      matchStatusBadgeClass(inquiry.statusRaw)
                    )}
                  >
                    {adminMatchStatusLabel(inquiry.statusRaw)}
                  </span>
                </td>
                <td className="px-3 py-3 sm:px-4" onClick={(event) => event.stopPropagation()}>
                  <div className="flex flex-wrap items-center gap-1">
                    {!readOnly &&
                    (inquiry.statusRaw === "VISIT_REQUESTED" ||
                      inquiry.statusRaw === "CALLBACK_REQUESTED" ||
                      inquiry.statusRaw === "ACCEPTED") ? (
                      <IconActionButton
                        label={adminInquiryActionMeta("CONTACTED").label}
                        icon={CalendarCheck}
                        loading={pendingActionKey === `${inquiry.id}:CONTACTED`}
                        disabled={isPending}
                        onClick={() => setConfirmContacted(inquiry)}
                      />
                    ) : null}
                    {!readOnly && placementReady ? (
                      <IconActionButton
                        label={adminInquiryActionMeta("PLACED").label}
                        icon={Building2}
                        loading={pendingActionKey === `${inquiry.id}:PLACED`}
                        disabled={isPending}
                        onClick={() => void updateMatchStatus(inquiry.id, "PLACED")}
                      />
                    ) : null}
                    {!readOnly && canAdminCloseProviderMatch(inquiry.statusRaw) ? (
                      <IconActionButton
                        label={adminInquiryActionMeta("CLOSED").label}
                        icon={X}
                        loading={pendingActionKey === `${inquiry.id}:CLOSED`}
                        disabled={isPending}
                        onClick={() => setConfirmClose(inquiry)}
                      />
                    ) : null}
                    <IconActionButton label="Open details" icon={ArrowUpRight} onClick={() => openInquiry(inquiry)} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      )}

      <InquiryDetailPanel
        inquiry={selected}
        currentUserId={currentUserId}
        pendingId={pendingId}
        pendingActionKey={pendingActionKey}
        onClose={() => setSelected(null)}
        onUpdateStatus={(id, status, notify) => updateMatchStatus(id, status, notify)}
      />
      <ConfirmDialog
        open={Boolean(confirmContacted)}
        title="Mark visit or call as arranged?"
        description="Only confirm once the family and provider have agreed on the date and time. This updates both dashboards."
        confirmLabel="Mark arranged"
        pending={Boolean(confirmContacted && pendingActionKey === `${confirmContacted.id}:CONTACTED`)}
        onCancel={() => setConfirmContacted(null)}
        onConfirm={() => {
          if (!confirmContacted) return;
          void updateMatchStatus(confirmContacted.id, "CONTACTED");
          setConfirmContacted(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(confirmClose)}
        tone="danger"
        pending={Boolean(confirmClose && pendingId === confirmClose.id)}
        title="Close this provider match?"
        description="This archives only this provider inquiry. The provider will see it as closed. The family case stays active in the Families tab — use Close case there when the whole family journey is finished."
        confirmLabel="Close provider match"
        onCancel={() => setConfirmClose(null)}
        onConfirm={() => {
          if (!confirmClose) return;
          void updateMatchStatus(confirmClose.id, "CLOSED");
          setConfirmClose(null);
        }}
      />
    </>
  );
}

function InquiryDetailPanel({
  inquiry,
  currentUserId,
  pendingId,
  pendingActionKey,
  onClose,
  onUpdateStatus
}: {
  inquiry: InquiryEntry | null;
  currentUserId: string;
  pendingId: string | null;
  pendingActionKey: string | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: MatchStatus, notify?: (message: string) => void) => Promise<void>;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();
  const isPending = inquiry ? pendingId === inquiry.id : false;
  const isReadOnly = inquiry ? inquiryAssignedToOtherGuide(inquiry, currentUserId) : false;
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmContacted, setConfirmContacted] = useState(false);

  useEffect(() => {
    if (!inquiry) clearPanelMessage();
  }, [inquiry, clearPanelMessage]);

  async function updateFromPanel(id: string, status: MatchStatus) {
    await onUpdateStatus(id, status, setPanelMessage);
  }

  const status = inquiry?.statusRaw;
  const canMarkContacted =
    !isReadOnly &&
    (status === "VISIT_REQUESTED" || status === "CALLBACK_REQUESTED" || status === "ACCEPTED");
  const canMarkPlaced = !isReadOnly && (status === "ACCEPTED" || status === "CONTACTED");
  const canClose = !isReadOnly && canAdminCloseProviderMatch(status);
  const hasActions = canMarkContacted || canMarkPlaced || canClose;
  const nextStep =
    inquiry && status && !isReadOnly && (canMarkContacted || canMarkPlaced || status === "DECLINED")
      ? adminInquiryHint(status)
      : "";

  const details = inquiry
    ? [
        { label: "Family", value: inquiry.family },
        { label: "Phone", value: inquiry.familyPhone },
        { label: "Email", value: inquiry.familyEmail },
        { label: "Area", value: inquiry.familyArea },
        { label: "Care needed", value: inquiry.familyCare },
        { label: "Urgency", value: inquiry.familyUrgency },
        { label: "Provider", value: inquiry.provider },
        { label: "Match score", value: inquiry.match },
        { label: "Status", value: adminMatchStatusLabel(inquiry.statusRaw) },
        { label: "Created", value: inquiry.date },
        { label: "Last updated", value: inquiry.updatedAt },
        { label: "Activity log", value: adminMatchNotes(inquiry.notes) || inquiry.notes }
      ]
    : [];

  return (
    <SlidePanel
      open={Boolean(inquiry)}
      onClose={onClose}
      size="wide"
      title={inquiry?.family || "Inquiry"}
      subtitle={
        inquiry
          ? `${inquiry.provider} · ${adminMatchStatusLabel(inquiry.statusRaw)}`
          : "Match details"
      }
      notice={panelMessage}
      noticeTone={panelNoticeTone(panelMessage)}
    >
      {inquiry ? (
        <div className="space-y-5">
          <p className="text-sm leading-6 text-neutral-600">
            Contact details and history for this one family–provider match. Use actions here only when you arrange a
            visit/call, record the chosen provider, or close an unused match.
          </p>

          {isReadOnly ? (
            <div className="rounded-lg bg-stone-50 px-4 py-3 text-sm text-ink">
              <p className="font-semibold">
                Read-only — assigned to {inquiry.careGuideName || "another Care Guide"}
              </p>
              <p className="mt-1 leading-6 text-neutral-600">
                You can view this inquiry. Only the assigned Care Guide can update match status.
              </p>
            </div>
          ) : null}

          {nextStep ? (
            <StatusPill className={cn("px-3 py-2 text-sm", matchStatusBadgeClass(inquiry.statusRaw))}>
              {nextStep}
            </StatusPill>
          ) : !isReadOnly && (inquiry.statusRaw === "PLACED" || inquiry.statusRaw === "CLOSED") ? (
            <p className="text-sm text-neutral-500">No further action on this match.</p>
          ) : null}

          {hasActions ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Your next steps</p>
              {canMarkContacted ? (
                <div className="flex flex-col gap-2 rounded-lg bg-brand-cream/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{adminInquiryActionMeta("CONTACTED").label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-neutral-500">{adminInquiryActionMeta("CONTACTED").description}</p>
                  </div>
                  <Button size="sm" className="w-full shrink-0 sm:w-auto" disabled={isPending} onClick={() => setConfirmContacted(true)}>
                    {pendingActionKey === `${inquiry.id}:CONTACTED` ? "Saving..." : "Confirm"}
                  </Button>
                </div>
              ) : null}
              {canMarkPlaced ? (
                <div className="flex flex-col gap-2 rounded-lg bg-stone-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{adminInquiryActionMeta("PLACED").label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-neutral-500">{adminInquiryActionMeta("PLACED").description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full shrink-0 sm:w-auto"
                    disabled={isPending}
                    onClick={() => void updateFromPanel(inquiry.id, "PLACED")}
                  >
                    {pendingActionKey === `${inquiry.id}:PLACED` ? "Saving..." : "Confirm"}
                  </Button>
                </div>
              ) : null}
              {canClose ? (
                <div className="flex flex-col gap-2 rounded-lg bg-stone-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{adminInquiryActionMeta("CLOSED").label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-neutral-500">{adminInquiryActionMeta("CLOSED").description}</p>
                  </div>
                  <Button size="sm" variant="outline" className="w-full shrink-0 sm:w-auto" disabled={isPending} onClick={() => setConfirmClose(true)}>
                    {pendingActionKey === `${inquiry.id}:CLOSED` ? "Saving..." : "Confirm"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="divide-y divide-stone-100 border-t border-stone-100">
            <PanelTopic title="Family" defaultOpen>
              <DetailList
                items={details.filter((item) =>
                  ["Family", "Phone", "Email", "Area", "Care needed", "Urgency"].includes(item.label)
                )}
              />
            </PanelTopic>
            <PanelTopic title="Match" defaultOpen>
              <DetailList
                items={details.filter((item) =>
                  ["Provider", "Match score", "Status", "Created", "Last updated", "Activity log"].includes(item.label)
                )}
              />
            </PanelTopic>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmContacted}
        title="Mark visit or call as arranged?"
        description="Only confirm once the family and provider have agreed on the date and time. This updates both dashboards."
        confirmLabel="Mark arranged"
        pending={Boolean(inquiry && pendingActionKey === `${inquiry.id}:CONTACTED`)}
        onCancel={() => setConfirmContacted(false)}
        onConfirm={() => {
          if (!inquiry) return;
          void updateFromPanel(inquiry.id, "CONTACTED");
          setConfirmContacted(false);
        }}
      />
      <ConfirmDialog
        open={confirmClose}
        tone="danger"
        pending={Boolean(inquiry && pendingActionKey === `${inquiry.id}:CLOSED`)}
        title="Close this provider match?"
        description="This archives only this provider inquiry. The provider will see it as closed. The family case stays active in the Families tab — use Close case there when the whole family journey is finished."
        confirmLabel="Close provider match"
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          if (!inquiry) return;
          void updateFromPanel(inquiry.id, "CLOSED");
          setConfirmClose(false);
        }}
      />
    </SlidePanel>
  );
}

function WaitlistTable({
  entries: initialEntries,
  setMessage,
  itemSeenVersion,
  onMarkItemSeen
}: {
  entries: WaitlistEntry[];
  setMessage: (message: string) => void;
  itemSeenVersion: number;
  onMarkItemSeen: () => void;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<WaitlistEntry | null>(null);
  const [confirmInvite, setConfirmInvite] = useState<WaitlistEntry | null>(null);
  const [search, setSearch] = useState("");

  const filteredEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          matchesReferenceQuery(entry.id, search) ||
          matchesListSearch(search, entry.name, entry.email, entry.location, entry.city, entry.type, entry.phone)
      ),
    [entries, search]
  );

  function openEntry(entry: WaitlistEntry) {
    markAdminItemSeen("waitlist", entry.id, entry.createdAtIso, entry.updatedAtIso);
    onMarkItemSeen();
    setSelected(entry);
  }

  useEffect(() => {
    setEntries(initialEntries);
    setSelected((current) => {
      if (!current) return null;
      const fresh = initialEntries.find((entry) => entry.id === current.id) ?? null;
      if (fresh) {
        markAdminItemSeen("waitlist", fresh.id, fresh.createdAtIso, fresh.updatedAtIso);
        onMarkItemSeen();
      }
      return fresh;
    });
  }, [initialEntries, onMarkItemSeen]);

  function canMarkContacted(entry: WaitlistEntry) {
    return entry.status === "NEW";
  }

  function waitlistStatusClass(status: string) {
    switch (status) {
      case "CONTACTED":
        return "bg-brand-amber/15 text-brand-amber-dark";
      case "CONVERTED":
        return "bg-brand-green-pale/70 text-brand-green-dark";
      case "CLOSED":
        return "bg-stone-100 text-neutral-600";
      default:
        return "bg-sage-100 text-sage-700";
    }
  }

  function startProviderInvite(entry: WaitlistEntry, notify: (message: string) => void = setMessage) {
    if (!canInviteProvider(entry)) {
      notify(providerInviteLockMessage(entry));
      return;
    }

    setSelected(null);
    setConfirmInvite(entry);
  }

  async function markContacted(id: string, name: string, notify: (message: string) => void = setMessage) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONTACTED" })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Could not update waitlist entry.");
      }

      const result = (await response.json()) as { status: WaitlistEntry["status"]; updatedAtIso?: string };
      const entry = entries.find((item) => item.id === id);
      const updatedAtIso = result.updatedAtIso ?? entry?.updatedAtIso ?? new Date().toISOString();

      setEntries((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: result.status,
                updatedAtIso,
                updatedAt: new Date(updatedAtIso).toLocaleDateString("en-GB")
              }
            : item
        )
      );
      setSelected((current) =>
        current?.id === id
          ? {
              ...current,
              status: result.status,
              updatedAtIso,
              updatedAt: new Date(updatedAtIso).toLocaleDateString("en-GB")
            }
          : current
      );

      if (entry) {
        markAdminItemSeen("waitlist", id, entry.createdAtIso, updatedAtIso);
        onMarkItemSeen();
      }

      try {
        await recordAction({
          type: "waitlist_contacted",
          targetType: "waitlist",
          targetId: id,
          label: `Marked ${name} as contacted.`,
          payload: { id, name }
        });
      } catch {
        // Action log is optional; the waitlist update already succeeded.
      }

      notify(`You marked ${name} as contacted on the waitlist.`);
    } catch {
      notify(`Could not mark ${name} as contacted. Please try again.`);
    } finally {
      setPendingId(null);
    }
  }

  async function toggleRegistrationVerified(
    id: string,
    verified: boolean,
    notify: (message: string) => void = setMessage
  ) {
    const entry = entries.find((item) => item.id === id) ?? (selected?.id === id ? selected : null);
    if (!entry) {
      notify("Could not update registration verification.");
      return;
    }
    if (!verified && isRegistrationVerificationLocked(entry)) {
      notify("Registration verification cannot be undone after the facility is contacted or invited.");
      return;
    }

    const previousVerified = Boolean(entry.registrationVerified);

    const optimisticPatch = (item: WaitlistEntry): WaitlistEntry =>
      item.id === id ? { ...item, registrationVerified: verified } : item;

    setEntries((current) => current.map(optimisticPatch));
    setSelected((current) => (current ? optimisticPatch(current) : current));

    try {
      const response = await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationVerified: verified })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Could not update registration verification.");
      }

      const result = (await response.json()) as Partial<WaitlistEntry> & { updatedAtIso?: string };
      const updatedAtIso = result.updatedAtIso ?? new Date().toISOString();

      const confirmPatch = (item: WaitlistEntry): WaitlistEntry =>
        item.id === id
          ? {
              ...item,
              registrationVerified: Boolean(result.registrationVerified ?? verified),
              canSendProviderInvite: Boolean(result.canSendProviderInvite ?? item.canSendProviderInvite),
              providerInviteAttemptsUsed:
                result.providerInviteAttemptsUsed ?? item.providerInviteAttemptsUsed,
              providerInviteAttemptsRemaining:
                result.providerInviteAttemptsRemaining ?? item.providerInviteAttemptsRemaining,
              hasActivePendingProviderInvite:
                result.hasActivePendingProviderInvite ?? item.hasActivePendingProviderInvite,
              providerInviteLockReason:
                result.providerInviteLockReason !== undefined
                  ? result.providerInviteLockReason
                  : item.providerInviteLockReason,
              updatedAt: new Date(updatedAtIso).toLocaleDateString("en-GB"),
              updatedAtIso
            }
          : item;

      setEntries((current) => current.map(confirmPatch));
      setSelected((current) => (current ? confirmPatch(current) : current));
    } catch (error) {
      const revertPatch = (item: WaitlistEntry): WaitlistEntry =>
        item.id === id ? { ...item, registrationVerified: previousVerified } : item;
      setEntries((current) => current.map(revertPatch));
      setSelected((current) => (current ? revertPatch(current) : current));
      notify(error instanceof Error ? error.message : "Could not update registration verification.");
    }
  }

  async function inviteProvider(entry: WaitlistEntry) {
    setPendingInviteId(entry.id);
    try {
      const response = await fetch("/api/admin/provider-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitlistEntryId: entry.id })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Could not send provider invite.");
      }

      const payload = (await response.json()) as {
        id: string;
        emailMode?: string;
        attemptsUsed?: number;
        attemptsRemaining?: number;
      };
      const nextStatus = entry.status === "NEW" ? ("CONTACTED" as const) : entry.status;
      const attemptsUsed = payload.attemptsUsed ?? entry.providerInviteAttemptsUsed + 1;
      const attemptsRemaining = payload.attemptsRemaining ?? Math.max(0, entry.providerInviteAttemptsRemaining - 1);

      setEntries((current) =>
        current.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                status: nextStatus,
                canSendProviderInvite: false,
                hasActivePendingProviderInvite: true,
                providerInviteAttemptsUsed: attemptsUsed,
                providerInviteAttemptsRemaining: attemptsRemaining,
                providerInviteLockReason:
                  "A provider invite is still pending. Wait for it to be accepted or expire."
              }
            : item
        )
      );
      setSelected((current) =>
        current?.id === entry.id
          ? {
              ...current,
              status: nextStatus,
              canSendProviderInvite: false,
              hasActivePendingProviderInvite: true,
              providerInviteAttemptsUsed: attemptsUsed,
              providerInviteAttemptsRemaining: attemptsRemaining,
              providerInviteLockReason:
                "A provider invite is still pending. Wait for it to be accepted or expire."
            }
          : current
      );

      markAdminItemSeen("waitlist", entry.id, entry.createdAtIso, entry.updatedAtIso);
      onMarkItemSeen();

      try {
        await recordAction({
          type: "provider_invite_sent",
          targetType: "waitlist",
          targetId: entry.id,
          label: `Sent provider invite to ${entry.email}.`,
          payload: { waitlistEntryId: entry.id, inviteId: payload.id, email: entry.email, emailMode: payload.emailMode }
        });
      } catch {
        // Invite send succeeded; action log is non-blocking.
      }

      setMessage(
        `Provider invite sent to ${entry.email}. It expires in 7 days (${attemptsRemaining} re-send${attemptsRemaining === 1 ? "" : "s"} left).`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not send provider invite to ${entry.email}. Please try again.`);
    } finally {
      setPendingInviteId(null);
      setConfirmInvite(null);
    }
  }

  return (
    <>
      <div className="border-b border-stone-100 px-3 py-3 sm:px-4">
        <ListSearch value={search} onChange={setSearch} placeholder="Search waitlist by name, email, location, or reference…" />
      </div>
      <table className="w-full min-w-[320px] border-collapse text-left sm:min-w-[520px]">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="hidden px-4 py-3 sm:table-cell">Type</th>
            <th className="px-3 py-3 sm:px-4">Name</th>
            <th className="hidden px-4 py-3 md:table-cell">Email</th>
            <th className="hidden px-4 py-3 lg:table-cell">Location</th>
            <th className="hidden px-4 py-3 xl:table-cell">Registered</th>
            <th className="hidden px-4 py-3 sm:table-cell">Status</th>
            <th className="whitespace-nowrap px-3 py-3 sm:px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {filteredEntries.map((entry) => {
            const isPending = pendingId === entry.id;
            const isInviteLocked = !canInviteProvider(entry);
            const inviteLabel = providerInviteButtonLabel(entry);
            const isUnread =
              selected?.id !== entry.id &&
              !isResolvedWaitlistStatus(entry.status) &&
              itemSeenVersion >= 0 &&
              isAdminItemUnread("waitlist", entry.id, entry.createdAtIso, entry.updatedAtIso);
            const typeLabel = entry.type === "FACILITY" ? "Facility" : "Family";

            return (
              <tr
                key={entry.id}
                className={cn(
                  "cursor-pointer hover:bg-cream",
                  isUnread && "bg-brand-amber/[0.06] shadow-[inset_3px_0_0_0_var(--brand-amber)]"
                )}
                onClick={() => openEntry(entry)}
              >                <td className="hidden px-4 py-3 text-sm text-neutral-600 sm:table-cell">{typeLabel}</td>
                <td className="min-w-0 max-w-[16rem] px-3 py-3 text-sm sm:px-4">
                  <div className="flex min-w-0 items-start gap-2">
                    {isUnread ? <UnreadDot className="mt-1.5 shrink-0" /> : null}
                    <div className="min-w-0 space-y-1">
                      <strong className="block truncate text-ink">{entry.name}</strong>
                      <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
                        <Badge variant="softMuted">{typeLabel}</Badge>
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none", waitlistStatusClass(entry.status))}>
                          {waitlistStatusLabel(entry.status)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-neutral-500 md:hidden">{entry.email}</p>
                      <p className="font-mono text-[11px] text-neutral-400">Ref {formatReference(entry.id)}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden max-w-[14rem] truncate px-4 py-3 text-sm text-neutral-600 md:table-cell">
                  {entry.email}
                </td>
                <td className="hidden px-4 py-3 text-sm text-neutral-600 lg:table-cell">{entry.location}</td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-neutral-600 xl:table-cell">
                  {entry.createdAt}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none", waitlistStatusClass(entry.status))}>
                    {waitlistStatusLabel(entry.status)}
                  </span>
                </td>
                <td className="px-3 py-3 sm:px-4" onClick={(event) => event.stopPropagation()}>
                  <div className="flex flex-wrap items-center gap-1">
                    <IconActionButton label="Open details" icon={ArrowUpRight} onClick={() => openEntry(entry)} />
                    {entry.type === "FACILITY" ? (
                      <IconActionButton
                        label={isInviteLocked ? inviteLabel : providerInviteButtonLabel(entry)}
                        icon={Building2}
                        loading={pendingInviteId === entry.id}
                        disabled={pendingInviteId === entry.id || isInviteLocked}
                        onClick={() => startProviderInvite(entry)}
                      />
                    ) : null}
                    <IconActionButton
                      label={canMarkContacted(entry) ? "Mark contacted" : `${waitlistStatusLabel(entry.status)}`}
                      icon={Mail}
                      loading={isPending}
                      disabled={!canMarkContacted(entry) || isPending}
                      onClick={() => void markContacted(entry.id, entry.name)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <WaitlistDetailPanel
        entry={selected}
        onClose={() => setSelected(null)}
        onMarkContacted={markContacted}
        onToggleRegistrationVerified={toggleRegistrationVerified}
        onInviteProvider={(entry, notify) => startProviderInvite(entry, notify)}
        pendingId={pendingId}
        pendingInviteId={pendingInviteId}
      />
      <ConfirmDialog
        open={Boolean(confirmInvite)}
        title="Send provider invite?"
        description={
          confirmInvite
            ? `Send a provider onboarding invite to ${confirmInvite.email}? The link expires in 7 days. Attempt ${confirmInvite.providerInviteAttemptsUsed + 1} of 3.`
            : ""
        }
        confirmLabel="Send invite"
        pending={Boolean(confirmInvite && pendingInviteId === confirmInvite.id)}
        onCancel={() => {
          if (pendingInviteId) return;
          setConfirmInvite(null);
        }}
        onConfirm={() => {
          if (!confirmInvite) return;
          void inviteProvider(confirmInvite);
        }}
      />
    </>
  );
}

function WaitlistDetailPanel({
  entry,
  onClose,
  onMarkContacted,
  onToggleRegistrationVerified,
  onInviteProvider,
  pendingId,
  pendingInviteId
}: {
  entry: WaitlistEntry | null;
  onClose: () => void;
  onMarkContacted: (id: string, name: string, notify?: (message: string) => void) => Promise<void>;
  onToggleRegistrationVerified: (
    id: string,
    verified: boolean,
    notify?: (message: string) => void
  ) => Promise<void>;
  onInviteProvider: (entry: WaitlistEntry, notify?: (message: string) => void) => void;
  pendingId: string | null;
  pendingInviteId: string | null;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();
  const canContact = entry?.status === "NEW";
  const canInvite = entry ? canInviteProvider(entry) : false;
  const inviteLabel = entry ? providerInviteButtonLabel(entry) : "Invite provider";
  const isPending = entry ? pendingId === entry.id : false;
  const isInvitePending = entry ? pendingInviteId === entry.id : false;
  const isFamily = entry?.type === "FAMILY";
  const verificationLocked = entry ? isRegistrationVerificationLocked(entry) : false;

  useEffect(() => {
    if (!entry) clearPanelMessage();
  }, [entry, clearPanelMessage]);

  return (
    <SlidePanel
      open={Boolean(entry)}
      onClose={onClose}
      size="xl"
      title={entry?.name || "Waitlist entry"}
      subtitle={entry ? `${entry.type} registration · ${entry.location}` : undefined}
      notice={panelMessage}
      noticeTone={panelNoticeTone(panelMessage)}
    >
      {entry ? (
        <div className="space-y-5">
          <StatusPill className="bg-transparent px-0 py-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="text-xs font-medium text-neutral-500">Type</span>
                <p className="mt-1 font-semibold text-ink">{entry.type}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Status</span>
                <p className="mt-1 font-semibold text-ink">{entry ? waitlistStatusLabel(entry.status) : "—"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Registered</span>
                <p className="mt-1 font-semibold text-ink">{entry.createdAt}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Location</span>
                <p className="mt-1 font-semibold text-ink">{entry.location}</p>
              </div>
            </div>
          </StatusPill>

          <div className="divide-y divide-stone-100 border-t border-stone-100">
            <PanelTopic title="Contact" defaultOpen>
              <DetailList
                columns={1}
                items={[
                  { label: "Contact name", value: entry.contactName },
                  { label: "Email", value: entry.email },
                  { label: "Phone", value: entry.phone }
                ]}
              />
            </PanelTopic>
            <PanelTopic title="Location">
              <DetailList
                columns={1}
                items={[
                  { label: "City", value: entry.city },
                  { label: "Province", value: entry.province },
                  { label: "Full location", value: entry.location }
                ]}
              />
            </PanelTopic>
            {isFamily ? (
              <PanelTopic title="Family context" defaultOpen>
                <DetailList
                  columns={1}
                  items={[
                    { label: "Relationship", value: entry.relationship },
                    { label: "Age range", value: entry.ageRange }
                  ]}
                />
                <div className="mt-2">
                  <p className="text-xs font-medium text-neutral-500">Care types</p>
                  <div className="mt-1.5">
                    <TagList items={entry.careTypes ?? []} />
                  </div>
                </div>
              </PanelTopic>
            ) : (
              <PanelTopic title="Facility details" defaultOpen>
                <DetailList
                  columns={1}
                  items={[
                    { label: "Facility name", value: entry.facilityName },
                    { label: "Facility type", value: entry.facilityType },
                    { label: "KVK / registration", value: entry.registrationNumber },
                    {
                      label: "Registration verified",
                      value: entry.registrationVerified ? "Yes — ready to invite" : "Not verified yet"
                    },
                    { label: "Total beds", value: entry.bedsTotal != null ? String(entry.bedsTotal) : null }
                  ]}
                />
                <div className="mt-2">
                  <p className="text-xs font-medium text-neutral-500">Services</p>
                  <div className="mt-1.5">
                    <TagList items={entry.services ?? []} />
                  </div>
                </div>
                <label className="mt-3 flex items-start gap-3 py-1 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(entry.registrationVerified)}
                    disabled={Boolean(entry.registrationVerified) && verificationLocked}
                    onChange={(event) => {
                      void onToggleRegistrationVerified(entry.id, event.target.checked, setPanelMessage);
                    }}
                  />
                  <span>
                    <span className="font-medium text-ink">Registration verified externally</span>
                    <span className="mt-1 block text-xs text-neutral-500">
                      {entry.registrationVerified && verificationLocked
                        ? "Confirmed. This cannot be undone after contacting or inviting the facility."
                        : entry.registrationVerified
                          ? "Saved. You can untick until you mark contacted or send an invite."
                          : "Confirm the KVK or government ID outside this app before inviting the facility."}
                    </span>
                  </span>
                </label>
              </PanelTopic>
            )}
            <PanelTopic title="Message">
              <p className="text-sm leading-7 text-neutral-700">{entry.message?.trim() || "—"}</p>
            </PanelTopic>
            <PanelTopic title="Record">
              <DetailList
                columns={1}
                items={[
                  { label: "Entry ID", value: entry.id },
                  { label: "Registered", value: entry.createdAt },
                  { label: "Last updated", value: entry.updatedAt },
                  ...(!isFamily
                    ? [
                        {
                          label: "Provider invites",
                          value: `${entry.providerInviteAttemptsUsed} sent · ${entry.providerInviteAttemptsRemaining} remaining`
                        },
                        {
                          label: "Invite status",
                          value: entry.hasActivePendingProviderInvite
                            ? "Pending — waiting for provider to accept"
                            : entry.canSendProviderInvite
                              ? "Ready to send"
                              : entry.providerInviteLockReason || "Not eligible"
                        }
                      ]
                    : [])
                ]}
              />
            </PanelTopic>
          </div>

          <PanelSection title="Quick actions">
            <div className="flex flex-wrap gap-2">
              {entry.email ? (
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${entry.email}`}>Email contact</a>
                </Button>
              ) : null}
              {!isFamily ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isInvitePending || !canInvite}
                  onClick={() => onInviteProvider(entry, setPanelMessage)}
                >
                  {isInvitePending ? "Sending..." : inviteLabel}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(entry.id);
                  setPanelMessage("Entry ID copied.");
                }}
              >
                Copy ID
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" onClick={onClose}>
                Close
              </Button>
              <Button
                className="w-full"
                disabled={!canContact || isPending}
                onClick={() => void onMarkContacted(entry.id, entry.name, setPanelMessage)}
              >
                {isPending ? "Saving..." : canContact ? "Mark contacted" : waitlistStatusLabel(entry.status)}
              </Button>
            </div>
          </PanelSection>
        </div>
      ) : null}
    </SlidePanel>
  );
}

const adminFieldClass = "rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-brand-amber";

function AdminPanelActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

