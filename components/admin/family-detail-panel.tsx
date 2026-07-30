"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  DetailList,
  PanelSection,
  PanelTopic,
  panelNoticeTone,
  SlidePanel,
  TagList,
  usePanelMessage
} from "@/components/ui/slide-panel";
import { adminFitLabel, adminMatchScoreBands } from "@/components/ui/match-score";
import { recordAction } from "@/lib/client/actions";
import { cn } from "@/lib/core/utils";
import type { AdminDashboardData } from "@/lib/data/admin";
import { CARE_PATHWAYS } from "@/lib/domain/care-pathways";
import { CASE_OUTCOME_OPTIONS, caseOutcomeEndsCase } from "@/lib/domain/case-outcomes";
import { familyPanelWorkMode, getAdminCaseNextAction } from "@/lib/domain/admin-case-next-action";
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
import { INTAKE_STALE_CONFLICT_MESSAGE, isIntakeStaleConflictError } from "@/lib/domain/intake-stale-conflict";
import { adminMatchNotes, adminMatchStatusLabel, matchStatusBadgeClass } from "@/lib/domain/match-status";
import { isRematchableMatchStatus } from "@/lib/domain/match-rematch";
import { formatReference } from "@/lib/domain/reference";
import type { Locale } from "@/lib/i18n/config";

type FamilyEntry = AdminDashboardData["families"][number];
type CareGuideOption = AdminDashboardData["careGuides"][number];
type ProviderOption = AdminDashboardData["providerList"][number];
type InquiryEntry = AdminDashboardData["inquiries"][number];

const fieldClass = "rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-brand-amber";

function normalizeRecordLocale(value?: string | null): Locale {
  return value === "en" ? "en" : "nl";
}

function localeLanguageLabel(locale: Locale) {
  return locale === "en" ? "English" : "Dutch";
}

function AudienceLocaleNotice({
  audience,
  locale,
  writeTarget
}: {
  audience: "family" | "provider";
  locale: Locale;
  writeTarget?: string;
}) {
  const language = localeLanguageLabel(locale);
  const who = audience === "family" ? "family" : "provider";
  const writeLine = writeTarget ? `Write ${writeTarget} in ${language}` : `Write in ${language}`;

  return (
    <div
      className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950"
      role="note"
    >
      This {who} uses <strong>{language}</strong> in the app and emails. {writeLine} — free text is <strong>not</strong>{" "}
      auto-translated.
    </div>
  );
}

function providerAvailableForMatching(providerId: string, matches: InquiryEntry[]) {
  const existing = matches.find((match) => match.providerId === providerId);
  if (!existing) return { available: true, rematch: false };
  if (isRematchableMatchStatus(existing.statusRaw)) return { available: true, rematch: true };
  return { available: false, rematch: false };
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
        <p className="break-words text-sm font-medium text-ink">{match.provider}</p>
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

function PanelActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">{children}</div>;
}

