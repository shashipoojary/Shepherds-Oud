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
import {
  adminIntakeActionMeta,
  adminIntakeStatusLabel,
  canCreateMatches,
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

export function AdminDashboardClient({ data: initialData }: { data: AdminDashboardData }) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<AdminTab>("families");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [tabSeenAt, setTabSeenAt] = useState(getTabSeenAt);
  const initializedSeen = useRef(false);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    initTabSeenFromData(initialData);
    if (!initializedSeen.current) {
      initializedSeen.current = true;
      setTabSeenAt(markTabSeen("families"));
    }
  }, [initialData]);

  useEffect(() => {
    const seen = markTabSeen(tab);
    setTabSeenAt(seen);
  }, [tab]);

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

      <div className="mt-6 rounded-xl bg-white shadow-soft">
        <div className="overflow-x-auto">
          {tab === "families" ? (
            data.families.length ? (
              <FamiliesTable
                families={data.families}
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
              <EmptyState title="No providers yet" description="Approved care facilities will appear here once added to the database." />
            )
          ) : null}

          {tab === "inquiries" ? (
            data.inquiries.length ? (
              <InquiriesTable inquiries={data.inquiries} setMessage={setMessage} onSync={syncDashboard} />
            ) : (
              <EmptyState title="No matches or inquiries yet" description="When families are matched to providers, those records will show here." />
            )
          ) : null}

          {tab === "waitlist" ? (
            data.waitlist.length ? (
              <WaitlistTable entries={data.waitlist} setMessage={setMessage} />
            ) : (
              <EmptyState title="No waitlist registrations yet" description="Pre-launch family and facility sign-ups will appear here." />
            )
          ) : null}
        </div>
      </div>
    </main>
  );
}

