"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  CalendarCheck,
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
import { RefreshButton } from "@/components/ui/refresh-button";
import { DetailList, PanelSection, panelNoticeTone, SlidePanel, StatusPill, TagList, usePanelMessage } from "@/components/ui/slide-panel";
import { StatGrid } from "@/components/ui/stat-grid";
import type { AdminDashboardData } from "@/lib/data/admin";
import { recordAction } from "@/lib/client/actions";
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
import { CARE_PATHWAYS } from "@/lib/domain/care-pathways";
import { getAdminCaseNextAction } from "@/lib/domain/admin-case-next-action";
import {
  adminIntakeActionMeta,
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
  adminMatchStatusLabel,
  compareMatchPriority,
  isAdminActionNeeded,
  matchStatusBadgeClass
} from "@/lib/domain/match-status";

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

function groupInquiriesByIntake(inquiries: InquiryEntry[]) {
  const grouped = new Map<string, InquiryEntry[]>();
  for (const inquiry of inquiries) {
    const current = grouped.get(inquiry.intakeId) ?? [];
    current.push(inquiry);
    grouped.set(inquiry.intakeId, current);
  }
  return grouped;
}

export function AdminDashboardClient({ data: initialData }: { data: AdminDashboardData }) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<AdminTab>("families");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tabSeenAt, setTabSeenAt] = useState(getTabSeenAt);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    initTabSeenFromData(initialData);
  }, [initialData]);

  useEffect(() => {
    const seen = markTabSeen(tab, data);
    setTabSeenAt(seen);
  }, [tab, data]);

  const tabBadges = useMemo(
    () => ({
      families: countUnseenFamilies(data.families, tabSeenAt.families),
      providers: countUnseenProviders(data.providerList, tabSeenAt.providers),
      inquiries: countUnseenInquiries(data.inquiries, tabSeenAt.inquiries),
      waitlist: countUnseenWaitlist(data.waitlist, tabSeenAt.waitlist)
    }),
    [data, tabSeenAt]
  );

  function selectTab(next: AdminTab) {
    setTab(next);
  }

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

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
                setMessage={setMessage}
                onSync={syncDashboard}
              />
            ) : (
              <EmptyState title="No family intakes yet" description="New submissions from the intake form will appear here." />
            )
          ) : null}

          {tab === "providers" ? (
            data.providerList.length ? (
              <ProvidersTable providers={data.providerList} />
            ) : (
              <EmptyState title="No active providers yet" description="Providers appear here after invitation acceptance or profile creation." />
            )
          ) : null}

          {tab === "inquiries" ? (
            data.inquiries.length ? (
              <InquiriesTable inquiries={data.inquiries} setMessage={setMessage} onSync={syncDashboard} />
            ) : (
              <EmptyState
                title="No provider follow-up needed"
                description="Visit requests, callback requests, and accepted provider responses will appear here."
              />
            )
          ) : null}

          {tab === "waitlist" ? (
            data.waitlist.length ? (
              <WaitlistTable entries={data.waitlist} setMessage={setMessage} />
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
  setMessage,
  onSync
}: {
  families: FamilyEntry[];
  inquiries: InquiryEntry[];
  providers: ProviderOption[];
  careGuides: CareGuideOption[];
  setMessage: (message: string) => void;
  onSync: () => Promise<boolean>;
}) {
  const [rows, setRows] = useState(families);
  const [selected, setSelected] = useState<FamilyEntry | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const matchesByIntakeId = useMemo(() => groupInquiriesByIntake(inquiries), [inquiries]);

  useEffect(() => {
    setRows(families);
    setSelected((current) => {
      if (!current) return null;
      return families.find((family) => family.id === current.id) ?? null;
    });
  }, [families]);

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
                ...(body.carePlanSummary !== undefined ? { carePlanSummary: body.carePlanSummary as string } : {})
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
          ...(body.carePlanSummary !== undefined ? { carePlanSummary: body.carePlanSummary as string } : {})
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
      notify(error instanceof Error ? error.message : `Could not update ${name}. Please try again.`);
    } finally {
      setPendingId(null);
    }
  }

  async function updateStatus(id: string, status: IntakeStatus, name: string, notify?: (message: string) => void) {
    await patchIntake(
      id,
      { status },
      name,
      `${name} marked as ${adminIntakeStatusLabel(status).toLowerCase()}.`,
      notify
    );
  }

  return (
    <>
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Family</th>
            <th className="hidden px-4 py-3 sm:table-cell">Care needed</th>
            <th className="hidden px-4 py-3 md:table-cell">Location</th>
            <th className="hidden px-4 py-3 lg:table-cell">Urgency</th>
            <th className="hidden px-4 py-3 lg:table-cell">Care Guide</th>
            <th className="min-w-[8.5rem] whitespace-nowrap px-4 py-3">Status</th>
            <th className="min-w-[15rem] px-4 py-3">Next action</th>
            <th className="whitespace-nowrap px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {rows.map((family) => {
            const isPending = pendingId === family.id;
            const assignMeta = adminIntakeActionMeta("CARE_GUIDE_ASSIGNED");
            const nextAction = getAdminCaseNextAction(family, matchesByIntakeId.get(family.id) ?? []);
            return (
              <tr key={family.id} className="cursor-pointer hover:bg-cream" onClick={() => setSelected(family)}>
                <td className="px-4 py-3 text-sm">
                  <strong>{family.name}</strong>
                  <span className="block text-xs text-neutral-500">{family.context}</span>
                  <span className="mt-1 block text-xs text-neutral-500 sm:hidden">{family.location}</span>
                </td>
                <td className="hidden px-4 py-3 text-sm text-neutral-600 sm:table-cell">{family.care}</td>
                <td className="hidden px-4 py-3 text-sm text-neutral-600 md:table-cell">{family.location}</td>
                <td className="hidden px-4 py-3 text-sm text-neutral-600 lg:table-cell">{family.urgency}</td>
                <td className="hidden px-4 py-3 text-sm text-neutral-600 lg:table-cell">{family.careGuideName || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="inline-flex whitespace-nowrap rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold leading-none text-sage-700">
                    {adminIntakeStatusLabel(family.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-[17rem]">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
                        nextAction.severity === "action"
                          ? "bg-brand-amber/15 text-brand-amber-dark ring-1 ring-brand-amber/25"
                          : nextAction.severity === "waiting"
                            ? "bg-brand-cream text-ink/70 ring-1 ring-stone-200"
                            : "bg-brand-green-pale/70 text-brand-green-dark"
                      )}
                    >
                      {nextAction.label}
                    </span>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">{nextAction.description}</p>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {family.status === "NEW" ? (
                      <IconActionButton
                        label={assignMeta.label}
                        icon={ClipboardList}
                        loading={isPending}
                        disabled={isPending}
                        onClick={() => setSelected(family)}
                      />
                    ) : (
                      <IconActionButton label="Open details" icon={ArrowUpRight} onClick={() => setSelected(family)} />
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
  onClose: () => void;
  onUpdateStatus: (id: string, status: IntakeStatus, name: string, notify?: (message: string) => void) => Promise<void>;
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

  useEffect(() => {
    if (!family) {
      previousFamilyIdRef.current = null;
      return;
    }

    if (previousFamilyIdRef.current !== family.id) {
      previousFamilyIdRef.current = family.id;
      clearPanelMessage();
    }

    setCareGuideId(family.careGuideId || "");
    setCarePathway(family.carePathway || "");
    setAssessmentNotes(family.assessmentNotes || "");
    setCarePlanSummary(family.carePlanSummary || "");
    setVisitScheduledAt(family.visitScheduledAt ? family.visitScheduledAt.slice(0, 16) : "");
    setVisitType((family.visitType as "VISIT" | "CALLBACK") || "");
    setVisitProviderName(family.visitProviderName || "");
    setVisitNotes(family.visitNotes || "");
  }, [family, clearPanelMessage]);

  const isPending = family ? pendingId === family.id : false;
  const matchingAllowed = family ? canCreateMatches(family.status, carePathway || family.carePathway) : false;
  const nextAction = family ? getAdminCaseNextAction(family, matches) : null;
  const normalizedStatus = family ? normalizeIntakeStatus(family.status) : "NEW";
  const hasMatches = matches.length > 0;
  const hasFamilyRequestedMatch = matches.some((match) => match.statusRaw === "VISIT_REQUESTED" || match.statusRaw === "CALLBACK_REQUESTED");
  const hasAcceptedOrContactedMatch = matches.some((match) => match.statusRaw === "ACCEPTED" || match.statusRaw === "CONTACTED" || match.statusRaw === "PLACED");
  const visitSchedulingAllowed =
    hasFamilyRequestedMatch || hasAcceptedOrContactedMatch || ["VISIT_SCHEDULED", "PROVIDER_RESPONSE", "PLACEMENT_IN_PROGRESS", "PLACED"].includes(normalizedStatus);
  const placementActionAllowed = hasAcceptedOrContactedMatch || ["PROVIDER_RESPONSE", "PLACEMENT_IN_PROGRESS", "PLACED"].includes(normalizedStatus);
  const createMatchDisabledReason = !assessmentComplete({ carePathway: carePathway || family?.carePathway || null })
    ? "Select a care pathway before creating provider matches."
    : !carePlanComplete({ carePlanSummary: carePlanSummary || family?.carePlanSummary || null })
      ? "Publish the care plan summary before creating provider matches."
      : !matchingAllowed
        ? "Move the case to the care-plan stage before creating matches."
        : "";
  const shortlistDisabledReason = !hasMatches ? "Create at least one provider match before marking the shortlist ready." : "";
  const visitDisabledReason = !visitSchedulingAllowed ? "Wait until the family requests a visit/callback or a provider accepts before scheduling." : "";

  async function handleCaseAction(status: IntakeStatus) {
    if (!family) return;
    setPendingAction(status);
    try {
      await onUpdateStatus(family.id, status, family.name, notifyPanel);
    } finally {
      setPendingAction(null);
      if (status === "CLOSED") {
        setConfirmCloseCase(false);
      }
    }
  }

  async function saveCareGuide() {
    if (!family || !careGuideId) return;
    await onPatchIntake(
      family.id,
      { careGuideId, ...(family.status === "NEW" ? { status: "CARE_GUIDE_ASSIGNED" } : {}) },
      family.name,
      `Care Guide assigned for ${family.name}.`,
      notifyPanel
    );
  }

  async function saveAndShareWithFamily() {
    if (!family || !carePathway) {
      notifyPanel("Select a recommended care pathway before saving.");
      return;
    }

    let nextStatus: IntakeStatus | undefined;
    let successMessage: string;

    if (carePlanSummary.trim() && !["CARE_PLAN", "MATCHED", "VISIT_SCHEDULED", "PROVIDER_RESPONSE", "PLACEMENT_IN_PROGRESS", "PLACED"].includes(normalizedStatus)) {
      nextStatus = "CARE_PLAN";
      successMessage = `Care plan published for ${family.name}. The family dashboard now shows the pathway and plan.`;
    } else if (family.status === "CARE_GUIDE_ASSIGNED") {
      nextStatus = "ASSESSMENT";
      successMessage = `Assessment saved for ${family.name}. The family timeline now shows assessment in progress.`;
    } else {
      successMessage = `Care plan details saved for ${family.name}.`;
    }

    setSavingAssessment(true);
    try {
      await onPatchIntake(
        family.id,
        {
          careGuideId: careGuideId || family.careGuideId || null,
          carePathway,
          assessmentNotes,
          carePlanSummary,
          ...(nextStatus ? { status: nextStatus } : {})
        },
        family.name,
        successMessage,
        notifyPanel
      );
    } finally {
      setSavingAssessment(false);
    }
  }

  async function markShortlistReady() {
    if (!family || !carePathway) {
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
        {
          careGuideId: careGuideId || family.careGuideId || null,
          carePathway,
          assessmentNotes,
          carePlanSummary,
          status: "MATCHED"
        },
        family.name,
        `${family.name} marked as matched. The family can now view providers on their shortlist.`,
        notifyPanel
      );
    } finally {
      setSavingAssessment(false);
    }
  }

  async function saveVisitSchedule() {
    if (!family || !visitScheduledAt) {
      notifyPanel("Set a visit or callback date and time before saving.");
      return;
    }

    const canAdvanceToVisitScheduled = ["MATCHED", "VISIT_SCHEDULED"].includes(normalizedStatus);

    setSavingVisit(true);
    try {
      await onPatchIntake(
        family.id,
        {
          visitScheduledAt: new Date(visitScheduledAt).toISOString(),
          visitType: visitType || null,
          visitProviderName: visitProviderName || null,
          visitNotes: visitNotes || null,
          ...(canAdvanceToVisitScheduled ? { status: "VISIT_SCHEDULED" as const } : {})
        },
        family.name,
        canAdvanceToVisitScheduled
          ? `Visit scheduled for ${family.name}. The family dashboard now shows the appointment.`
          : `Visit details updated for ${family.name}.`,
        notifyPanel
      );
    } finally {
      setSavingVisit(false);
    }
  }

  async function createMatch() {
    if (!family || !providerId) return;
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
          notes: matchNotes || undefined
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

      notifyPanel(`Match created for ${family.name}. They can now see this provider on their results page.`);
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
  const currentStepIndex = family ? journeyStepIndex(family.status) : 0;
  const visibleJourneySteps = JOURNEY_STEPS.filter((step) => step.status !== "CLOSED");

  return (
    <SlidePanel
      open={Boolean(family)}
      onClose={onClose}
      size="xl"
      title={family?.name || "Family intake"}
      subtitle={family ? `${family.location} · ${family.urgency}` : "Care intake details"}
      notice={panelMessage}
      noticeTone={panelNoticeTone(panelMessage)}
    >
      {family ? (
        <div className="space-y-5">
          <StatusPill>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Case status</span>
                <p className="mt-1 font-semibold text-ink">{adminIntakeStatusLabel(family.status)}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Care Guide</span>
                <p className="mt-1 font-semibold text-ink">{family.careGuideName || "Not assigned"}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Urgency</span>
                <p className="mt-1 font-semibold text-ink">{family.urgency}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Location</span>
                <p className="mt-1 font-semibold text-ink">{family.location}</p>
              </div>
            </div>
          </StatusPill>

          <PanelSection title="Family journey progress" description="What the family sees on their dashboard timeline.">
            <p className="text-sm font-semibold text-ink">
              Step {Math.min(currentStepIndex + 1, visibleJourneySteps.length)} of {visibleJourneySteps.length} ·{" "}
              {adminIntakeStatusLabel(family.status)}
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              {visibleJourneySteps.find((step) => step.status === normalizedStatus)?.hint}
            </p>
          </PanelSection>

          {nextAction ? (
            <PanelSection title="Next action" description={nextAction.description}>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                    nextAction.severity === "action"
                      ? "bg-brand-amber/15 text-brand-amber-dark ring-1 ring-brand-amber/25"
                      : nextAction.severity === "waiting"
                        ? "bg-brand-cream text-ink/70 ring-1 ring-stone-200"
                        : "bg-brand-green-pale/70 text-brand-green-dark"
                  )}
                >
                  {nextAction.label}
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  {nextAction.tab === "inquiries" ? "Inquiries queue" : "Families command center"}
                </span>
              </div>
            </PanelSection>
          ) : null}

          <details className="group border-t border-stone-100 pt-5">
            <summary className="cursor-pointer list-none text-sm font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                Intake details
                <span className="text-xs font-normal text-neutral-500 group-open:hidden">Show submission</span>
                <span className="hidden text-xs font-normal text-neutral-500 group-open:inline">Hide</span>
              </span>
            </summary>
            <div className="mt-5 space-y-5">
              <PanelSection title="Contact">
                <DetailList
                  columns={1}
                  items={[
                    { label: "Contact name", value: family.name },
                    { label: "Email", value: family.email },
                    { label: "Phone", value: family.phone },
                    { label: "Relationship", value: family.relationship },
                    { label: "Age range", value: family.ageRange },
                    { label: "Preferred area", value: family.location }
                  ]}
                />
              </PanelSection>
              <PanelSection title="Decision support">
                <DetailList
                  columns={1}
                  items={[
                    { label: "Decision-maker", value: family.decisionMakerName },
                    { label: "Decision-maker role", value: family.decisionMakerRelationship },
                    { label: "Living situation", value: family.livingSituation },
                    { label: "Move-in timeline", value: family.moveInTimeline }
                  ]}
                />
              </PanelSection>
              <PanelSection title="Care needs">
                <DetailList
                  columns={1}
                  items={[
                    { label: "Urgency", value: family.urgency },
                    { label: "Budget", value: family.budget },
                    { label: "Mobility", value: family.mobility },
                    { label: "Dementia needs", value: family.dementiaNeeds },
                    { label: "Hospital discharge", value: family.hospitalDischargeDate }
                  ]}
                />
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Care types</p>
                    <div className="mt-2">
                      <TagList items={family.careTypes?.length ? family.careTypes : family.care.split(",").map((item) => item.trim()).filter(Boolean)} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Languages</p>
                    <div className="mt-2">
                      <TagList items={family.languages ?? []} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Support needed</p>
                    <div className="mt-2">
                      <TagList items={family.supportTypes ?? []} />
                    </div>
                  </div>
                </div>
              </PanelSection>
              {family.notes?.trim() ? (
                <PanelSection title="Family notes">
                  <p className="text-sm leading-7 text-neutral-700">{family.notes}</p>
                </PanelSection>
              ) : null}
            </div>
          </details>

          <div className="space-y-6 border-t border-stone-100 pt-6">
            <PanelSection
              step={2}
              title="Assign Care Guide"
              description="Assign a named guide — the family timeline moves to “Care Guide assigned”."
            >
              <div className="space-y-3">
              <label className="grid gap-2 text-sm font-medium">
                Care Guide
                <select
                  value={careGuideId}
                  onChange={(event) => setCareGuideId(event.target.value)}
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
                <Button type="button" size="sm" disabled={!careGuideId || isPending} onClick={() => void saveCareGuide()}>
                  {isPending ? "Saving..." : "Assign Care Guide"}
                </Button>
              </AdminPanelActions>
              </div>
            </PanelSection>

            <PanelSection
              step={3}
              title="Assessment & care plan"
              description="One save shares pathway and plan with the family. Use “Mark shortlist ready” when providers should appear on their results page."
            >
              <div className="space-y-3">
              <label className="grid gap-2 text-sm font-medium">
                Recommended care pathway
                <select value={carePathway} onChange={(event) => setCarePathway(event.target.value)} className={adminFieldClass}>
                  <option value="">Select pathway</option>
                  {CARE_PATHWAYS.map((pathway) => (
                    <option key={pathway} value={pathway}>
                      {pathway}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Assessment notes (internal)
                <textarea
                  value={assessmentNotes}
                  onChange={(event) => setAssessmentNotes(event.target.value)}
                  className={`${adminFieldClass} min-h-24`}
                  placeholder="Family situation, decision-makers, funding context..."
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Care plan summary (shared with family)
                <textarea
                  value={carePlanSummary}
                  onChange={(event) => setCarePlanSummary(event.target.value)}
                  className={`${adminFieldClass} min-h-24`}
                  placeholder="Brief plan: recommended next steps and why this pathway fits."
                />
              </label>
              <AdminPanelActions>
                <Button type="button" size="sm" disabled={savingAssessment || isPending} onClick={() => void saveAndShareWithFamily()}>
                  {savingAssessment ? "Saving..." : "Save & share with family"}
                </Button>
                {!["MATCHED", "VISIT_SCHEDULED", "PROVIDER_RESPONSE", "PLACEMENT_IN_PROGRESS", "PLACED", "CLOSED"].includes(normalizedStatus) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={savingAssessment || isPending || !carePlanSummary.trim() || Boolean(shortlistDisabledReason)}
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
              description="Add providers to the family shortlist. Your entries stay here so you can review or add another match."
            >
              <div className="space-y-3">
              <label className="grid gap-2 text-sm font-medium">
                Provider
                <select
                  value={providerId}
                  onChange={(event) => setProviderId(event.target.value)}
                  disabled={!matchingAllowed}
                  className={adminFieldClass}
                >
                  <option value="">Select provider</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} — {provider.area}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
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
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Internal notes (optional)
                <textarea
                  value={matchNotes}
                  disabled={!matchingAllowed}
                  onChange={(event) => setMatchNotes(event.target.value)}
                  className={`${adminFieldClass} min-h-20`}
                />
              </label>
              <AdminPanelActions>
                <Button
                  type="button"
                  size="sm"
                  disabled={!providerId || creatingMatch || Boolean(createMatchDisabledReason)}
                  onClick={() => void createMatch()}
                >
                  {creatingMatch ? "Creating..." : "Create match"}
                </Button>
              </AdminPanelActions>
              {createMatchDisabledReason ? <p className="text-xs leading-5 text-neutral-500">{createMatchDisabledReason}</p> : null}
              </div>
            </PanelSection>

            <PanelSection
              step={5}
              title="Schedule visit or callback"
              description={
                ["MATCHED", "VISIT_SCHEDULED"].includes(normalizedStatus)
                  ? "Saving advances the family timeline to “Visit scheduled” and shows the appointment on their dashboard."
                  : "Visit details are saved for the family dashboard. Status is not moved backward if the case has already progressed."
              }
            >
              <div className="space-y-3">
              <label className="grid gap-2 text-sm font-medium">
                Visit or callback date & time
                <input
                  type="datetime-local"
                  value={visitScheduledAt}
                  disabled={!visitSchedulingAllowed}
                  onChange={(event) => setVisitScheduledAt(event.target.value)}
                  className={adminFieldClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
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
              <label className="grid gap-2 text-sm font-medium">
                Provider / facility
                <input
                  value={visitProviderName}
                  disabled={!visitSchedulingAllowed}
                  onChange={(event) => setVisitProviderName(event.target.value)}
                  className={adminFieldClass}
                  placeholder="Provider name"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Visit notes
                <textarea
                  value={visitNotes}
                  disabled={!visitSchedulingAllowed}
                  onChange={(event) => setVisitNotes(event.target.value)}
                  className={`${adminFieldClass} min-h-20`}
                  placeholder="Directions, contact person, what to bring..."
                />
              </label>
              <AdminPanelActions>
                <Button
                  type="button"
                  size="sm"
                  disabled={savingVisit || isPending || !visitScheduledAt || !visitSchedulingAllowed}
                  onClick={() => void saveVisitSchedule()}
                >
                  {savingVisit
                    ? "Saving..."
                    : ["MATCHED", "VISIT_SCHEDULED"].includes(normalizedStatus)
                      ? "Save visit & mark scheduled"
                      : "Update visit details"}
                </Button>
              </AdminPanelActions>
              {visitDisabledReason ? <p className="text-xs leading-5 text-neutral-500">{visitDisabledReason}</p> : null}
              </div>
            </PanelSection>

            {nextActions.length ? (
              <PanelSection step={6} title="Advance case status" description="Use when the case moves to placement, follow-ups, or closure.">
                <div className="space-y-4">
                  {nextActions.map((action) => {
                    const disabledReason =
                      action.status === "VISIT_SCHEDULED" && !visitSchedulingAllowed
                        ? "Wait until the family requests a visit/callback or a provider accepts before scheduling."
                        : (action.status === "PLACEMENT_IN_PROGRESS" || action.status === "PLACED") && !placementActionAllowed
                          ? "Coordinate with an accepted provider before recording placement."
                          : "";

                    return (
                    <div key={action.status}>
                      <AdminPanelActions>
                        <Button
                          size="sm"
                          variant={action.status === "CLOSED" ? "outline" : "default"}
                          disabled={isPending || Boolean(disabledReason)}
                          onClick={() => {
                            if (action.status === "CLOSED") {
                              setConfirmCloseCase(true);
                              return;
                            }
                            void handleCaseAction(action.status);
                          }}
                        >
                          {isPending && pendingAction === action.status ? "Saving..." : action.label}
                        </Button>
                      </AdminPanelActions>
                      <p className="mt-2 text-xs leading-5 text-neutral-500">{disabledReason || action.description}</p>
                    </div>
                    );
                  })}
                </div>
              </PanelSection>
            ) : null}
          </div>

          <PanelSection title="Case record">
            <DetailList
              columns={1}
              items={[
                { label: "Intake ID", value: family.id },
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
        pending={isPending && pendingAction === "CLOSED"}
        title="Close this case?"
        description="Only close the case when the family is no longer active or has been helped elsewhere."
        confirmLabel="Close case"
        onCancel={() => setConfirmCloseCase(false)}
        onConfirm={() => void handleCaseAction("CLOSED")}
      />
    </SlidePanel>
  );
}

function ProvidersTable({
  providers
}: {
  providers: AdminDashboardData["providerList"];
}) {
  const [selected, setSelected] = useState<AdminDashboardData["providerList"][number] | null>(null);

  useEffect(() => {
    setSelected((current) => {
      if (!current) return null;
      return providers.find((provider) => provider.id === current.id) ?? null;
    });
  }, [providers]);

  return (
    <>
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Area</th>
            <th className="px-4 py-3">Beds open</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {providers.map((provider) => (
            <tr key={provider.id} className="cursor-pointer hover:bg-cream" onClick={() => setSelected(provider)}>
              <td className="px-4 py-3 text-sm font-semibold">{provider.name}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">{provider.type}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">{provider.area}</td>
              <td className="px-4 py-3 text-sm text-neutral-600">
                {provider.bedsOpen ?? "—"}
                {provider.bedsTotal ? ` / ${provider.bedsTotal}` : ""}
              </td>
              <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                <IconActionButton label="Open details" icon={ArrowUpRight} onClick={() => setSelected(provider)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ProviderDetailPanel provider={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function ProviderDetailPanel({
  provider,
  onClose
}: {
  provider: AdminDashboardData["providerList"][number] | null;
  onClose: () => void;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();

  useEffect(() => {
    if (!provider) clearPanelMessage();
  }, [provider, clearPanelMessage]);

  const priceRange = provider ? formatProviderPriceRange(provider.priceMin, provider.priceMax) : null;
  const bedsSummary =
    provider && (provider.bedsOpen != null || provider.bedsTotal != null)
      ? `${provider.bedsOpen ?? "—"} open · ${provider.bedsTotal ?? "—"} total`
      : null;

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
        <div className="space-y-6">
          <StatusPill>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Availability</span>
                <p className="mt-1 font-semibold text-ink">{provider.availabilityStatus || "Not set"}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Beds</span>
                <p className="mt-1 font-semibold text-ink">{bedsSummary || "Not set"}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Response time</span>
                <p className="mt-1 font-semibold text-ink">
                  {provider.responseTimeHours ? `${provider.responseTimeHours} hours` : "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Visit availability</span>
                <p className="mt-1 font-semibold text-ink">{provider.visitAvailability || "Visits welcome"}</p>
              </div>
            </div>
          </StatusPill>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-5">
              <PanelSection step={1} title="Contact">
                <DetailList
                  columns={1}
                  items={[
                    { label: "Contact name", value: provider.contactName },
                    { label: "Email", value: provider.email },
                    { label: "Phone", value: provider.phone },
                    { label: "Website", value: provider.website }
                  ]}
                />
              </PanelSection>

              <PanelSection step={2} title="Location">
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
              </PanelSection>
            </div>

            <div className="space-y-5">
              <PanelSection step={3} title="Capacity & pricing">
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
              </PanelSection>

              <PanelSection step={4} title="Care profile">
                <DetailList columns={1} items={[{ label: "Dementia capacity", value: provider.dementiaCapacity }]} />
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Care levels</p>
                  <div className="mt-2">
                    <TagList items={provider.careLevels ?? []} />
                  </div>
                </div>
              </PanelSection>
            </div>

            <div className="space-y-5">
              <PanelSection step={5} title="Services & languages">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Services offered</p>
                    <div className="mt-2">
                      <TagList items={provider.services ?? []} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Languages spoken</p>
                    <div className="mt-2">
                      <TagList items={provider.languages ?? []} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Funding types accepted</p>
                    <div className="mt-2">
                      <TagList items={provider.fundingTypes ?? []} />
                    </div>
                  </div>
                </div>
              </PanelSection>

              <PanelSection step={6} title="Description">
                <p className="text-sm leading-7 text-neutral-700">{provider.description?.trim() || "—"}</p>
              </PanelSection>

              <PanelSection step={7} title="Record">
                <DetailList
                  columns={1}
                  items={[
                    { label: "Provider ID", value: provider.id },
                    { label: "Added", value: provider.createdAt },
                    { label: "Last updated", value: provider.updatedAt }
                  ]}
                />
              </PanelSection>

              <PanelSection step={8} title="Quick actions">
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
          </div>
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

function InquiriesTable({
  inquiries,
  setMessage,
  onSync
}: {
  inquiries: InquiryEntry[];
  setMessage: (message: string) => void;
  onSync: () => Promise<boolean>;
}) {
  const [rows, setRows] = useState(inquiries);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<InquiryEntry | null>(null);
  const [confirmClose, setConfirmClose] = useState<InquiryEntry | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setRows(inquiries);
    setSelected((current) => {
      if (!current) return null;
      return inquiries.find((item) => item.id === current.id) ?? null;
    });
  }, [inquiries]);

  const visibleRows = useMemo(
    () => (showHistory ? rows : rows.filter((item) => inquiryCoordinationStatuses.has(item.statusRaw))),
    [rows, showHistory]
  );
  const sortedInquiries = useMemo(
    () => [...visibleRows].sort((a, b) => compareMatchPriority(a.statusRaw, b.statusRaw)),
    [visibleRows]
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

      const updated = (await response.json()) as { status: MatchStatus; notes?: string | null };

      setRows((current) =>
        current.map((inquiry) =>
          inquiry.id === id
            ? {
                ...inquiry,
                statusRaw: updated.status,
                status: adminMatchStatusLabel(updated.status),
                notes: updated.notes ?? inquiry.notes
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
              notes: updated.notes ?? current.notes
            }
          : current
      );
      notify(`Inquiry updated to ${adminMatchStatusLabel(updated.status).toLowerCase()}.`);
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
          <p className="text-sm font-semibold text-ink">Provider follow-up queue</p>
          <p className="text-xs leading-5 text-neutral-500">
            {showHistory
              ? "Showing every match record, including suggested, declined, placed, and closed history."
              : "Showing visit requests, callback requests, accepted responses, and coordinated follow-ups."}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setShowHistory((current) => !current)}>
          {showHistory ? "Hide history" : "Show full history"}
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
            const needsFollowUp = isAdminActionNeeded(inquiry.statusRaw);
            const placementReady = inquiry.statusRaw === "ACCEPTED" || inquiry.statusRaw === "CONTACTED";

            return (
              <tr
                key={inquiry.id}
                className={`cursor-pointer hover:bg-cream ${needsFollowUp ? "bg-brand-amber/5" : ""}`}
                onClick={() => setSelected(inquiry)}
              >
                <td className="px-4 py-3 text-sm text-neutral-700">{inquiry.family}</td>
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
                    {inquiry.statusRaw === "VISIT_REQUESTED" || inquiry.statusRaw === "CALLBACK_REQUESTED" || inquiry.statusRaw === "ACCEPTED" ? (
                      <IconActionButton
                        label={adminInquiryActionMeta("CONTACTED").label}
                        icon={CalendarCheck}
                        loading={pendingActionKey === `${inquiry.id}:CONTACTED`}
                        disabled={isPending}
                        onClick={() => void updateMatchStatus(inquiry.id, "CONTACTED")}
                      />
                    ) : null}
                    {placementReady ? (
                      <IconActionButton
                        label={adminInquiryActionMeta("PLACED").label}
                        icon={Building2}
                        loading={pendingActionKey === `${inquiry.id}:PLACED`}
                        disabled={isPending}
                        onClick={() => void updateMatchStatus(inquiry.id, "PLACED")}
                      />
                    ) : null}
                    {inquiry.statusRaw !== "CLOSED" ? (
                      <IconActionButton
                        label={adminInquiryActionMeta("CLOSED").label}
                        icon={X}
                        loading={pendingActionKey === `${inquiry.id}:CLOSED`}
                        disabled={isPending}
                        onClick={() => setConfirmClose(inquiry)}
                      />
                    ) : null}
                    <IconActionButton label="Open details" icon={ArrowUpRight} onClick={() => setSelected(inquiry)} />
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
        pendingId={pendingId}
        pendingActionKey={pendingActionKey}
        onClose={() => setSelected(null)}
        onUpdateStatus={(id, status, notify) => updateMatchStatus(id, status, notify)}
      />
      <ConfirmDialog
        open={Boolean(confirmClose)}
        tone="danger"
        pending={Boolean(confirmClose && pendingId === confirmClose.id)}
        title="Close this inquiry?"
        description="Use this when no further follow-up is needed. Closed inquiries stay in records but are no longer active."
        confirmLabel="Close inquiry"
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
  pendingId,
  pendingActionKey,
  onClose,
  onUpdateStatus
}: {
  inquiry: InquiryEntry | null;
  pendingId: string | null;
  pendingActionKey: string | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: MatchStatus, notify?: (message: string) => void) => Promise<void>;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();
  const isPending = inquiry ? pendingId === inquiry.id : false;
  const [confirmClose, setConfirmClose] = useState(false);
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
        { label: "Activity log", value: inquiry.notes }
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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <StatusPill className={matchStatusBadgeClass(inquiry.statusRaw)}>{hint}</StatusPill>

            <PanelSection step={1} title="Inquiry flow" className="mt-5">
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-neutral-600">
                <li>Create a match — family sees the provider on their shortlist.</li>
                <li>Family requests a visit or callback.</li>
                <li>Provider accepts or declines.</li>
                <li>Mark coordinated after arranging the visit or call.</li>
                <li>Record placement when the family commits, or close the inquiry.</li>
              </ol>
            </PanelSection>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <PanelSection step={2} title="Family">
                <DetailList
                  items={details.filter((item) =>
                    ["Family", "Phone", "Email", "Area", "Care needed", "Urgency"].includes(item.label)
                  )}
                />
              </PanelSection>
              <PanelSection step={3} title="Match">
                <DetailList
                  items={details.filter((item) =>
                    ["Provider", "Match score", "Status", "Created", "Last updated", "Activity log"].includes(item.label)
                  )}
                />
              </PanelSection>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-0 lg:self-start">
            {(inquiry.statusRaw === "VISIT_REQUESTED" ||
              inquiry.statusRaw === "CALLBACK_REQUESTED" ||
              inquiry.statusRaw === "ACCEPTED") && (
              <PanelSection step={4} title={adminInquiryActionMeta("CONTACTED").label} description={adminInquiryActionMeta("CONTACTED").description}>
                <Button size="sm" disabled={isPending} onClick={() => void updateFromPanel(inquiry.id, "CONTACTED")}>
                  {pendingActionKey === `${inquiry.id}:CONTACTED` ? "Saving..." : "Confirm"}
                </Button>
              </PanelSection>
            )}
            {inquiry.statusRaw !== "PLACED" && inquiry.statusRaw !== "CLOSED" ? (
              <PanelSection step={5} title={adminInquiryActionMeta("PLACED").label} description={adminInquiryActionMeta("PLACED").description}>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending || !(inquiry.statusRaw === "ACCEPTED" || inquiry.statusRaw === "CONTACTED")}
                  onClick={() => void updateFromPanel(inquiry.id, "PLACED")}
                >
                  {pendingActionKey === `${inquiry.id}:PLACED` ? "Saving..." : "Confirm"}
                </Button>
                {inquiry.statusRaw === "ACCEPTED" || inquiry.statusRaw === "CONTACTED" ? null : (
                  <p className="mt-2 text-xs leading-5 text-neutral-500">Coordinate with the provider before recording placement.</p>
                )}
              </PanelSection>
            ) : null}
            {inquiry.statusRaw !== "CLOSED" ? (
              <PanelSection step={6} title={adminInquiryActionMeta("CLOSED").label} description={adminInquiryActionMeta("CLOSED").description}>
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => setConfirmClose(true)}>
                  {pendingActionKey === `${inquiry.id}:CLOSED` ? "Saving..." : "Confirm"}
                </Button>
              </PanelSection>
            ) : null}
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmClose}
        tone="danger"
        pending={Boolean(inquiry && pendingActionKey === `${inquiry.id}:CLOSED`)}
        title="Close this inquiry?"
        description="This removes the inquiry from active follow-up. Keep it open if coordination is still in progress."
        confirmLabel="Close inquiry"
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
  setMessage
}: {
  entries: WaitlistEntry[];
  setMessage: (message: string) => void;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<WaitlistEntry | null>(null);
  const [confirmInvite, setConfirmInvite] = useState<WaitlistEntry | null>(null);

  function canInviteProvider(entry: WaitlistEntry) {
    return entry.type === "FACILITY" && entry.status === "NEW";
  }

  function startProviderInvite(entry: WaitlistEntry, notify: (message: string) => void = setMessage) {
    if (!canInviteProvider(entry)) {
      notify(
        entry.status === "CONTACTED"
          ? "Provider invite is already sent or this facility has been contacted."
          : "This waitlist entry is not eligible for a provider invite."
      );
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
        throw new Error("Could not update waitlist entry.");
      }

      setEntries((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, status: "CONTACTED" as const } : entry))
      );
      setSelected((current) => (current?.id === id ? { ...current, status: "CONTACTED" } : current));

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

      notify(`${name} marked as contacted. Status updated in the waitlist.`);
    } catch {
      notify(`Could not mark ${name} as contacted. Please try again.`);
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

      const payload = (await response.json()) as { id: string; emailMode?: string };
      const nextStatus = entry.status === "NEW" ? "CONTACTED" : entry.status;

      setEntries((current) =>
        current.map((item) => (item.id === entry.id ? { ...item, status: nextStatus } : item))
      );
      setSelected((current) => (current?.id === entry.id ? { ...current, status: nextStatus } : current));

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

      setMessage(`Provider invite sent to ${entry.email}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not send provider invite to ${entry.email}. Please try again.`);
    } finally {
      setPendingInviteId(null);
      setConfirmInvite(null);
    }
  }

  return (
    <>
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
          {entries.map((entry) => {
            const isContacted = entry.status === "CONTACTED";
            const isPending = pendingId === entry.id;
            const isInviteLocked = !canInviteProvider(entry);

            return (
              <tr key={entry.id} className="cursor-pointer hover:bg-cream" onClick={() => setSelected(entry)}>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.type === "FACILITY" ? "Facility" : "Family"}</td>
                <td className="px-4 py-3 text-sm font-semibold">{entry.name}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.email}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.location}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.createdAt}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isContacted ? "bg-sage-600 text-white" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {entry.status}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <IconActionButton label="Open details" icon={ArrowUpRight} onClick={() => setSelected(entry)} />
                    {entry.type === "FACILITY" ? (
                      <IconActionButton
                        label={isInviteLocked ? "Provider invite locked" : "Invite provider"}
                        icon={Building2}
                        loading={pendingInviteId === entry.id}
                        disabled={pendingInviteId === entry.id || isInviteLocked}
                        onClick={() => startProviderInvite(entry)}
                      />
                    ) : null}
                    <IconActionButton
                      label={isContacted ? "Already contacted" : "Mark contacted"}
                      icon={Mail}
                      loading={isPending}
                      disabled={isContacted || isPending}
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
        onInviteProvider={(entry, notify) => startProviderInvite(entry, notify)}
        pendingId={pendingId}
        pendingInviteId={pendingInviteId}
      />
      <ConfirmDialog
        open={Boolean(confirmInvite)}
        title="Send provider invite?"
        description={
          confirmInvite
            ? `Send a provider onboarding invite to ${confirmInvite.email}? This will create a pending invite record for ${confirmInvite.name}.`
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
  onInviteProvider,
  pendingId,
  pendingInviteId
}: {
  entry: WaitlistEntry | null;
  onClose: () => void;
  onMarkContacted: (id: string, name: string, notify?: (message: string) => void) => Promise<void>;
  onInviteProvider: (entry: WaitlistEntry, notify?: (message: string) => void) => void;
  pendingId: string | null;
  pendingInviteId: string | null;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();
  const isContacted = entry?.status === "CONTACTED";
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
        <div className="space-y-6">
          <StatusPill>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Type</span>
                <p className="mt-1 font-semibold text-ink">{entry.type}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Status</span>
                <p className="mt-1 font-semibold text-ink">{entry.status}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Registered</span>
                <p className="mt-1 font-semibold text-ink">{entry.createdAt}</p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Location</span>
                <p className="mt-1 font-semibold text-ink">{entry.location}</p>
              </div>
            </div>
          </StatusPill>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-5">
              <PanelSection step={1} title="Contact">
                <DetailList
                  columns={1}
                  items={[
                    { label: "Contact name", value: entry.contactName },
                    { label: "Email", value: entry.email },
                    { label: "Phone", value: entry.phone }
                  ]}
                />
              </PanelSection>

              <PanelSection step={2} title="Location">
                <DetailList
                  columns={1}
                  items={[
                    { label: "City", value: entry.city },
                    { label: "Province", value: entry.province },
                    { label: "Full location", value: entry.location }
                  ]}
                />
              </PanelSection>
            </div>

            <div className="space-y-5">
              {isFamily ? (
                <PanelSection step={3} title="Family context">
                  <DetailList
                    columns={1}
                    items={[
                      { label: "Relationship", value: entry.relationship },
                      { label: "Age range", value: entry.ageRange }
                    ]}
                  />
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Care types</p>
                    <div className="mt-2">
                      <TagList items={entry.careTypes ?? []} />
                    </div>
                  </div>
                </PanelSection>
              ) : (
                <PanelSection step={3} title="Facility details">
                  <DetailList
                    columns={1}
                    items={[
                      { label: "Facility name", value: entry.facilityName },
                      { label: "Facility type", value: entry.facilityType },
                      { label: "Total beds", value: entry.bedsTotal != null ? String(entry.bedsTotal) : null }
                    ]}
                  />
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Services</p>
                    <div className="mt-2">
                      <TagList items={entry.services ?? []} />
                    </div>
                  </div>
                </PanelSection>
              )}

              <PanelSection step={4} title="Message">
                <p className="text-sm leading-7 text-neutral-700">{entry.message?.trim() || "—"}</p>
              </PanelSection>
            </div>

            <div className="space-y-5">
              <PanelSection step={5} title="Record">
                <DetailList
                  columns={1}
                  items={[
                    { label: "Entry ID", value: entry.id },
                    { label: "Registered", value: entry.createdAt },
                    { label: "Last updated", value: entry.updatedAt }
                  ]}
                />
              </PanelSection>

              <PanelSection step={6} title="Quick actions">
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
                      disabled={isInvitePending || entry.status !== "NEW"}
                      onClick={() => onInviteProvider(entry, setPanelMessage)}
                    >
                      {isInvitePending ? "Sending..." : entry.status === "NEW" ? "Invite provider" : "Invite locked"}
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
                    disabled={isContacted || isPending}
                    onClick={() => void onMarkContacted(entry.id, entry.name, setPanelMessage)}
                  >
                    {isPending ? "Saving..." : isContacted ? "Contacted" : "Mark contacted"}
                  </Button>
                </div>
              </PanelSection>
            </div>
          </div>
        </div>
      ) : null}
    </SlidePanel>
  );
}

const adminFieldClass = "rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-brand-amber";

function AdminPanelActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}