export function FamilyDetailPanel({
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
  setGlobalMessage,
  onOpenInquiries
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
  onOpenInquiries: (familyName: string) => void;
}) {
  const { message: panelMessage, setMessage: setPanelMessage, clearMessage: clearPanelMessage } = usePanelMessage();
  const previousFamilyIdRef = useRef<string | null>(null);

  function notifyPanel(message: string) {
    setPanelMessage(message);
    setGlobalMessage(message);
  }

  const [providerId, setProviderId] = useState("");
  const selectedProvider = useMemo(
    () => providers.find((item) => item.id === providerId) ?? null,
    [providers, providerId]
  );
  const familyLocale = normalizeRecordLocale(family?.preferredLocale);
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
  const [savingAssessment, setSavingAssessment] = useState(false);
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
      setCaseOutcome(family.caseOutcome || "");
    }
  }, [family, staleConflict, clearPanelMessage, hasUnsavedCaseDraft]);

  const isCaseActionPending = family ? pendingId === family.id && pendingAction !== null : false;
  const normalizedStatus = family ? normalizeIntakeStatus(family.status) : "NEW";
  const isClosedCase = normalizedStatus === "CLOSED";
  const isReadOnlyAssigned = Boolean(family?.careGuideId) && family?.careGuideId !== currentUserId;
  const matchingAllowed =
    family && !isClosedCase && !isReadOnlyAssigned
      ? canCreateMatches(family.status, carePathway || family.carePathway)
      : false;
  const nextAction = family && !isReadOnlyAssigned ? getAdminCaseNextAction(family, matches) : null;
  const workMode = isReadOnlyAssigned ? "done" : familyPanelWorkMode(nextAction);
  const hasMatches = matches.length > 0;
  const hasAcceptedOrContactedMatch = matches.some(
    (match) =>
      match.statusRaw === "ACCEPTED" || match.statusRaw === "CONTACTED" || match.statusRaw === "PLACED"
  );
  const placementActionAllowed =
    !isClosedCase &&
    !isReadOnlyAssigned &&
    (hasAcceptedOrContactedMatch ||
      ["PROVIDER_RESPONSE", "PLACEMENT_IN_PROGRESS", "PLACED"].includes(normalizedStatus));

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
  const shortlistDisabledReason = !hasMatches
    ? "Create at least one provider match before marking the shortlist ready."
    : "";

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
          caseOutcome
            ? `You closed the case for ${family.name} with outcome “${caseOutcome}”.`
            : `You closed the case for ${family.name}.`,
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

    const nextOutcome = caseOutcome || null;
    const shouldClose = !isClosedCase && caseOutcomeEndsCase(nextOutcome);

    if (shouldClose) {
      setConfirmCloseCase(true);
      return;
    }

    setSavingCaseOutcome(true);
    try {
      await onPatchIntake(
        family.id,
        intakePatchBody({ caseOutcome: nextOutcome }),
        family.name,
        nextOutcome
          ? `You updated the case outcome for ${family.name}.`
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
        intakePatchBody({
          careGuideId,
          ...(family.status === "NEW" ? { status: "CARE_GUIDE_ASSIGNED" } : {})
        }),
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

  const selectedProviderRematch = providerId ? providerAvailableForMatching(providerId, matches).rematch : false;

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
  const milestoneAdvanceActions = advanceActions.filter(
    (action) => !workflowManagedAdvanceStatuses.has(action.status)
  );
  const currentStepIndex = family ? journeyStepIndex(family.status) : 0;
  const progressStep = Math.min(currentStepIndex + 1, JOURNEY_STEPS.length);
  const progressPct = Math.round((progressStep / JOURNEY_STEPS.length) * 100);
  const showCloseFooter = !isReadOnlyAssigned && (canCloseCase || isClosedCase || workMode === "advance");
  const hasVisitSnapshot = Boolean(
    family?.visitScheduledAtLabel || family?.visitType || family?.visitProviderName
  );

  function handoffToInquiries() {
    if (!family) return;
    onOpenInquiries(family.name);
    onClose();
  }

  return (
    <SlidePanel
      open={Boolean(family)}
      onClose={onClose}
      size="xl"
      title={family?.name || "Family intake"}
      subtitle={family ? adminIntakeStatusLabel(family.status) : "Care intake details"}
      notice={staleConflict ? undefined : panelMessage}
      noticeTone={staleConflict ? "error" : panelNoticeTone(panelMessage)}
    >
      {family ? (
        <div className="space-y-5">
          <p className="text-sm leading-6 text-neutral-600">
            Guide this family’s care journey here. Visit and provider follow-up happen in Inquiries.
          </p>

          {family.emergencyStopped ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-950">
              <p className="font-semibold">Emergency screening flagged</p>
              <p className="mt-1 leading-6 text-red-900">
                The family was shown 112 instructions and blocked from the normal care-matching journey. Follow up
                after confirming emergency needs are handled.
              </p>
            </div>
          ) : null}

          {family.referralSource === "HOSPITAL" ? (
            <div className="rounded-lg bg-brand-amber/10 px-4 py-3 text-sm text-ink">
              <p className="font-semibold">Hospital referral</p>
              <p className="mt-1 leading-6 text-ink/70">
                Submitted by {family.referringHospitalName || "a hospital"}. Use the same Care Guide workflow as
                family self-serve intakes.
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
                className="mt-3 w-full sm:w-auto"
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
                You can view this case. Only the assigned Care Guide can edit or advance it.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
            <span>
              <span className="text-neutral-400">Care Guide · </span>
              <span className="font-medium text-ink">{family.careGuideName || "Not assigned"}</span>
            </span>
            <span>
              <span className="text-neutral-400">Urgency · </span>
              <span className="font-medium text-ink">{family.urgency}</span>
            </span>
            <span>
              <span className="text-neutral-400">Location · </span>
              <span className="font-medium text-ink">{family.location}</span>
            </span>
          </div>

          {!isClosedCase ? (
            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="font-semibold text-ink">
                  Step {progressStep} of {JOURNEY_STEPS.length} · {adminIntakeStatusLabel(family.status)}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-brand-amber transition-all" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          ) : null}

          {isClosedCase ? (
            <div className="rounded-lg bg-stone-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Case closed</p>
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
            </div>
          ) : nextAction && !isReadOnlyAssigned ? (
            <div
              className={cn(
                "space-y-4 rounded-lg px-4 py-4",
                nextAction.severity === "action"
                  ? "bg-brand-amber/10"
                  : nextAction.severity === "waiting"
                    ? "bg-stone-50"
                    : "bg-brand-green-pale/25"
              )}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-amber-dark">Do this now</p>
                <h3 className="mt-1 text-base font-semibold text-ink">{nextAction.label}</h3>
                <p className="mt-1 text-sm leading-6 text-ink/80">{nextAction.instruction}</p>
              </div>

              {workMode === "assign" ? (
                <div className="space-y-3">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Care Guide
                    <select
                      value={careGuideId}
                      onChange={(event) => setCareGuideId(event.target.value)}
                      className={fieldClass}
                    >
                      <option value="">Select Care Guide</option>
                      {careGuides.map((guide) => (
                        <option key={guide.id} value={guide.id}>
                          {guide.name || guide.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <PanelActions>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={!careGuideId || savingCareGuide}
                      onClick={() => void saveCareGuide()}
                    >
                      {savingCareGuide ? "Saving..." : "Assign Care Guide"}
                    </Button>
                  </PanelActions>
                </div>
              ) : null}

              {workMode === "assessment" ? (
                <div className="space-y-3">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Care pathway
                    <select
                      value={carePathway}
                      onChange={(event) => setCarePathway(event.target.value)}
                      className={fieldClass}
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
                      className={`${fieldClass} min-h-20`}
                      placeholder="Situation, decision-makers, funding…"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Care plan summary (family-facing)
                    <AudienceLocaleNotice audience="family" locale={familyLocale} writeTarget="the care plan summary" />
                    <textarea
                      value={carePlanSummary}
                      onChange={(event) => setCarePlanSummary(event.target.value)}
                      className={`${fieldClass} min-h-20`}
                      placeholder={
                        familyLocale === "en"
                          ? "What the family should see next, in English…"
                          : "What the family should see next, in Dutch…"
                      }
                    />
                  </label>
                  <PanelActions>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={savingAssessment || carePlanButtonMode === "published"}
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
                  </PanelActions>
                </div>
              ) : null}

              {workMode === "match" ? (
                <div className="space-y-3">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Provider
                    <select
                      value={providerId}
                      onChange={(event) => setProviderId(event.target.value)}
                      disabled={!matchingAllowed}
                      className={fieldClass}
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
                  {selectedProvider ? (
                    <p className="text-xs leading-5 text-neutral-600">
                      Selected provider uses{" "}
                      <strong>{localeLanguageLabel(normalizeRecordLocale(selectedProvider.preferredLocale))}</strong>{" "}
                      in the app and emails.
                    </p>
                  ) : null}
                  <label className="grid gap-1.5 text-sm font-medium">
                    Match score (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={score}
                      disabled={!matchingAllowed}
                      onChange={(event) => setScore(event.target.value)}
                      className={fieldClass}
                    />
                    <MatchScoreGuidance score={score} />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Why this match (shown to family)
                    <AudienceLocaleNotice audience="family" locale={familyLocale} writeTarget="this match reason" />
                    <textarea
                      value={familyFacingReason}
                      disabled={!matchingAllowed}
                      onChange={(event) => setFamilyFacingReason(event.target.value)}
                      placeholder={
                        familyLocale === "en"
                          ? "e.g. Strong dementia care and open bed nearby"
                          : "e.g. Sterke dementiezorg en een bed in de buurt"
                      }
                      className={`${fieldClass} min-h-16`}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Internal notes (optional)
                    <textarea
                      value={matchNotes}
                      disabled={!matchingAllowed}
                      onChange={(event) => setMatchNotes(event.target.value)}
                      className={`${fieldClass} min-h-16`}
                    />
                  </label>
                  <PanelActions>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={!providerId || creatingMatch || Boolean(createMatchDisabledReason)}
                      onClick={() => void createMatch()}
                    >
                      {creatingMatch ? "Saving..." : selectedProviderRematch ? "Re-open match" : "Create match"}
                    </Button>
                    {!["MATCHED", "VISIT_SCHEDULED", "PROVIDER_RESPONSE", "PLACEMENT_IN_PROGRESS", "PLACED", "CLOSED"].includes(
                      normalizedStatus
                    ) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={savingAssessment || !carePlanSummary.trim() || Boolean(shortlistDisabledReason)}
                        onClick={() => void markShortlistReady()}
                      >
                        Mark shortlist ready
                      </Button>
                    ) : null}
                  </PanelActions>
                  {createMatchDisabledReason ? (
                    <p className="text-xs leading-5 text-neutral-500">{createMatchDisabledReason}</p>
                  ) : null}
                  {shortlistDisabledReason ? (
                    <p className="text-xs leading-5 text-neutral-500">{shortlistDisabledReason}</p>
                  ) : null}
                  <div className="border-t border-stone-200/80 pt-3">
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
              ) : null}

              {workMode === "waiting" ? (
                <p className="text-sm leading-6 text-neutral-600">{nextAction.description}</p>
              ) : null}

              {workMode === "handoff" ? (
                <PanelActions>
                  <Button type="button" size="sm" className="w-full sm:w-auto" onClick={handoffToInquiries}>
                    Open in Inquiries
                  </Button>
                </PanelActions>
              ) : null}

              {workMode === "advance" ? (
                <div className="space-y-3">
                  {nextAction.key === "CLOSED" ? (
                    <p className="text-sm leading-6 text-neutral-600">
                      Use Close case below to record the outcome and finish this journey.
                    </p>
                  ) : milestoneAdvanceActions.length ? (
                    milestoneAdvanceActions.map((action) => {
                      const disabledReason =
                        (action.status === "PLACEMENT_IN_PROGRESS" || action.status === "PLACED") &&
                        !placementActionAllowed
                          ? "Coordinate with an accepted provider in Inquiries first."
                          : "";

                      return (
                        <div
                          key={action.status}
                          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <p className="text-sm text-neutral-600">{disabledReason || action.description}</p>
                          <Button
                            size="sm"
                            className="w-full shrink-0 sm:w-auto"
                            disabled={isCaseActionPending || Boolean(disabledReason)}
                            onClick={() => void handleCaseAction(action.status)}
                          >
                            {isCaseActionPending && pendingAction === action.status ? "Saving..." : action.label}
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm leading-6 text-neutral-600">No milestone actions available yet.</p>
                  )}
                </div>
              ) : null}

              {workMode === "done" ? (
                <p className="text-sm text-neutral-500">No further action on this case.</p>
              ) : null}
            </div>
          ) : null}

          <div className="divide-y divide-stone-100 border-t border-stone-100">
            <PanelTopic title="Contact" defaultOpen={false}>
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
            <PanelTopic title="Safety & emergency" defaultOpen={false}>
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
            <PanelTopic title="Decision support" defaultOpen={false}>
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
            <PanelTopic title="Care needs" defaultOpen={false}>
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
                    <TagList
                      items={
                        family.careTypes?.length
                          ? family.careTypes
                          : family.care
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean)
                      }
                    />
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
                  <p className="mt-1.5 text-sm font-medium text-ink">{localeLanguageLabel(familyLocale)}</p>
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
              <PanelTopic title="Family notes" defaultOpen={false}>
                <p className="text-sm leading-7 text-neutral-700">{family.notes}</p>
              </PanelTopic>
            ) : null}
            {hasVisitSnapshot ? (
              <PanelTopic title="Visit snapshot" defaultOpen={false}>
                <DetailList
                  columns={1}
                  items={[
                    { label: "Visit scheduled", value: family.visitScheduledAtLabel },
                    { label: "Visit type", value: family.visitType },
                    { label: "Visit provider", value: family.visitProviderName },
                    { label: "Visit notes", value: family.visitNotes }
                  ]}
                />
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  To confirm slots or arrange visits, use Inquiries.
                </p>
              </PanelTopic>
            ) : null}
            {hasMatches ? (
              <PanelTopic title="Provider matches" defaultOpen={false}>
                <div className="divide-y divide-stone-100">
                  {matches.map((match) => (
                    <SavedProviderMatchCard key={match.id} match={match} />
                  ))}
                </div>
              </PanelTopic>
            ) : null}
            <PanelTopic title="Case record" defaultOpen={false}>
              <DetailList
                columns={1}
                items={[
                  { label: "Reference", value: formatReference(family.id) },
                  { label: "Intake ID", value: family.id },
                  { label: "Case outcome", value: family.caseOutcome },
                  { label: "Consent accepted", value: family.consentAcceptedAt },
                  { label: "Consent version", value: family.consentVersion },
                  { label: "Care pathway", value: family.carePathway },
                  { label: "7-day follow-up", value: family.followUp7At },
                  { label: "30-day follow-up", value: family.followUp30At },
                  { label: "90-day follow-up", value: family.followUp90At },
                  { label: "Submitted", value: family.createdAt },
                  { label: "Last updated", value: family.updatedAt }
                ]}
              />
            </PanelTopic>
          </div>

          {showCloseFooter ? (
            <PanelSection
              title="Close case"
              description="Record why the case is ending. This closes the whole family journey."
              collapsible
              defaultOpen={nextAction?.key === "CLOSED" || isClosedCase}
            >
              <div className="space-y-3">
                <CustomSelect
                  label="Outcome"
                  value={caseOutcome}
                  placeholder="Select outcome"
                  options={CASE_OUTCOME_OPTIONS}
                  onChange={setCaseOutcome}
                />
                {caseOutcome ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-neutral-500 underline-offset-2 hover:text-ink hover:underline"
                    onClick={() => setCaseOutcome("")}
                  >
                    Clear selection
                  </button>
                ) : null}
                <p className="text-xs leading-5 text-neutral-500">
                  {isClosedCase
                    ? "This case is closed. You can still update or clear the recorded outcome."
                    : caseOutcome
                      ? `“${caseOutcome}” will close this case for the family.`
                      : "Choose an outcome, then apply it to close this case."}
                </p>
                <PanelActions>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:w-auto"
                    variant={isClosedCase ? "outline" : "primary"}
                    disabled={
                      savingCaseOutcome ||
                      isCaseActionPending ||
                      caseOutcome === (family.caseOutcome || "") ||
                      (!isClosedCase && !caseOutcome)
                    }
                    onClick={() => void saveCaseOutcome()}
                  >
                    {savingCaseOutcome || (isCaseActionPending && pendingAction === "CLOSED")
                      ? "Saving..."
                      : isClosedCase
                        ? caseOutcome
                          ? "Update outcome"
                          : "Clear outcome"
                        : "Apply outcome & close case"}
                  </Button>
                </PanelActions>
              </div>
            </PanelSection>
          ) : null}
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmCloseCase}
        tone="danger"
        pending={isCaseActionPending && pendingAction === "CLOSED"}
        title="Apply outcome and close this case?"
        description={
          caseOutcome
            ? `This records “${caseOutcome}” and closes the entire family journey. The family dashboard shows the case as archived and provider matching stops.`
            : "Select a case outcome before closing."
        }
        confirmLabel="Apply & close"
        onCancel={() => setConfirmCloseCase(false)}
        onConfirm={() => {
          if (!caseOutcome) {
            notifyPanel("Select a case outcome before closing.");
            setConfirmCloseCase(false);
            return;
          }
          void handleCaseAction("CLOSED");
        }}
      />
    </SlidePanel>
  );
}