function FamiliesTable({
  families,
  providers,
  careGuides,
  setMessage,
  onSync
}: {
  families: FamilyEntry[];
  providers: ProviderOption[];
  careGuides: CareGuideOption[];
  setMessage: (message: string) => void;
  onSync: () => Promise<boolean>;
}) {
  const [rows, setRows] = useState(families);
  const [selected, setSelected] = useState<FamilyEntry | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

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
        await recordAction({
          type: "intake_status_updated",
          targetType: "intake",
          targetId: id,
          label: `Updated ${name} to ${body.status}.`,
          payload: { id, status: body.status, name }
        });
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
      <div className="md:hidden divide-y divide-stone-200">
        {rows.map((family) => {
          const isPending = pendingId === family.id;
          const assignMeta = adminIntakeActionMeta("CARE_GUIDE_ASSIGNED");
          return (
            <article
              key={family.id}
              className="cursor-pointer space-y-3 px-4 py-4 hover:bg-cream"
              onClick={() => setSelected(family)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{family.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{family.context}</p>
                </div>
                <span className="inline-flex shrink-0 whitespace-nowrap rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-semibold leading-none text-sage-700">
                  {adminIntakeStatusLabel(family.status)}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <dt className="text-neutral-400">Care needed</dt>
                  <dd className="mt-0.5 font-medium text-neutral-700">{family.care}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Location</dt>
                  <dd className="mt-0.5 font-medium text-neutral-700">{family.location}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Urgency</dt>
                  <dd className="mt-0.5 font-medium text-neutral-700">{family.urgency}</dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Care Guide</dt>
                  <dd className="mt-0.5 font-medium text-neutral-700">{family.careGuideName || "—"}</dd>
                </div>
              </dl>
              <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
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
            </article>
          );
        })}
      </div>

      <table className="hidden w-full min-w-[900px] border-collapse text-left md:table">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Family</th>
            <th className="px-4 py-3">Care needed</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Urgency</th>
            <th className="px-4 py-3">Care Guide</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {rows.map((family) => {
            const isPending = pendingId === family.id;
            const assignMeta = adminIntakeActionMeta("CARE_GUIDE_ASSIGNED");
            return (
              <tr key={family.id} className="cursor-pointer hover:bg-cream" onClick={() => setSelected(family)}>
                <td className="px-4 py-3 text-sm">
                  <strong>{family.name}</strong>
                  <span className="block text-xs text-neutral-500">{family.context}</span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">{family.care}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{family.location}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{family.urgency}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{family.careGuideName || "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex whitespace-nowrap rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">
                    {adminIntakeStatusLabel(family.status)}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
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
        providers={providers}
        careGuides={careGuides}
        onClose={() => setSelected(null)}
        onUpdateStatus={updateStatus}
        onPatchIntake={patchIntake}
        onSync={onSync}
        pendingId={pendingId}
      />
    </>
  );
}

function FamilyDetailPanel({
  family,
  providers,
  careGuides,
  onClose,
  onUpdateStatus,
  onPatchIntake,
  onSync,
  pendingId
}: {
  family: FamilyEntry | null;
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
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();
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
    if (!family) return;
    clearPanelMessage();
    setCareGuideId(family.careGuideId || "");
    setCarePathway(family.carePathway || "");
    setAssessmentNotes(family.assessmentNotes || "");
    setCarePlanSummary(family.carePlanSummary || "");
    setVisitScheduledAt(family.visitScheduledAt ? family.visitScheduledAt.slice(0, 16) : "");
    setVisitType((family.visitType as "VISIT" | "CALLBACK") || "");
    setVisitProviderName(family.visitProviderName || "");
    setVisitNotes(family.visitNotes || "");
  }, [family]);

  const isPending = family ? pendingId === family.id : false;
  const matchingAllowed = family ? canCreateMatches(family.status, carePathway || family.carePathway) : false;

  async function handleCaseAction(status: IntakeStatus) {
    if (!family) return;
    setPendingAction(status);
    try {
      await onUpdateStatus(family.id, status, family.name, setPanelMessage);
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
      setPanelMessage
    );
  }

  async function saveAssessment(advanceTo?: IntakeStatus) {
    if (!family || !carePathway) {
      setPanelMessage("Select a recommended care pathway before saving the assessment.");
      return;
    }

    if (advanceTo === "CARE_PLAN" && !carePlanSummary.trim()) {
      setPanelMessage("Add a care plan summary before publishing the care plan.");
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
          ...(advanceTo ? { status: advanceTo } : family.status === "CARE_GUIDE_ASSIGNED" ? { status: "ASSESSMENT" } : {})
        },
        family.name,
        advanceTo === "CARE_PLAN"
          ? `Care plan published for ${family.name}.`
          : advanceTo === "MATCHED"
            ? `${family.name} marked as matched.`
            : `Assessment saved for ${family.name}.`,
        setPanelMessage
      );
    } finally {
      setSavingAssessment(false);
    }
  }

  async function saveVisitSchedule() {
    if (!family || !visitScheduledAt) {
      setPanelMessage("Set a visit or callback date and time before saving.");
      return;
    }

    setSavingVisit(true);
    try {
      await onPatchIntake(
        family.id,
        {
          visitScheduledAt: new Date(visitScheduledAt).toISOString(),
          visitType: visitType || null,
          visitProviderName: visitProviderName || null,
          visitNotes: visitNotes || null,
          status: "VISIT_SCHEDULED"
        },
        family.name,
        `Visit scheduled for ${family.name}.`,
        setPanelMessage
      );
    } finally {
      setSavingVisit(false);
    }
  }

  async function createMatch() {
    if (!family || !providerId) return;
    if (!matchingAllowed) {
      setPanelMessage("Complete the assessment and select a care pathway before creating matches.");
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

      await recordAction({
        type: "match_created",
        targetType: "intake",
        targetId: family.id,
        label: `Matched ${family.name} with a provider.`,
        payload: { intakeId: family.id, providerId, score: Number(score) }
      });

      setPanelMessage(`Match created for ${family.name}. They can now see this provider on their results page.`);
      setProviderId("");
      setMatchNotes("");
      await onSync();
    } catch (error) {
      setPanelMessage(error instanceof Error ? error.message : `Could not create match for ${family.name}.`);
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
  const normalizedStatus = family ? normalizeIntakeStatus(family.status) : "NEW";
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

          <div className="rounded-xl border border-stone-200 bg-brand-cream/20 px-4 py-4 sm:px-5">
            <p className="section-label">Family journey progress</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              Step {Math.min(currentStepIndex + 1, visibleJourneySteps.length)} of {visibleJourneySteps.length} ·{" "}
              {adminIntakeStatusLabel(family.status)}
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              {visibleJourneySteps.find((step) => step.status === normalizedStatus)?.hint}
            </p>
          </div>

          <details className="group rounded-xl border border-stone-200 bg-white open:shadow-sm">
            <summary className="cursor-pointer list-none px-4 py-4 text-sm font-semibold text-ink marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                Step 1 · Intake details
                <span className="text-xs font-normal text-neutral-500 group-open:hidden">Show family submission</span>
                <span className="hidden text-xs font-normal text-neutral-500 group-open:inline">Hide</span>
              </span>
            </summary>
            <div className="space-y-5 border-t border-stone-100 px-4 py-5 sm:px-5">
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

          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <div className="border-b border-stone-100 bg-brand-cream/15 px-4 py-4 sm:px-5">
              <p className="section-label">Care coordination workflow</p>
              <p className="mt-1 text-sm text-neutral-600">Work through each step in order — the family dashboard updates when you save.</p>
            </div>

            <AdminWorkflowStep
              step={2}
              title="Assign Care Guide"
              description="A named Care Guide reviews the case and supports the family through decisions."
              current={normalizedStatus === "NEW" || normalizedStatus === "CARE_GUIDE_ASSIGNED"}
              complete={currentStepIndex >= 1}
            >
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
              <Button type="button" className={adminActionClass} disabled={!careGuideId || isPending} onClick={() => void saveCareGuide()}>
                Assign Care Guide
              </Button>
            </AdminWorkflowStep>

            <AdminWorkflowStep
              step={3}
              title="Assessment & care plan"
              description="Review intake details, save assessment notes, then publish the care plan for the family."
              current={["CARE_GUIDE_ASSIGNED", "ASSESSMENT", "CARE_PLAN"].includes(normalizedStatus)}
              complete={currentStepIndex >= 3}
            >
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
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button type="button" variant="outline" className={adminActionClass} disabled={savingAssessment || isPending} onClick={() => void saveAssessment()}>
                  {savingAssessment ? "Saving..." : "Save assessment"}
                </Button>
                {["ASSESSMENT", "CARE_GUIDE_ASSIGNED"].includes(family.status) ? (
                  <Button type="button" className={adminActionClass} disabled={savingAssessment || isPending || !carePlanSummary.trim()} onClick={() => void saveAssessment("CARE_PLAN")}>
                    Publish care plan
                  </Button>
                ) : null}
                {["CARE_PLAN", "ASSESSMENT"].includes(family.status) ? (
                  <Button type="button" className={adminActionClass} disabled={savingAssessment || isPending || !carePathway} onClick={() => void saveAssessment("MATCHED")}>
                    Mark matched
                  </Button>
                ) : null}
              </div>
            </AdminWorkflowStep>

            <AdminWorkflowStep
              step={4}
              title="Create provider match"
              description="Add suitable providers to the family shortlist once the care plan is published."
              current={normalizedStatus === "CARE_PLAN" || normalizedStatus === "MATCHED"}
              complete={currentStepIndex >= 4}
            >
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
              <Button type="button" className={adminActionClass} disabled={!providerId || creatingMatch || !matchingAllowed} onClick={() => void createMatch()}>
                {creatingMatch ? "Creating..." : "Create match"}
              </Button>
            </AdminWorkflowStep>

            <AdminWorkflowStep
              step={5}
              title="Schedule visit or callback"
              description="Record the visit or callback date — the family sees this on their dashboard."
              current={normalizedStatus === "MATCHED" || normalizedStatus === "VISIT_SCHEDULED"}
              complete={currentStepIndex >= 5}
            >
              <label className="grid gap-2 text-sm font-medium">
                Visit or callback date & time
                <input
                  type="datetime-local"
                  value={visitScheduledAt}
                  onChange={(event) => setVisitScheduledAt(event.target.value)}
                  className={adminFieldClass}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Type
                <select
                  value={visitType}
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
                  onChange={(event) => setVisitProviderName(event.target.value)}
                  className={adminFieldClass}
                  placeholder="Provider name"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Visit notes
                <textarea
                  value={visitNotes}
                  onChange={(event) => setVisitNotes(event.target.value)}
                  className={`${adminFieldClass} min-h-20`}
                  placeholder="Directions, contact person, what to bring..."
                />
              </label>
              <Button type="button" className={adminActionClass} disabled={savingVisit || isPending || !visitScheduledAt} onClick={() => void saveVisitSchedule()}>
                {savingVisit ? "Saving..." : "Save visit & mark scheduled"}
              </Button>
            </AdminWorkflowStep>

            <AdminWorkflowStep
              step={6}
              title="Advance case status"
              description="Move the family through provider response, placement, follow-ups, or close the case."
              current={currentStepIndex >= 6}
              complete={normalizedStatus === "CLOSED"}
            >
              <div className="space-y-4">
                {nextActions.map((action) => (
                  <div key={action.status} className="rounded-lg border border-stone-100 bg-brand-cream/20 px-4 py-3">
                    <Button
                      className={adminActionClass}
                      variant={action.status === "CLOSED" ? "outline" : "default"}
                      disabled={isPending}
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
                    <p className="mt-2 text-xs leading-5 text-neutral-500">{action.description}</p>
                  </div>
                ))}
              </div>
            </AdminWorkflowStep>
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

  useEffect(() => {
    setRows(inquiries);
    setSelected((current) => {
      if (!current) return null;
      return inquiries.find((item) => item.id === current.id) ?? null;
    });
  }, [inquiries]);

  const sortedInquiries = useMemo(
    () => [...rows].sort((a, b) => compareMatchPriority(a.statusRaw, b.statusRaw)),
    [rows]
  );
  const followUpCount = rows.filter((item) => isAdminActionNeeded(item.statusRaw)).length;

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
                    {inquiry.statusRaw !== "PLACED" && inquiry.statusRaw !== "CLOSED" ? (
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
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => void updateFromPanel(inquiry.id, "PLACED")}>
                  {pendingActionKey === `${inquiry.id}:PLACED` ? "Saving..." : "Confirm"}
                </Button>
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
  const [selected, setSelected] = useState<WaitlistEntry | null>(null);

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

      await recordAction({
        type: "waitlist_contacted",
        targetType: "waitlist",
        targetId: id,
        label: `Marked ${name} as contacted.`,
        payload: { id, name }
      });

      notify(`${name} marked as contacted. Status updated in the waitlist.`);
    } catch {
      notify(`Could not mark ${name} as contacted. Please try again.`);
    } finally {
      setPendingId(null);
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

            return (
              <tr key={entry.id} className="cursor-pointer hover:bg-cream" onClick={() => setSelected(entry)}>
                <td className="px-4 py-3 text-sm text-neutral-600">{entry.type}</td>
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
        pendingId={pendingId}
      />
    </>
  );
}

function WaitlistDetailPanel({
  entry,
  onClose,
  onMarkContacted,
  pendingId
}: {
  entry: WaitlistEntry | null;
  onClose: () => void;
  onMarkContacted: (id: string, name: string, notify?: (message: string) => void) => Promise<void>;
  pendingId: string | null;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();
  const isContacted = entry?.status === "CONTACTED";
  const isPending = entry ? pendingId === entry.id : false;
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
const adminActionClass = "w-full sm:w-auto";

function AdminWorkflowStep({
  step,
  title,
  description,
  current = false,
  complete = false,
  children
}: {
  step: number;
  title: string;
  description?: string;
  current?: boolean;
  complete?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "border-t border-stone-100 px-4 py-5 sm:px-5",
        current && "bg-brand-amber/[0.04]",
        complete && !current && "bg-brand-green-pale/10"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
            current
              ? "bg-brand-amber text-white"
              : complete
                ? "bg-brand-green-dark text-white"
                : "bg-stone-200 text-stone-600"
          )}
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p> : null}
          <div className="mt-4 grid gap-3">{children}</div>
        </div>
      </div>
    </section>
  );
}
