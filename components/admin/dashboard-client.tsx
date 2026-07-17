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
import { WaitlistBulkEmailBar } from "@/components/admin/waitlist-bulk-email";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { ListSearch } from "@/components/ui/list-search";
import { RefreshButton } from "@/components/ui/refresh-button";
import { UnreadDot } from "@/components/ui/unread-dot";
import { DetailList, PanelSection, PanelTopic, panelNoticeTone, SlidePanel, StatusPill, TagList, usePanelMessage } from "@/components/ui/slide-panel";
import { StatGrid } from "@/components/ui/stat-grid";
import { adminFitLabel, adminMatchScoreBands } from "@/components/ui/match-score";
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
  markAdminInquirySeen,
  markAllAdminInquiriesSeen
} from "@/lib/client/admin-inquiry-seen";
import { initAdminItemsSeenFromData, isAdminItemUnread, markAdminItemSeen } from "@/lib/client/admin-item-seen";
import { CARE_PATHWAYS } from "@/lib/domain/care-pathways";
import { CASE_OUTCOME_OPTIONS } from "@/lib/domain/case-outcomes";
import { getAdminCaseNextAction } from "@/lib/domain/admin-case-next-action";
import {
  adminIntakeActionMeta,
  adminIntakeJourneyHint,
  adminIntakeStatusLabel,
  assessmentComplete,
  canCreateMatches,
  carePlanComplete,
  JOURNEY_STEPS,
  journeyStepIndex,
  nextIntakeActions,
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
import { isRematchableMatchStatus } from "@/lib/domain/match-rematch";
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

function providerAvailableForMatching(providerId: string, matches: InquiryEntry[]) {
  const existing = matches.find((match) => match.providerId === providerId);
  if (!existing) return { available: true, rematch: false };
  if (isRematchableMatchStatus(existing.statusRaw)) return { available: true, rematch: true };
  return { available: false, rematch: false };
}

export function AdminDashboardClient({
  data: initialData,
  currentUserId
}: {
  data: AdminDashboardData;
  currentUserId: string;
}) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<AdminTab>("families");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tabSeenAt, setTabSeenAt] = useState(getTabSeenAt);
  const [itemSeenVersion, setItemSeenVersion] = useState(0);
  const dataRef = useRef(data);
  const intakeSavePendingRef = useRef(false);
  const focusRefetchTimerRef = useRef<number | null>(null);
  dataRef.current = data;

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
      initialData.inquiries.map((inquiry) => ({ id: inquiry.id, updatedAtIso: inquiry.updatedAtIso }))
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
      }))
    ]);
  }, [initialData]);

  useEffect(() => {
    const seen = markTabSeen(tab, dataRef.current);
    setTabSeenAt(seen);
    if (tab === "inquiries") {
      markAllAdminInquiriesSeen(
        dataRef.current.inquiries.map((inquiry) => ({ id: inquiry.id, updatedAtIso: inquiry.updatedAtIso }))
      );
      onMarkItemSeen();
    }
  }, [tab, data, onMarkItemSeen]);

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
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (intakeSavePendingRef.current) return;

      if (focusRefetchTimerRef.current !== null) {
        window.clearTimeout(focusRefetchTimerRef.current);
      }

      focusRefetchTimerRef.current = window.setTimeout(() => {
        focusRefetchTimerRef.current = null;
        if (document.visibilityState !== "visible" || intakeSavePendingRef.current) return;
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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.3rem] font-semibold">Admin dashboard</h1>
          <p className="text-sm text-neutral-500">Shepherds Oud — Netherlands-wide operations</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton onClick={() => void refreshDashboard()} loading={refreshing} />
          <AdminResetDataButton />
        </div>
      </header>

      <StatGrid stats={data.stats} />

      <div className="mt-6 flex w-full gap-1 overflow-x-auto rounded-[10px] bg-white p-1 shadow-soft sm:inline-flex sm:w-auto">
        {(["families", "providers", "inquiries", "waitlist"] as const).map((item) => {
          const label = item === "waitlist" ? "Waitlist" : item[0].toUpperCase() + item.slice(1);
          const badge = tabBadges[item];
          const isActive = tab === item;

          return (
            <button
              key={item}
              onClick={() => selectTab(item)}
              className={cn(
                "relative min-w-fit flex-1 rounded-lg px-4 py-2 text-sm transition sm:flex-none",
                isActive ? "bg-brand-amber text-white" : "text-ink/70 hover:bg-brand-cream hover:text-brand-amber"
              )}
            >
              <span className="inline-flex items-center gap-2">
                {label}
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

      {message ? <div className="mt-4 rounded-lg bg-brand-green-pale/30 px-5 py-4 text-sm text-brand-green-dark">{message}</div> : null}

      {tab === "waitlist" ? (
        <div className="mt-6">
          <WaitlistBulkEmailBar onNotify={setMessage} />
        </div>
      ) : null}

      <div className={cn("rounded-xl bg-white shadow-soft", tab === "waitlist" ? "mt-4" : "mt-6")}>
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
              />
            ) : (
              <EmptyState
                title="No provider follow-up needed"
                description="Visit requests, callback requests, and accepted provider responses will appear here."
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
  onMarkItemSeen
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
      <div className="border-b border-stone-100 px-4 py-3">
        <ListSearch value={search} onChange={setSearch} placeholder="Search families by name, area, care guide, or reference…" />
      </div>
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Family</th>
            <th className="hidden px-4 py-3 sm:table-cell">Care needed</th>
            <th className="hidden px-4 py-3 md:table-cell">Location</th>
            <th className="hidden px-4 py-3 xl:table-cell">Urgency</th>
            <th className="hidden px-4 py-3 xl:table-cell">Care Guide</th>
            <th className="min-w-[8.5rem] whitespace-nowrap px-4 py-3">Status</th>
            <th className="min-w-[9rem] px-4 py-3">Next action</th>
            <th className="whitespace-nowrap px-4 py-3">Actions</th>
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
            return (
              <tr key={family.id} className="cursor-pointer hover:bg-cream" onClick={() => openFamily(family)}>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    {isUnread ? <UnreadDot /> : null}
                    <strong>{family.name}</strong>
                    {family.emergencyStopped ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800">
                        Emergency
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    {family.ageRange ? `Age ${family.ageRange}` : null}
                    <span className="md:hidden">
                      {family.ageRange ? " · " : ""}
                      {family.location}
                    </span>
                  </span>
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
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="inline-flex whitespace-nowrap rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold leading-none text-sage-700">
                    {adminIntakeStatusLabel(family.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex max-w-[11rem] truncate rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
                      nextAction.severity === "action"
                        ? "bg-brand-amber/15 text-brand-amber-dark ring-1 ring-brand-amber/25"
                        : nextAction.severity === "waiting"
                          ? "bg-brand-cream text-ink/70 ring-1 ring-stone-200"
                          : "bg-brand-green-pale/70 text-brand-green-dark"
                    )}
                    title={nextAction.instruction}
                  >
                    {nextAction.label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3" onClick={(event) => event.stopPropagation()}>
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
      />
    </>
  );
}

function FamilyDetailPanel({
  family,
  matches,
  providers,
  careGuides,
  currentUserId,
  onClose,
  onUpdateStatus,
  onPatchIntake,
  onSync,
  pendingId,
  setGlobalMessage
}: {
  family: FamilyEntry | null;
  matches: InquiryEntry[];
  providers: ProviderOption[];
  careGuides: CareGuideOption[];
  currentUserId: string;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    status: IntakeStatus,
    name: string,
    notify?: (message: string) => void,
    expectedUpdatedAt?: string | null
  ) => Promise<void>;
  onPatchIntake: (
    id: string,
    body: Record<string, unknown>,
    name: string,
    successMessage: string,
    notify?: (message: string) => void
  ) => Promise<void>;
  onSync: () => Promise<boolean>;
  pendingId: string | null;
  setGlobalMessage: (message: string) => void;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();
  const previousFamilyIdRef = useRef<string | null>(null);

  function notifyPanel(message: string) {
    setPanelMessage(message);
    setGlobalMessage(message);
  }
  const [providerId, setProviderId] = useState("");
  const [score, setScore] = useState("85");
  const [matchNotes, setMatchNotes] = useState("");
  const [familyFacingReason, setFamilyFacingReason] = useState("");
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [pendingAction, setPendingAction] = useState<IntakeStatus | null>(null);
  const [confirmCloseCase, setConfirmCloseCase] = useState(false);
  const [careGuideId, setCareGuideId] = useState("");
  const [carePathway, setCarePathway] = useState("");
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [carePlanSummary, setCarePlanSummary] = useState("");
  const [visitScheduledAt, setVisitScheduledAt] = useState("");
  const [visitType, setVisitType] = useState<"VISIT" | "CALLBACK" | "">("");
  const [visitProviderName, setVisitProviderName] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [savingVisit, setSavingVisit] = useState(false);
  const [savingCareGuide, setSavingCareGuide] = useState(false);
  const [savingCaseOutcome, setSavingCaseOutcome] = useState(false);
  const [caseOutcome, setCaseOutcome] = useState("");
  const [loadedUpdatedAtIso, setLoadedUpdatedAtIso] = useState<string | null>(null);
  const [staleConflict, setStaleConflict] = useState(false);
  const [refreshingCase, setRefreshingCase] = useState(false);
  const hasUnsavedCaseDraft = family
    ? careGuideId !== (family.careGuideId || "") ||
      carePathway !== (family.carePathway || "") ||
      assessmentNotes !== (family.assessmentNotes || "") ||
      carePlanSummary !== (family.carePlanSummary || "") ||
      visitScheduledAt !== (family.visitScheduledAt ? family.visitScheduledAt.slice(0, 16) : "") ||
      visitType !== ((family.visitType as "VISIT" | "CALLBACK") || "") ||
      visitProviderName !== (family.visitProviderName || "") ||
      visitNotes !== (family.visitNotes || "") ||
      caseOutcome !== (family.caseOutcome || "")
    : false;

  function intakePatchBody(body: Record<string, unknown>) {
    return loadedUpdatedAtIso ? { ...body, expectedUpdatedAt: loadedUpdatedAtIso } : body;
  }

  function handleStaleConflict(error: unknown) {
    if (isIntakeStaleConflictError(error)) {
      setStaleConflict(true);
      return true;
    }
    return false;
  }

  async function refreshCase() {
    setRefreshingCase(true);
    try {
      const ok = await onSync();
      if (ok) {
        setStaleConflict(false);
        clearPanelMessage();
      } else {
        notifyPanel("Could not refresh this case. Try the dashboard Refresh button.");
      }
    } finally {
      setRefreshingCase(false);
    }
  }

  useEffect(() => {
    if (!family) {
      previousFamilyIdRef.current = null;
      setLoadedUpdatedAtIso(null);
      setStaleConflict(false);
      return;
    }

    const isNewCase = previousFamilyIdRef.current !== family.id;
    if (isNewCase) {
      previousFamilyIdRef.current = family.id;
      clearPanelMessage();
      setStaleConflict(false);
      setLoadedUpdatedAtIso(family.updatedAtIso);
    } else if (!staleConflict && !hasUnsavedCaseDraft) {
      setLoadedUpdatedAtIso(family.updatedAtIso);
    }

    if (isNewCase || (!staleConflict && !hasUnsavedCaseDraft)) {
      setCareGuideId(family.careGuideId || "");
      setCarePathway(family.carePathway || "");
      setAssessmentNotes(family.assessmentNotes || "");
      setCarePlanSummary(family.carePlanSummary || "");
      setVisitScheduledAt(family.visitScheduledAt ? family.visitScheduledAt.slice(0, 16) : "");
      setVisitType((family.visitType as "VISIT" | "CALLBACK") || "");
      setVisitProviderName(family.visitProviderName || "");
      setVisitNotes(family.visitNotes || "");
      setCaseOutcome(family.caseOutcome || "");
    }
  }, [family, staleConflict, clearPanelMessage, hasUnsavedCaseDraft]);

  const isCaseActionPending = family ? pendingId === family.id && pendingAction !== null : false;
  const normalizedStatus = family ? normalizeIntakeStatus(family.status) : "NEW";
  const isClosedCase = normalizedStatus === "CLOSED";
  const isReadOnlyAssigned = Boolean(family?.careGuideId) && family?.careGuideId !== currentUserId;
  const canAssignCareGuide = !family?.careGuideId;
  const matchingAllowed =
    family && !isClosedCase && !isReadOnlyAssigned
      ? canCreateMatches(family.status, carePathway || family.carePathway)
      : false;
  const nextAction = family && !isReadOnlyAssigned ? getAdminCaseNextAction(family, matches) : null;
  const hasMatches = matches.length > 0;
  const hasFamilyRequestedMatch = matches.some((match) => match.statusRaw === "VISIT_REQUESTED" || match.statusRaw === "CALLBACK_REQUESTED");
  const hasAcceptedOrContactedMatch = matches.some((match) => match.statusRaw === "ACCEPTED" || match.statusRaw === "CONTACTED" || match.statusRaw === "PLACED");
  const visitSchedulingAllowed =
    !isClosedCase &&
    !isReadOnlyAssigned &&
    (hasFamilyRequestedMatch || hasAcceptedOrContactedMatch || ["VISIT_SCHEDULED", "PROVIDER_RESPONSE", "PLACEMENT_IN_PROGRESS", "PLACED"].includes(normalizedStatus));
  const placementActionAllowed =
    !isClosedCase &&
    !isReadOnlyAssigned &&
    (hasAcceptedOrContactedMatch || ["PROVIDER_RESPONSE", "PLACEMENT_IN_PROGRESS", "PLACED"].includes(normalizedStatus));
  const createMatchDisabledReason = !assessmentComplete({ carePathway: carePathway || family?.carePathway || null })
    ? "Select a care pathway before creating provider matches."
    : !carePlanComplete({ carePlanSummary: carePlanSummary || family?.carePlanSummary || null })
      ? "Publish the care plan summary before creating provider matches."
      : providerId && providers.find((provider) => provider.id === providerId)?.profileComplete === false
        ? "This provider is locked until their facility profile is complete."
      : providerId && providers.find((provider) => provider.id === providerId)?.matchable === false
        ? "Only verified providers can be matched. Update verification status in the Providers tab first."
      : !matchingAllowed
        ? "Move the case to the care-plan stage before creating matches."
        : "";
  const shortlistDisabledReason = !hasMatches ? "Create at least one provider match before marking the shortlist ready." : "";
  const visitDisabledReason = !visitSchedulingAllowed ? "Wait until the family requests a visit/callback or a provider accepts before scheduling." : "";

  async function handleCaseAction(status: IntakeStatus) {
    if (!family || isReadOnlyAssigned) return;
    setPendingAction(status);
    try {
      if (status === "CLOSED") {
        await onPatchIntake(
          family.id,
          intakePatchBody({
            status: "CLOSED",
            ...(caseOutcome ? { caseOutcome } : {})
          }),
          family.name,
          `You closed the case for ${family.name}.`,
          notifyPanel
        );
      } else {
        await onUpdateStatus(family.id, status, family.name, notifyPanel, loadedUpdatedAtIso);
      }
    } catch (error) {
      handleStaleConflict(error);
    } finally {
      setPendingAction(null);
      if (status === "CLOSED") {
        setConfirmCloseCase(false);
      }
    }
  }

  async function saveCaseOutcome() {
    if (!family || isReadOnlyAssigned) return;
    setSavingCaseOutcome(true);
    try {
      await onPatchIntake(
        family.id,
        intakePatchBody({ caseOutcome: caseOutcome || null }),
        family.name,
        caseOutcome
          ? `You set the case outcome for ${family.name}.`
          : `You cleared the case outcome for ${family.name}.`,
        notifyPanel
      );
    } catch (error) {
      handleStaleConflict(error);
    } finally {
      setSavingCaseOutcome(false);
    }
  }

  async function saveCareGuide() {
    if (!family || !careGuideId || isReadOnlyAssigned) return;
    setSavingCareGuide(true);
    try {
      await onPatchIntake(
        family.id,
        intakePatchBody({ careGuideId, ...(family.status === "NEW" ? { status: "CARE_GUIDE_ASSIGNED" } : {}) }),
        family.name,
        `You assigned a Care Guide to ${family.name}.`,
        notifyPanel
      );
    } catch (error) {
      handleStaleConflict(error);
    } finally {
      setSavingCareGuide(false);
    }
  }

  async function saveAndShareWithFamily() {
    if (!family || isReadOnlyAssigned) return;
    if (!carePathway) {
      notifyPanel("Select a recommended care pathway before saving.");
      return;
    }

    if (normalizedStatus === "NEW") {
      notifyPanel("Assign a Care Guide before starting the assessment.");
      return;
    }

    const mode = carePlanButtonMode;
    let nextStatus: IntakeStatus | undefined;
    let successMessage: string;

    if (mode === "publish") {
      nextStatus = "CARE_PLAN";
      successMessage = `You published the care plan for ${family.name}. It is now visible on their dashboard and can still be edited until the case closes.`;
    } else if (mode === "save-assessment" && normalizedStatus === "CARE_GUIDE_ASSIGNED") {
      nextStatus = "ASSESSMENT";
      successMessage = `You saved the assessment for ${family.name}. Add the care plan summary when you are ready to publish.`;
    } else if (mode === "save-care-plan") {
      successMessage = isCarePlanPublished
        ? `You updated the care plan for ${family.name}.`
        : `You saved the care plan draft for ${family.name}. Publish when the family should see it.`;
    } else {
      return;
    }

    setSavingAssessment(true);
    try {
      await onPatchIntake(
        family.id,
        intakePatchBody({
          careGuideId: careGuideId || family.careGuideId || null,
          carePathway,
          assessmentNotes,
          carePlanSummary,
          ...(nextStatus ? { status: nextStatus } : {})
        }),
        family.name,
        successMessage,
        notifyPanel
      );
    } catch (error) {
      handleStaleConflict(error);
    } finally {
      setSavingAssessment(false);
    }
  }

  async function markShortlistReady() {
    if (!family || isReadOnlyAssigned) return;
    if (!carePathway) {
      notifyPanel("Select a care pathway before marking the shortlist ready.");
      return;
    }

    if (!carePlanSummary.trim()) {
      notifyPanel("Publish a care plan summary before marking providers matched.");
      return;
    }

    setSavingAssessment(true);
    try {
      await onPatchIntake(
        family.id,
        intakePatchBody({
          careGuideId: careGuideId || family.careGuideId || null,
          carePathway,
          assessmentNotes,
          carePlanSummary,
          status: "MATCHED"
        }),
        family.name,
        `You marked ${family.name} as matched. They can now view providers on their shortlist.`,
        notifyPanel
      );
    } catch (error) {
      handleStaleConflict(error);
    } finally {
      setSavingAssessment(false);
    }
  }

  async function saveVisitSchedule() {
    if (!family || isReadOnlyAssigned) return;
    if (!visitScheduledAt) {
      notifyPanel("Set a visit or callback date and time before saving.");
      return;
    }

    const canAdvanceToVisitScheduled = ["MATCHED", "VISIT_SCHEDULED"].includes(normalizedStatus);

    setSavingVisit(true);
    try {
      await onPatchIntake(
        family.id,
        intakePatchBody({
          visitScheduledAt: new Date(visitScheduledAt).toISOString(),
          visitType: visitType || null,
          visitProviderName: visitProviderName || null,
          visitNotes: visitNotes || null,
          ...(canAdvanceToVisitScheduled ? { status: "VISIT_SCHEDULED" as const } : {})
        }),
        family.name,
        canAdvanceToVisitScheduled
          ? `You scheduled a visit or callback for ${family.name}. It is now visible on their dashboard.`
          : `You updated visit details for ${family.name}.`,
        notifyPanel
      );
    } catch (error) {
      handleStaleConflict(error);
    } finally {
      setSavingVisit(false);
    }
  }

  async function createMatch() {
    if (!family || !providerId || isReadOnlyAssigned) return;
    if (createMatchDisabledReason) {
      notifyPanel(createMatchDisabledReason);
      return;
    }

    setCreatingMatch(true);
    try {
      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeId: family.id,
          providerId,
          score: Number(score),
          notes: matchNotes || undefined,
          familyFacingReason: familyFacingReason.trim() || undefined
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Could not create match.");
      }

      try {
        await recordAction({
          type: "match_created",
          targetType: "intake",
          targetId: family.id,
          label: `Matched ${family.name} with a provider.`,
          payload: { intakeId: family.id, providerId, score: Number(score) }
        });
      } catch {
        // Action log is optional; the match already succeeded.
      }

      notifyPanel(
        selectedProviderRematch
          ? `You re-opened this provider on ${family.name}'s shortlist. The family can request a visit or callback again.`
          : `You created a provider match for ${family.name}. They can now see this provider on their shortlist.`
      );
      setProviderId("");
      setScore("85");
      setMatchNotes("");
      setFamilyFacingReason("");
      await onSync();
    } catch (error) {
      notifyPanel(error instanceof Error ? error.message : `Could not create match for ${family.name}.`);
    } finally {
      setCreatingMatch(false);
    }
  }

  const nextActions = family
    ? nextIntakeActions(family.status).map((status) => {
        const meta = adminIntakeActionMeta(status);
        return { label: meta.label, status, description: meta.description };
      })
    : [];
  const advanceActions = nextActions.filter((action) => action.status !== "CLOSED");
  const canCloseCase = nextActions.some((action) => action.status === "CLOSED");
  const workflowManagedAdvanceStatuses = new Set<IntakeStatus>([
    "CARE_GUIDE_ASSIGNED",
    "ASSESSMENT",
    "CARE_PLAN",
    "MATCHED",
    "VISIT_SCHEDULED"
  ]);
  const milestoneAdvanceActions = advanceActions.filter((action) => !workflowManagedAdvanceStatuses.has(action.status));
  const currentStepIndex = family ? journeyStepIndex(family.status) : 0;
  const careGuideStepLocked = Boolean(family?.careGuideId) && currentStepIndex >= journeyStepIndex("CARE_GUIDE_ASSIGNED");
  const forwardMatchStatuses = new Set([
    "SUGGESTED",
    "VISIT_REQUESTED",
    "CALLBACK_REQUESTED",
    "ACCEPTED",
    "CONTACTED",
    "PLACED"
  ]);
  const declineRematchMode =
    normalizedStatus === "CARE_PLAN" &&
    matches.some((match) => match.statusRaw === "DECLINED") &&
    !matches.some((match) => forwardMatchStatuses.has(match.statusRaw || ""));
  const selectedProviderRematch = providerId ? providerAvailableForMatching(providerId, matches).rematch : false;
  const assessmentStepLocked =
    !declineRematchMode &&
    carePlanComplete({ carePlanSummary: family?.carePlanSummary }) &&
    currentStepIndex >= journeyStepIndex("CARE_PLAN");
  const visitStepLocked = Boolean(family?.visitScheduledAt) && currentStepIndex >= journeyStepIndex("VISIT_SCHEDULED");
  const advanceStepLocked = currentStepIndex < journeyStepIndex("VISIT_SCHEDULED");
  const publishedCarePlanStatuses = new Set<IntakeStatus>([
    "CARE_PLAN",
    "MATCHED",
    "VISIT_SCHEDULED",
    "PROVIDER_RESPONSE",
    "PLACEMENT_IN_PROGRESS",
    "PLACED",
    "FOLLOW_UP_7",
    "FOLLOW_UP_30",
    "FOLLOW_UP_90"
  ]);
  const isCarePlanPublished = publishedCarePlanStatuses.has(normalizedStatus);
  const isCarePlanDirty =
    carePathway !== (family?.carePathway || "") ||
    assessmentNotes !== (family?.assessmentNotes || "") ||
    carePlanSummary !== (family?.carePlanSummary || "");
  const carePlanButtonMode = (() => {
    if (!isCarePlanPublished) {
      if (!carePlanSummary.trim()) return "save-assessment" as const;
      if (isCarePlanDirty) return "save-care-plan" as const;
      return "publish" as const;
    }
    if (isCarePlanDirty) return "save-care-plan" as const;
    return "published" as const;
  })();
  const visitNotesLabel =
    visitType === "CALLBACK" ? "Callback notes" : visitType === "VISIT" ? "Visit notes" : "Visit or callback notes";
  const visibleJourneySteps = JOURNEY_STEPS;

  return (
    <SlidePanel
      open={Boolean(family)}
      onClose={onClose}
      size="xl"
      title={family?.name || "Family intake"}
      subtitle={
        family
          ? `${family.location} · ${family.urgency}${family.emergencyStopped ? " · Emergency flagged" : ""}`
          : "Care intake details"
      }
      notice={staleConflict ? undefined : panelMessage}
      noticeTone={staleConflict ? "error" : panelNoticeTone(panelMessage)}
    >
      {family ? (
        <div className="space-y-5">
          {family.emergencyStopped ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-950">
              <p className="font-semibold">Emergency screening flagged</p>
              <p className="mt-1 leading-6 text-red-900">
                The family was shown 112 instructions and blocked from the normal care-matching journey. Follow up after confirming
                emergency needs are handled.
              </p>
            </div>
          ) : null}

          {staleConflict ? (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-semibold">{INTAKE_STALE_CONFLICT_MESSAGE}</p>
              <p className="mt-1 leading-6 text-amber-900">
                Your form may be out of date. Refresh to load the latest version before saving again.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-3"
                disabled={refreshingCase}
                onClick={() => void refreshCase()}
              >
                {refreshingCase ? "Refreshing…" : "Refresh case"}
              </Button>
            </div>
          ) : null}

          {isReadOnlyAssigned ? (
            <div className="rounded-lg bg-stone-50 px-4 py-3 text-sm text-ink">
              <p className="font-semibold">
                Read-only — assigned to {family.careGuideName || "another Care Guide"}
              </p>
              <p className="mt-1 leading-6 text-neutral-600">
                You can view this case. Only the assigned Care Guide can edit, advance status, create matches, or schedule visits.
              </p>
            </div>
          ) : null}

          <StatusPill className="bg-transparent px-0 py-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="text-xs font-medium text-neutral-500">Case status</span>
                <p className="mt-1 font-semibold text-ink">{adminIntakeStatusLabel(family.status)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Care Guide</span>
                <p className="mt-1 font-semibold text-ink">{family.careGuideName || "Not assigned"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Urgency</span>
                <p className="mt-1 font-semibold text-ink">{family.urgency}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Location</span>
                <p className="mt-1 font-semibold text-ink">{family.location}</p>
              </div>
            </div>
          </StatusPill>

          <PanelSection
            title={isClosedCase ? "Case archived" : "Case stage"}
            description={
              isClosedCase
                ? "This family case is closed. Workflow steps below are locked — review the summary or case record only."
                : "Current milestone for this family case and what you should do next in this panel."
            }
            collapsible
            defaultOpen
          >
            {isClosedCase ? (
              <p className="text-sm leading-6 text-neutral-600">{adminIntakeJourneyHint(family.status)}</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-ink">
                  Step {Math.min(currentStepIndex + 1, visibleJourneySteps.length)} of {visibleJourneySteps.length} ·{" "}
                  {adminIntakeStatusLabel(family.status)}
                </p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">{adminIntakeJourneyHint(family.status)}</p>
              </>
            )}
          </PanelSection>

          {nextAction && !isClosedCase ? (
            <div
              className={cn(
                "rounded-lg px-4 py-3.5",
                nextAction.severity === "action"
                  ? "bg-brand-amber/10"
                  : nextAction.severity === "waiting"
                    ? "bg-stone-50"
                    : "bg-brand-green-pale/25"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-amber-dark">Do this next</p>
                  <h3 className="mt-1 text-base font-semibold text-ink">{nextAction.label}</h3>
                </div>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-ink">
                  {nextAction.target}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium leading-6 text-ink">{nextAction.instruction}</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">{nextAction.description}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                {nextAction.tab === "inquiries" ? "Go to Inquiries when ready" : "Continue in this family case"}
              </p>
            </div>
          ) : null}

          <PanelSection
            title="Intake details"
            description="Family submission, care needs, decision context, and notes."
            collapsible
            defaultOpen={false}
          >
            <div className="divide-y divide-stone-100">
              <PanelTopic title="Contact" defaultOpen>
                <DetailList
                  columns={1}
                  items={[
                    { label: "Contact name", value: family.name },
                    { label: "Email", value: family.email },
                    { label: "Phone", value: family.phone },
                    { label: "Relationship", value: family.relationship },
                    { label: "Age range", value: family.ageRange },
                    { label: "Preferred area", value: family.location },
                    { label: "Preferred distance", value: family.preferredDistance }
                  ]}
                />
              </PanelTopic>
              <PanelTopic title="Safety & emergency">
                <DetailList
                  columns={1}
                  items={[
                    { label: "Emergency flagged", value: family.emergencyStopped ? "Yes — follow up urgently" : "No" },
                    { label: "Person safe tonight", value: family.personSafeTonight },
                    { label: "Urgent medical help", value: family.urgentMedicalHelp },
                    { label: "Can remain home tonight", value: family.canRemainHomeTonight },
                    { label: "Caregiver burnout risk", value: family.caregiverBurnoutRisk }
                  ]}
                />
                {(family.immediateRiskFlags?.length ?? 0) > 0 ? (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-neutral-500">Immediate risk flags</p>
                    <div className="mt-1.5">
                      <TagList items={family.immediateRiskFlags ?? []} />
                    </div>
                  </div>
                ) : null}
              </PanelTopic>
              <PanelTopic title="Decision support">
                <DetailList
                  columns={1}
                  items={[
                    { label: "Primary decision-maker", value: family.decisionMakerName },
                    { label: "Primary decision-maker role", value: family.decisionMakerRelationship },
                    { label: "Person agreed to search", value: family.seniorAgreedToSearch },
                    { label: "Other participants", value: family.decisionParticipants },
                    { label: "Living situation", value: family.livingSituation },
                    { label: "Move-in timeline", value: family.moveInTimeline },
                    { label: "Consent accepted", value: family.consentAcceptedAt },
                    { label: "Consent version", value: family.consentVersion }
                  ]}
                />
                {(family.decisionMakers?.length ?? 0) > 0 ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs font-medium text-neutral-500">Decision-makers</p>
                    {family.decisionMakers.map((maker) => (
                      <div key={maker.id} className="py-1">
                        <p className="text-sm font-semibold text-ink">
                          {maker.name}
                          <span className="ml-2 font-normal text-neutral-500">· {maker.relationship}</span>
                        </p>
                        {maker.responsibilities.length ? (
                          <div className="mt-1.5">
                            <TagList items={maker.responsibilities} />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </PanelTopic>
              <PanelTopic title="Care needs">
                <DetailList
                  columns={1}
                  items={[
                    { label: "Urgency", value: family.urgency },
                    { label: "Budget", value: family.budget },
                    { label: "Mobility", value: family.mobility },
                    { label: "Medical / nursing support", value: family.medicalSupportNeeds },
                    { label: "Dementia needs", value: family.dementiaNeeds },
                    { label: "Hospital discharge", value: family.hospitalDischargeDate }
                  ]}
                />
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-500">Care types</p>
                    <div className="mt-1.5">
                      <TagList items={family.careTypes?.length ? family.careTypes : family.care.split(",").map((item) => item.trim()).filter(Boolean)} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500">Funding types</p>
                    <div className="mt-1.5">
                      <TagList items={family.fundingTypes ?? []} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500">Functional needs</p>
                    <div className="mt-1.5">
                      <TagList items={family.functionalNeeds ?? []} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500">Placement preferences</p>
                    <div className="mt-1.5">
                      <TagList items={family.placementPreferences ?? []} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500">UI language (emails)</p>
                    <p className="mt-1.5 text-sm font-medium text-ink">
                      {family.preferredLocale === "en" ? "English" : "Dutch"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500">Languages</p>
                    <div className="mt-1.5">
                      <TagList items={family.languages ?? []} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-500">Support needed</p>
                    <div className="mt-1.5">
                      <TagList items={family.supportTypes ?? []} />
                    </div>
                  </div>
                </div>
              </PanelTopic>
              {family.notes?.trim() ? (
                <PanelTopic title="Family notes">
                  <p className="text-sm leading-7 text-neutral-700">{family.notes}</p>
                </PanelTopic>
              ) : null}
            </div>
          </PanelSection>

          {isClosedCase ? (
            <PanelSection
              title="Closed case summary"
              description="This case is archived. Reopen or create a new intake if the family needs more help later."
            >
              <DetailList
                columns={1}
                items={[
                  { label: "Final status", value: adminIntakeStatusLabel(family.status) },
                  { label: "Case outcome", value: family.caseOutcome || "Not recorded" },
                  { label: "Care Guide", value: family.careGuideName || "Not assigned" },
                  { label: "Care pathway", value: family.carePathway },
                  { label: "Last provider", value: family.visitProviderName },
                  { label: "Last updated", value: family.updatedAt }
                ]}
              />
            </PanelSection>
          ) : (
          <div className="space-y-1 border-t border-stone-100 pt-2">
            <PanelSection
              step={2}
              title="Assign Care Guide"
              description="Pick who owns this case."
              completed={careGuideStepLocked && !canAssignCareGuide}
              locked={(careGuideStepLocked && !canAssignCareGuide) || isReadOnlyAssigned}
              collapsible={careGuideStepLocked && !canAssignCareGuide}
              defaultOpen={!(careGuideStepLocked && !canAssignCareGuide)}
            >
              <div className="space-y-3">
                <label className="grid gap-1.5 text-sm font-medium">
                  Care Guide
                  <select
                    value={careGuideId}
                    onChange={(event) => setCareGuideId(event.target.value)}
                    disabled={isReadOnlyAssigned}
                    className={adminFieldClass}
                  >
                    <option value="">Select Care Guide</option>
                    {careGuides.map((guide) => (
                      <option key={guide.id} value={guide.id}>
                        {guide.name || guide.email}
                      </option>
                    ))}
                  </select>
                </label>
                <AdminPanelActions>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!careGuideId || savingCareGuide || isReadOnlyAssigned}
                    onClick={() => void saveCareGuide()}
                  >
                    {savingCareGuide ? "Saving..." : "Assign Care Guide"}
                  </Button>
                </AdminPanelActions>
              </div>
            </PanelSection>

            <PanelSection
              step={3}
              title="Assessment & care plan"
              description="Internal notes stay private; the care plan summary is shared with the family."
              completed={assessmentStepLocked}
              locked={assessmentStepLocked || isReadOnlyAssigned}
              collapsible={assessmentStepLocked}
              defaultOpen={!assessmentStepLocked && !isReadOnlyAssigned}
            >
              <div className="space-y-3">
                <label className="grid gap-1.5 text-sm font-medium">
                  Care pathway
                  <select
                    value={carePathway}
                    onChange={(event) => setCarePathway(event.target.value)}
                    disabled={isReadOnlyAssigned}
                    className={adminFieldClass}
                  >
                    <option value="">Select pathway</option>
                    {CARE_PATHWAYS.map((pathway) => (
                      <option key={pathway} value={pathway}>
                        {pathway}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Assessment notes (internal)
                  <textarea
                    value={assessmentNotes}
                    onChange={(event) => setAssessmentNotes(event.target.value)}
                    disabled={isReadOnlyAssigned}
                    className={`${adminFieldClass} min-h-20`}
                    placeholder="Situation, decision-makers, funding…"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Care plan summary (family-facing)
                  <div
                    className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950"
                    role="note"
                  >
                    {family.preferredLocale === "en" ? (
                      <>
                        This family uses <strong>English</strong> in the app and emails. Write the care plan summary in
                        English — free text is <strong>not</strong> auto-translated.
                      </>
                    ) : (
                      <>
                        This family uses <strong>Dutch</strong> in the app and emails. Write the care plan summary in{" "}
                        <strong>Nederlands</strong> — free text is <strong>not</strong> auto-translated.
                      </>
                    )}
                  </div>
                  <textarea
                    value={carePlanSummary}
                    onChange={(event) => setCarePlanSummary(event.target.value)}
                    disabled={isReadOnlyAssigned}
                    className={`${adminFieldClass} min-h-20`}
                    placeholder={
                      family.preferredLocale === "en"
                        ? "What the family should see next, in English…"
                        : "Wat de familie nu moet weten, in het Nederlands…"
                    }
                  />
                </label>
                <AdminPanelActions>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isReadOnlyAssigned || savingAssessment || carePlanButtonMode === "published"}
                    onClick={() => void saveAndShareWithFamily()}
                  >
                    {savingAssessment
                      ? "Saving..."
                      : carePlanButtonMode === "save-assessment"
                        ? "Save assessment"
                        : carePlanButtonMode === "save-care-plan"
                          ? "Save care plan"
                          : carePlanButtonMode === "publish"
                            ? "Publish care plan"
                            : "Care plan published"}
                  </Button>
                  {!["MATCHED", "VISIT_SCHEDULED", "PROVIDER_RESPONSE", "PLACEMENT_IN_PROGRESS", "PLACED", "CLOSED"].includes(normalizedStatus) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        isReadOnlyAssigned ||
                        savingAssessment ||
                        !carePlanSummary.trim() ||
                        Boolean(shortlistDisabledReason)
                      }
                      onClick={() => void markShortlistReady()}
                    >
                      Mark shortlist ready
                    </Button>
                  ) : null}
                </AdminPanelActions>
                {shortlistDisabledReason ? <p className="text-xs leading-5 text-neutral-500">{shortlistDisabledReason}</p> : null}
              </div>
            </PanelSection>

            <PanelSection
              step={4}
              title="Create provider match"
              description="Add a provider to the family shortlist. Saved matches appear below."
              locked={isReadOnlyAssigned}
              lockedNote="Only the assigned Care Guide can create matches."
            >
              <div className="space-y-3">
                <label className="grid gap-1.5 text-sm font-medium">
                  Provider
                  <select
                    value={providerId}
                    onChange={(event) => setProviderId(event.target.value)}
                    disabled={!matchingAllowed}
                    className={adminFieldClass}
                  >
                    <option value="">Select provider</option>
                    {providers
                      .filter((provider) => providerAvailableForMatching(provider.id, matches).available)
                      .map((provider) => {
                        const rematch = providerAvailableForMatching(provider.id, matches).rematch;
                        return (
                          <option key={provider.id} value={provider.id}>
                            {provider.name} - {provider.area}
                            {rematch
                              ? " (re-open)"
                              : !provider.profileComplete
                                ? " (locked)"
                                : !provider.matchable
                                  ? " (not verified)"
                                  : ""}
                          </option>
                        );
                      })}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Match score (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    disabled={!matchingAllowed}
                    onChange={(event) => setScore(event.target.value)}
                    className={adminFieldClass}
                  />
                  <MatchScoreGuidance score={score} />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Why this match (shown to family)
                  <textarea
                    value={familyFacingReason}
                    disabled={!matchingAllowed}
                    onChange={(event) => setFamilyFacingReason(event.target.value)}
                    placeholder="e.g. Strong dementia care and open bed nearby"
                    className={`${adminFieldClass} min-h-16`}
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Internal notes (optional)
                  <textarea
                    value={matchNotes}
                    disabled={!matchingAllowed}
                    onChange={(event) => setMatchNotes(event.target.value)}
                    className={`${adminFieldClass} min-h-16`}
                  />
                </label>
                <AdminPanelActions>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!providerId || creatingMatch || Boolean(createMatchDisabledReason)}
                    onClick={() => void createMatch()}
                  >
                    {creatingMatch ? "Saving..." : selectedProviderRematch ? "Re-open match" : "Create match"}
                  </Button>
                </AdminPanelActions>
                {createMatchDisabledReason ? <p className="text-xs leading-5 text-neutral-500">{createMatchDisabledReason}</p> : null}

                <div className="mt-4 border-t border-stone-200 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Shortlist{hasMatches ? ` · ${matches.length}` : ""}
                  </p>
                  {hasMatches ? (
                    <div className="mt-1 divide-y divide-stone-100">
                      {matches.map((match) => (
                        <SavedProviderMatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-500">No providers matched yet.</p>
                  )}
                </div>
              </div>
            </PanelSection>

            <PanelSection
              step={5}
              title="Schedule visit or callback"
              description="Shown on the family dashboard."
              completed={visitStepLocked}
              locked={visitStepLocked || isReadOnlyAssigned}
              collapsible={visitStepLocked}
              defaultOpen={!visitStepLocked && !isReadOnlyAssigned}
            >
              <div className="space-y-3">
                <label className="grid gap-1.5 text-sm font-medium">
                  Date & time
                  <input
                    type="datetime-local"
                    value={visitScheduledAt}
                    disabled={!visitSchedulingAllowed}
                    onChange={(event) => setVisitScheduledAt(event.target.value)}
                    className={adminFieldClass}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Type
                    <select
                      value={visitType}
                      disabled={!visitSchedulingAllowed}
                      onChange={(event) => setVisitType(event.target.value as "VISIT" | "CALLBACK" | "")}
                      className={adminFieldClass}
                    >
                      <option value="">Select type</option>
                      <option value="VISIT">Facility visit</option>
                      <option value="CALLBACK">Phone callback</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Provider / facility
                    <input
                      value={visitProviderName}
                      disabled={!visitSchedulingAllowed}
                      onChange={(event) => setVisitProviderName(event.target.value)}
                      className={adminFieldClass}
                      placeholder="Provider name"
                    />
                  </label>
                </div>
                <label className="grid gap-1.5 text-sm font-medium">
                  {visitNotesLabel}
                  <textarea
                    value={visitNotes}
                    disabled={!visitSchedulingAllowed}
                    onChange={(event) => setVisitNotes(event.target.value)}
                    className={`${adminFieldClass} min-h-16`}
                    placeholder={
                      visitType === "CALLBACK"
                        ? "Best time to call, who to ask for…"
                        : "Directions, contact person…"
                    }
                  />
                </label>
                <AdminPanelActions>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingVisit || !visitScheduledAt || !visitSchedulingAllowed}
                    onClick={() => void saveVisitSchedule()}
                  >
                    {savingVisit
                      ? "Saving..."
                      : ["MATCHED", "VISIT_SCHEDULED"].includes(normalizedStatus)
                        ? "Save & mark scheduled"
                        : "Update visit details"}
                  </Button>
                </AdminPanelActions>
                {visitDisabledReason ? <p className="text-xs leading-5 text-neutral-500">{visitDisabledReason}</p> : null}
              </div>
            </PanelSection>

            <PanelSection
              step={6}
              title="Advance case status"
              description="Placement milestones and follow-up."
              locked={advanceStepLocked || isReadOnlyAssigned}
              lockedNote={
                isReadOnlyAssigned
                  ? "Only the assigned Care Guide can advance this case."
                  : "Finish visit scheduling before advancing placement."
              }
              collapsible={advanceStepLocked}
              defaultOpen={!advanceStepLocked && !isReadOnlyAssigned}
            >
              <div className="space-y-3">
                {milestoneAdvanceActions.length ? (
                  milestoneAdvanceActions.map((action) => {
                    const disabledReason =
                      isReadOnlyAssigned
                        ? "Only the assigned Care Guide can advance this case."
                        : action.status === "VISIT_SCHEDULED" && !visitSchedulingAllowed
                          ? "Wait until the family requests a visit/callback or a provider accepts."
                          : (action.status === "PLACEMENT_IN_PROGRESS" || action.status === "PLACED") && !placementActionAllowed
                            ? "Coordinate with an accepted provider first."
                            : "";

                    return (
                      <div key={action.status} className="flex flex-wrap items-center gap-3">
                        <Button
                          size="sm"
                          disabled={isCaseActionPending || Boolean(disabledReason)}
                          onClick={() => void handleCaseAction(action.status)}
                        >
                          {isCaseActionPending && pendingAction === action.status ? "Saving..." : action.label}
                        </Button>
                        <p className="text-xs leading-5 text-neutral-500">{disabledReason || action.description}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm leading-6 text-neutral-600">Milestones appear here after visit scheduling.</p>
                )}
              </div>
            </PanelSection>

            {!isReadOnlyAssigned ? (
              <PanelSection title="Case outcome" description="Why the case is ending or pausing." collapsible defaultOpen={canCloseCase}>
                <div className="space-y-3">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Outcome
                    <select
                      value={caseOutcome}
                      onChange={(event) => setCaseOutcome(event.target.value)}
                      className={adminFieldClass}
                    >
                      <option value="">Select outcome</option>
                      {CASE_OUTCOME_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <AdminPanelActions>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={savingCaseOutcome || caseOutcome === (family.caseOutcome || "")}
                      onClick={() => void saveCaseOutcome()}
                    >
                      {savingCaseOutcome ? "Saving..." : "Save outcome"}
                    </Button>
                  </AdminPanelActions>
                </div>
              </PanelSection>
            ) : null}

            {canCloseCase && !isReadOnlyAssigned ? (
              <PanelSection title="Close family case" description="Ends the whole family journey.">
                <AdminPanelActions>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isCaseActionPending}
                    onClick={() => setConfirmCloseCase(true)}
                  >
                    Close family case
                  </Button>
                </AdminPanelActions>
              </PanelSection>
            ) : null}
          </div>
          )}

          <PanelSection title="Case record">
            <DetailList
              columns={1}
              items={[
                { label: "Reference", value: formatReference(family.id) },
                { label: "Intake ID", value: family.id },
                { label: "Case outcome", value: family.caseOutcome },
                { label: "Consent accepted", value: family.consentAcceptedAt },
                { label: "Consent version", value: family.consentVersion },
                { label: "Care pathway", value: family.carePathway },
                { label: "Visit scheduled", value: family.visitScheduledAtLabel },
                { label: "Visit type", value: family.visitType },
                { label: "Visit provider", value: family.visitProviderName },
                { label: "7-day follow-up", value: family.followUp7At },
                { label: "30-day follow-up", value: family.followUp30At },
                { label: "90-day follow-up", value: family.followUp90At },
                { label: "Submitted", value: family.createdAt },
                { label: "Last updated", value: family.updatedAt }
              ]}
            />
          </PanelSection>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmCloseCase}
        tone="danger"
        pending={isCaseActionPending && pendingAction === "CLOSED"}
        title="Close this family case?"
        description={
          caseOutcome
            ? `This closes the entire family journey with outcome “${caseOutcome}”. The family dashboard shows the case as archived and provider matching stops.`
            : "This closes the entire family journey — their dashboard shows the case as archived and provider matching stops. Consider selecting a case outcome before confirming."
        }
        confirmLabel="Close family case"
        onCancel={() => setConfirmCloseCase(false)}
        onConfirm={() => void handleCaseAction("CLOSED")}
      />
    </SlidePanel>
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
      <div className="border-b border-stone-100 px-4 py-3">
        <ListSearch value={search} onChange={setSearch} placeholder="Search providers by name, area, availability, or reference…" />
      </div>
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Area</th>
            <th className="px-4 py-3">Availability</th>
            <th className="px-4 py-3">Beds open</th>
            <th className="px-4 py-3">Actions</th>
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
            <tr key={provider.id} className="cursor-pointer hover:bg-cream" onClick={() => openProvider(provider)}>
              <td className="px-4 py-3 text-sm font-semibold">
                <div className="flex flex-wrap items-center gap-2">
                  {isUnread ? <UnreadDot /> : null}
                  <span>{provider.name}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
                      provider.profileComplete
                        ? "bg-brand-green-pale/70 text-brand-green-dark"
                        : "bg-brand-amber/15 text-brand-amber-dark ring-1 ring-brand-amber/25"
                    )}
                  >
                    {provider.profileComplete ? "Active" : "Provider locked"}
                  </span>
                  <Badge variant={providerVerificationBadgeVariant(provider.verificationStatus)}>
                    {provider.verificationLabel || providerVerificationLabel(provider.verificationStatus)}
                  </Badge>
                </div>
                <span className="mt-1 block font-mono text-[11px] font-normal text-neutral-400">Ref {formatReference(provider.id)}</span>
                {!provider.profileComplete ? (
                  <span className="mt-1 block text-xs font-normal text-neutral-500">
                    Provider locked until profile is complete
                  </span>
                ) : !provider.matchable ? (
                  <span className="mt-1 block text-xs font-normal text-neutral-500">
                    Not matchable until verification reaches Verified or later
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-600">{provider.type}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">{provider.area}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">{availability}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">
                {provider.bedsOpen ?? "—"}
                {provider.bedsTotal ? ` / ${provider.bedsTotal}` : ""}
              </td>
              <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
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
                  { label: "Website", value: provider.website }
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

function formatAdminMatchScore(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "—";
  return trimmed.endsWith("%") ? trimmed : `${trimmed}%`;
}

function parseAdminMatchScore(value: string) {
  const numeric = Number(value.replace("%", "").trim());
  return Number.isFinite(numeric) ? numeric : null;
}

function SavedProviderMatchCard({ match }: { match: InquiryEntry }) {
  const scoreValue = parseAdminMatchScore(match.match);
  const notes = adminMatchNotes(match.notes);
  const rematchable = isRematchableMatchStatus(match.statusRaw);

  return (
    <div className="flex flex-wrap items-start justify-between gap-2 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink break-words">{match.provider}</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {formatAdminMatchScore(match.match)}
          {scoreValue != null ? ` · ${adminFitLabel(scoreValue)}` : ""}
          {` · ${match.updatedAt}`}
          {rematchable ? " · can re-open" : ""}
        </p>
        {notes ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-600">{notes}</p> : null}
        {match.declineReason ? (
          <p className="mt-1 text-xs leading-5 text-neutral-600">Declined: {match.declineReason}</p>
        ) : null}
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
          matchStatusBadgeClass(match.statusRaw || "SUGGESTED")
        )}
      >
        {adminMatchStatusLabel(match.statusRaw || "SUGGESTED")}
      </span>
    </div>
  );
}

function MatchScoreGuidance({ score }: { score: string }) {
  const numericScore = Number(score);
  const validScore = Number.isFinite(numericScore) && numericScore >= 0 && numericScore <= 100;

  if (!validScore) {
    return <p className="text-xs text-neutral-500">0–100. {adminMatchScoreBands()}</p>;
  }

  return <p className="text-xs font-medium text-brand-green-dark">{adminFitLabel(numericScore)}</p>;
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
  onMarkItemSeen
}: {
  inquiries: InquiryEntry[];
  currentUserId: string;
  setMessage: (message: string) => void;
  onSync: () => Promise<boolean>;
  itemSeenVersion: number;
  onMarkItemSeen: () => void;
}) {
  const [rows, setRows] = useState(inquiries);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<InquiryEntry | null>(null);
  const [confirmClose, setConfirmClose] = useState<InquiryEntry | null>(null);
  const [confirmContacted, setConfirmContacted] = useState<InquiryEntry | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState("");

  function openInquiry(inquiry: InquiryEntry) {
    markAdminInquirySeen(inquiry.id, inquiry.updatedAtIso);
    onMarkItemSeen();
    setSelected(inquiry);
  }

  useEffect(() => {
    setRows(inquiries);
    setSelected((current) => {
      if (!current) return null;
      const fresh = inquiries.find((item) => item.id === current.id) ?? null;
      if (fresh) {
        markAdminInquirySeen(fresh.id, fresh.updatedAtIso);
        onMarkItemSeen();
      }
      return fresh;
    });
  }, [inquiries, onMarkItemSeen]);

  const visibleRows = useMemo(
    () => (showHistory ? rows : rows.filter((item) => inquiryCoordinationStatuses.has(item.statusRaw))),
    [rows, showHistory]
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
  const followUpCount = visibleRows.filter((item) => isAdminActionNeeded(item.statusRaw) || item.statusRaw === "CONTACTED").length;

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">{showHistory ? "All provider match records" : "Provider follow-up queue"}</p>
          <p className="text-xs leading-5 text-neutral-500">
            {showHistory
              ? "Showing every match record, including suggested matches and closed history."
              : "Only showing matches that need provider or Care Guide follow-up."}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setShowHistory((current) => !current)}>
          {showHistory ? "Back to follow-up queue" : "Show all matches"}
        </Button>
      </div>

      {followUpCount ? (
        <div className="flex items-center gap-2.5 border-b border-brand-amber/15 bg-brand-amber/5 px-4 py-2.5 text-sm text-brand-amber-dark">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-amber text-xs font-bold text-white">
            {followUpCount}
          </span>
          <span>
            {followUpCount === 1 ? "Inquiry needs" : "Inquiries need"} your follow-up — open a row for the step-by-step guide.
          </span>
        </div>
      ) : null}

      <div className="border-b border-stone-100 px-4 py-3">
        <ListSearch
          value={search}
          onChange={setSearch}
          placeholder="Search inquiries by family, provider, phone, or reference…"
        />
      </div>

      {!sortedInquiries.length ? (
        <EmptyState
          title={showHistory ? "No inquiries yet" : "No provider follow-up needed"}
          description={
            showHistory
              ? "When families are matched to providers, those records will show here."
              : "Visit requests, callback requests, and accepted provider responses will appear here."
          }
        />
      ) : (

      <table className="w-full min-w-[980px] border-collapse text-left">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Family</th>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Match</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
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
              isAdminInquiryUnread(inquiry.id, inquiry.updatedAtIso);

            return (
              <tr
                key={inquiry.id}
                className={`cursor-pointer hover:bg-cream ${needsFollowUp ? "bg-brand-amber/5" : ""}`}
                onClick={() => openInquiry(inquiry)}
              >
                <td className="px-4 py-3 text-sm text-neutral-700">
                  <div className="flex items-center gap-2">
                    {isUnread ? <UnreadDot /> : null}
                    <span>{inquiry.family}</span>
                  </div>
                  <span className="mt-1 block font-mono text-[11px] text-neutral-400">
                    Ref {formatReference(inquiry.intakeId)}
                  </span>
                  {readOnly ? (
                    <span className="mt-1 block text-[11px] text-neutral-500">
                      Read-only · {inquiry.careGuideName || "another Care Guide"}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-700">{inquiry.provider}</td>
                <td className="px-4 py-3 text-sm font-semibold text-sage-700">{inquiry.match}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{inquiry.updatedAt}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${matchStatusBadgeClass(inquiry.statusRaw)}`}>
                    {adminMatchStatusLabel(inquiry.statusRaw)}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
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
  const hint = inquiry ? adminInquiryHint(inquiry.statusRaw) : "";

  useEffect(() => {
    if (!inquiry) clearPanelMessage();
  }, [inquiry, clearPanelMessage]);

  async function updateFromPanel(id: string, status: MatchStatus) {
    await onUpdateStatus(id, status, setPanelMessage);
  }

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
      subtitle={inquiry ? `${inquiry.provider} · ${adminMatchStatusLabel(inquiry.statusRaw)}` : "Match details"}
      notice={panelMessage}
      noticeTone={panelNoticeTone(panelMessage)}
    >
      {inquiry ? (
        <div className="space-y-5">
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

          <StatusPill className={cn("px-3 py-2 text-sm", matchStatusBadgeClass(inquiry.statusRaw))}>{hint}</StatusPill>

          <PanelSection title="Inquiry flow" collapsible defaultOpen={false}>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-neutral-600">
              <li>Create a match — family sees the provider on their shortlist.</li>
              <li>Family requests a visit or callback.</li>
              <li>Provider accepts or declines.</li>
              <li>Mark the visit or call as arranged after timing is agreed.</li>
              <li>Record the chosen provider when the family commits.</li>
              <li>Close the provider match only if it was never used or the provider declined.</li>
            </ol>
          </PanelSection>

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

          {!isReadOnly ? (
            <div className="space-y-4 border-t border-stone-100 pt-4">
              {(inquiry.statusRaw === "VISIT_REQUESTED" ||
                inquiry.statusRaw === "CALLBACK_REQUESTED" ||
                inquiry.statusRaw === "ACCEPTED") && (
                <PanelSection title={adminInquiryActionMeta("CONTACTED").label} description={adminInquiryActionMeta("CONTACTED").description}>
                  <Button size="sm" disabled={isPending} onClick={() => setConfirmContacted(true)}>
                    {pendingActionKey === `${inquiry.id}:CONTACTED` ? "Saving..." : "Confirm"}
                  </Button>
                </PanelSection>
              )}
              {inquiry.statusRaw !== "PLACED" && inquiry.statusRaw !== "CLOSED" ? (
                <PanelSection title={adminInquiryActionMeta("PLACED").label} description={adminInquiryActionMeta("PLACED").description}>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending || !(inquiry.statusRaw === "ACCEPTED" || inquiry.statusRaw === "CONTACTED")}
                    onClick={() => void updateFromPanel(inquiry.id, "PLACED")}
                  >
                    {pendingActionKey === `${inquiry.id}:PLACED` ? "Saving..." : "Confirm"}
                  </Button>
                  {inquiry.statusRaw === "ACCEPTED" || inquiry.statusRaw === "CONTACTED" ? null : (
                    <p className="mt-2 text-xs leading-5 text-neutral-500">Arrange the visit or call before recording the chosen provider.</p>
                  )}
                </PanelSection>
              ) : null}
              {canAdminCloseProviderMatch(inquiry.statusRaw) ? (
                <PanelSection title={adminInquiryActionMeta("CLOSED").label} description={adminInquiryActionMeta("CLOSED").description}>
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => setConfirmClose(true)}>
                    {pendingActionKey === `${inquiry.id}:CLOSED` ? "Saving..." : "Confirm"}
                  </Button>
                </PanelSection>
              ) : null}
            </div>
          ) : null}
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
    setPendingId(id);
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

      const patch = (item: WaitlistEntry): WaitlistEntry =>
        item.id === id
          ? {
              ...item,
              registrationVerified: Boolean(result.registrationVerified ?? verified),
              canSendProviderInvite: Boolean(result.canSendProviderInvite),
              providerInviteAttemptsUsed:
                result.providerInviteAttemptsUsed ?? item.providerInviteAttemptsUsed,
              providerInviteAttemptsRemaining:
                result.providerInviteAttemptsRemaining ?? item.providerInviteAttemptsRemaining,
              hasActivePendingProviderInvite:
                result.hasActivePendingProviderInvite ?? item.hasActivePendingProviderInvite,
              providerInviteLockReason: result.providerInviteLockReason ?? null,
              updatedAtIso,
              updatedAt: new Date(updatedAtIso).toLocaleDateString("en-GB")
            }
          : item;

      setEntries((current) => current.map(patch));
      setSelected((current) => (current ? patch(current) : current));
      notify(
        verified
          ? "Registration marked as verified. You can invite this provider."
          : "Registration verification cleared."
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update registration verification.");
    } finally {
      setPendingId(null);
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
      <div className="border-b border-stone-100 px-4 py-3">
        <ListSearch value={search} onChange={setSearch} placeholder="Search waitlist by name, email, location, or reference…" />
      </div>
      <table className="w-full min-w-[980px] border-collapse text-left">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Registered</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
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

            return (
              <tr key={entry.id} className="cursor-pointer hover:bg-cream" onClick={() => openEntry(entry)}>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.type === "FACILITY" ? "Facility" : "Family"}</td>
                <td className="px-4 py-3 text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    {isUnread ? <UnreadDot /> : null}
                    <span>{entry.name}</span>
                  </div>
                  <span className="mt-1 block font-mono text-[11px] font-normal text-neutral-400">Ref {formatReference(entry.id)}</span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.email}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.location}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.createdAt}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-medium", waitlistStatusClass(entry.status))}>
                    {waitlistStatusLabel(entry.status)}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center gap-1">
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
                    disabled={isPending}
                    onChange={(event) =>
                      void onToggleRegistrationVerified(entry.id, event.target.checked, setPanelMessage)
                    }
                  />
                  <span>
                    <span className="font-medium text-ink">Registration verified externally</span>
                    <span className="mt-1 block text-xs text-neutral-500">
                      Confirm the KVK or government ID outside this app before inviting the facility.
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

