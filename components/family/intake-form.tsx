"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/i18n/locale-provider";
import { fieldLabel, formatOptionalLabel, optionLabel, productUi } from "@/lib/i18n/ui";
import type { Locale } from "@/lib/i18n/config";
import { INTAKE_SAFETY_STEP_INDEX, intakeStepsFor, type IntakeField } from "@/lib/config/content";
import { siteTagline } from "@/lib/config/marketing-en";
import { usePrelaunch } from "@/components/layout/prelaunch-context";
import { selectFamilyIntake, withIntakeId, isHistoryIntake } from "@/lib/client/case-selection";
import {
  fieldKeyFor,
  getSessionFamilyIntakes,
  intakeDecisionMakers,
  intakeToForm,
  type FamilyDecisionMaker,
  type FamilyIntake
} from "@/lib/client/intake";
import {
  chipFieldComplete,
  DECISION_MAKER_RESPONSIBILITY_OPTIONS,
  decisionMakerRelationshipOptions,
  INTAKE_OTHER_OPTION,
  isEmergencyIntakeStop,
  otherFieldKey,
  resolveChipField,
  resolveIntakeRelationship,
  selectFieldComplete,
  splitSelectForForm
} from "@/lib/domain/intake-field-utils";
import { canFamilyEditIntake, familyIntakeEditBlockedMessage } from "@/lib/domain/intake-workflow";
import { intakeConsentLabel } from "@/lib/domain/intake-consent";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CustomSelect } from "@/components/ui/custom-select";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  formatFieldErrorSummary,
  intakeFieldEnglishLabel,
  intakeFieldLabel,
  parseZodFieldErrors
} from "@/lib/client/api-field-errors";
import { cn } from "@/lib/core/utils";

type Field = IntakeField;
type FormState = Record<string, string | string[]>;

type DecisionMakerDraft = {
  name: string;
  relationship: string;
  relationshipOther: string;
  responsibilities: string[];
};

function emptyDecisionMaker(): DecisionMakerDraft {
  return { name: "", relationship: "", relationshipOther: "", responsibilities: [] };
}

function draftsFromIntake(intake: FamilyIntake | null): DecisionMakerDraft[] {
  const makers = intake ? intakeDecisionMakers(intake) : [{ name: "", relationship: "", responsibilities: [] }];
  return makers.map((maker) => {
    const split = splitSelectForForm(maker.relationship, decisionMakerRelationshipOptions);
    return {
      name: maker.name,
      relationship: split.value,
      relationshipOther: split.other,
      responsibilities: maker.responsibilities ?? []
    };
  });
}

function resolveDecisionMakers(drafts: DecisionMakerDraft[]): FamilyDecisionMaker[] {
  return drafts
    .map((draft) => {
      const relationship =
        draft.relationship === INTAKE_OTHER_OPTION ? draft.relationshipOther.trim() : draft.relationship.trim();
      return {
        name: draft.name.trim(),
        relationship,
        responsibilities: draft.responsibilities
      };
    })
    .filter((maker) => maker.name || maker.relationship);
}

export function IntakeForm() {
  return (
    <Suspense fallback={<IntakeFormSkeleton />}>
      <IntakeFormRouter />
    </Suspense>
  );
}

function IntakeFormRouter() {
  const searchParams = useSearchParams();
  const isUpdateMode = searchParams.get("update") === "1";
  const requestedIntakeId = searchParams.get("intakeId");
  const fromWaitlist = searchParams.get("from") === "waitlist";
  const mode = isUpdateMode ? `update-${requestedIntakeId || "missing"}` : "new";

  return <IntakeFormContent key={mode} isUpdateMode={isUpdateMode} requestedIntakeId={requestedIntakeId} fromWaitlist={fromWaitlist} />;
}

function IntakeFormContent({
  isUpdateMode,
  requestedIntakeId,
  fromWaitlist
}: {
  isUpdateMode: boolean;
  requestedIntakeId: string | null;
  fromWaitlist: boolean;
}) {
  const router = useRouter();
  const { locale, ui } = useLocale();
  const isPrelaunch = usePrelaunch();
  const intakeSteps = useMemo(() => intakeStepsFor(locale), [locale]);
  const tagline = siteTagline(locale);

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>({});
  const [decisionMakers, setDecisionMakers] = useState<DecisionMakerDraft[]>([emptyDecisionMaker()]);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [existingIntake, setExistingIntake] = useState<FamilyIntake | null>(null);
  const [savedIntakeId, setSavedIntakeId] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [emergencySubmitted, setEmergencySubmitted] = useState(false);

  const step = intakeSteps[stepIndex];
  const isFinal = stepIndex === intakeSteps.length - 1;
  const progress = ((stepIndex + 1) / intakeSteps.length) * 100;
  const isUpdating = isUpdateMode && Boolean(existingIntake?.id);
  const intakeLocked = isUpdating && existingIntake ? !canFamilyEditIntake(existingIntake.status) : false;

  const emergencyStop = isEmergencyIntakeStop({
    personSafeTonight: String(form["is-the-person-currently-safe-tonight"] || ""),
    urgentMedicalHelp: String(form["is-urgent-medical-help-required"] || ""),
    immediateRiskFlags: asArray(form["immediate-risk-flags"])
  });
  const isSafetyStep = stepIndex === INTAKE_SAFETY_STEP_INDEX;

  useEffect(() => {
    let active = true;

    setStatus("");
    setStatusTone("success");
    setFieldErrors({});
    setSubmitting(false);
    setEmergencySubmitted(false);

    async function loadExistingIntake() {
      const result = await getSessionFamilyIntakes();
      const intakes = result.status === "ok" ? result.intakes : [];
      const activeIntake = intakes.find((item) => !isHistoryIntake(item)) ?? intakes[0] ?? null;

      if (!isUpdateMode) {
        if (!active) return;
        setSavedIntakeId(activeIntake?.id ?? null);
        setExistingIntake(null);
        setForm({});
        setDecisionMakers([emptyDecisionMaker()]);
        setConsentAccepted(false);
        setStepIndex(0);
        setReady(true);
        return;
      }

      const selection = intakes.length ? selectFamilyIntake(intakes, requestedIntakeId) : { state: "none" as const, intake: null };
      const intake = selection.state === "selected" ? selection.intake : null;

      if (!active) return;

      setSavedIntakeId(activeIntake?.id ?? null);
      setExistingIntake(intake);
      setConsentAccepted(false);
      if (intake) {
        setForm(intakeToForm(intake));
        setDecisionMakers(draftsFromIntake(intake));
        if (intake.emergencyStopped) {
          setEmergencySubmitted(true);
        }
      } else {
        setForm({});
        setDecisionMakers([emptyDecisionMaker()]);
        if (selection.state === "needs-picker") {
          setStatus(ui.intake.chooseUpdate);
        } else if (selection.state === "not-found") {
          setStatus(ui.family.caseNotFound);
        }
      }
      setReady(true);
    }

    void loadExistingIntake();

    return () => {
      active = false;
    };
  }, [isUpdateMode, requestedIntakeId]);

  const decisionMakersComplete = useMemo(() => {
    const resolved = resolveDecisionMakers(decisionMakers);
    return (
      resolved.length > 0 &&
      decisionMakers.every((draft) => {
        if (!draft.name.trim()) return false;
        if (!draft.relationship.trim()) return false;
        if (draft.relationship === INTAKE_OTHER_OPTION && !draft.relationshipOther.trim()) return false;
        return true;
      })
    );
  }, [decisionMakers]);

  const canContinue = useMemo(() => {
    if (isSafetyStep && emergencyStop) return false;
    const required = step.fields.filter((field) => {
      if (field.type === "notice" || field.type === "textarea" || field.type === "date") return false;
      if (field.type === "decisionMakers") return true;
      if ("optional" in field && field.optional) return false;
      return true;
    });
    return required.every((field) => {
      if (field.type === "decisionMakers") return decisionMakersComplete;
      return fieldIsComplete(field, form);
    });
  }, [decisionMakersComplete, emergencyStop, form, isSafetyStep, step.fields]);

  function setValue(label: string, value: string) {
    setForm((current) => {
      const next = { ...current, [fieldKeyFor(label)]: value };
      if (value !== INTAKE_OTHER_OPTION) {
        delete next[otherFieldKey(label)];
      }
      return next;
    });
    const key = fieldKeyFor(label);
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function setOtherValue(label: string, value: string) {
    setForm((current) => ({ ...current, [otherFieldKey(label)]: value }));
  }

  function toggleChip(label: string, option: string) {
    setForm((current) => {
      const key = fieldKeyFor(label);
      const selected = Array.isArray(current[key]) ? current[key] : [];
      const nextSelected = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
      const next = { ...current, [key]: nextSelected };
      if (!nextSelected.includes(INTAKE_OTHER_OPTION)) {
        delete next[otherFieldKey(label)];
      }
      return next;
    });
  }

  function updateDecisionMaker(index: number, patch: Partial<DecisionMakerDraft>) {
    setDecisionMakers((current) => current.map((maker, i) => (i === index ? { ...maker, ...patch } : maker)));
  }

  function toggleResponsibility(index: number, option: string) {
    setDecisionMakers((current) =>
      current.map((maker, i) => {
        if (i !== index) return maker;
        const selected = maker.responsibilities.includes(option)
          ? maker.responsibilities.filter((item) => item !== option)
          : [...maker.responsibilities, option];
        return { ...maker, responsibilities: selected };
      })
    );
  }

  function buildPayload(options?: { emergencyStopped?: boolean; requireConsent?: boolean }) {
    const makers = resolveDecisionMakers(decisionMakers);
    const first = makers[0];
    return {
      contactName: String(form["your-name"] || "").trim(),
      email: String(form["email-address"] || "").trim(),
      phone: String(form["phone-number"] || "").trim(),
      relationship: resolveIntakeRelationship(form),
      preferredArea: String(form["preferred-city-or-province"] || "").trim(),
      preferredDistance: String(form["preferred-distance-from-your-location"] || "").trim(),
      ageRange: String(form["age-range"] || "").trim(),
      livingSituation: String(form["current-living-situation"] || "").trim(),
      mobility: String(form["mobility-level"] || "").trim(),
      medicalSupportNeeds: String(form["medical-or-nursing-support-needed"] || "").trim(),
      dementiaNeeds: String(form["dementia-or-memory-care-needs"] || "").trim(),
      careTypes: asArray(form["type-of-care-needed"]),
      urgency: String(form["how-urgent-is-the-care-need"] || "").trim(),
      hospitalDischargeDate: String(form["hospital-discharge-date-if-applicable"] || "").trim() || undefined,
      decisionMakers: makers,
      decisionMakerName: first?.name || "",
      decisionMakerRelationship: first?.relationship || "",
      seniorAgreedToSearch: String(form["has-the-person-needing-care-agreed-to-this-search"] || "").trim(),
      decisionParticipants: String(form["who-else-participates-in-care-decisions"] || "").trim(),
      supportTypes: asArray(form["type-of-support-you-need"] || form["type-of-support-your-family-needs"]),
      emotionalSupportNeeds: asArray(form["emotional-support-needs"]),
      fundingTypes: asArray(form["funding-types"]),
      budget: String(form["monthly-budget-range"] || "").trim(),
      functionalNeeds: asArray(form["functional-needs"]),
      placementPreferences: asArray(form["placement-preferences"]),
      languages: resolveChipField(form, "Preferred languages"),
      additionalNeeds: asArray(form["additional-needs"]),
      moveInTimeline: String(form["desired-move-in-timeline"] || "").trim(),
      notes: String(form["anything-else-we-should-know"] || "").trim(),
      personSafeTonight: String(form["is-the-person-currently-safe-tonight"] || "").trim(),
      urgentMedicalHelp: String(form["is-urgent-medical-help-required"] || "").trim(),
      canRemainHomeTonight: String(form["can-the-person-remain-at-home-tonight"] || "").trim(),
      caregiverBurnoutRisk: String(form["is-the-caregiver-at-risk-of-burnout"] || "").trim(),
      immediateRiskFlags: asArray(form["immediate-risk-flags"]),
      emergencyStopped: Boolean(options?.emergencyStopped),
      ...(options?.requireConsent === false ? {} : { consentAccepted: true as const })
    };
  }

  async function submit(options?: { emergencyStopped?: boolean }) {
    if (isUpdateMode && !existingIntake) {
      setStatus(ui.intake.chooseUpdate);
      return;
    }

    const isEmergency = Boolean(options?.emergencyStopped);
    if (!isEmergency && !consentAccepted) {
      setStatusTone("error");
      setStatus(ui.intake.consentRequired);
      return;
    }

    setSubmitting(true);
    setStatus("");
    setStatusTone("success");
    setFieldErrors({});

    const payload = buildPayload({
      emergencyStopped: isEmergency,
      requireConsent: !isEmergency
    });

    if (!payload.contactName || !payload.email || !payload.preferredArea || !payload.relationship || !payload.phone) {
      setStatusTone("error");
      setStatus(ui.intake.completeContact);
      setSubmitting(false);
      return;
    }

    if (!isEmergency) {
      if (
        !payload.preferredDistance ||
        !payload.ageRange ||
        !payload.careTypes.length ||
        !payload.urgency ||
        !payload.medicalSupportNeeds ||
        !payload.decisionMakers.length ||
        !payload.personSafeTonight ||
        !payload.urgentMedicalHelp ||
        !payload.canRemainHomeTonight ||
        !payload.caregiverBurnoutRisk ||
        !payload.seniorAgreedToSearch
      ) {
        setStatus(ui.intake.completeRequired);
        setSubmitting(false);
        return;
      }
    }

    setStatus(isEmergency ? ui.intake.notifyingGuide : isUpdating ? ui.intake.updating : ui.intake.submitting);

    const response = await fetch(isUpdating ? `/api/intakes/${existingIntake!.id}` : "/api/intakes", {
      method: isUpdating ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      const apiErrors = parseZodFieldErrors(data);
      if (Object.keys(apiErrors).length) {
        const mapped: Record<string, string> = {};
        for (const [apiKey, message] of Object.entries(apiErrors)) {
          mapped[fieldKeyFor(intakeFieldEnglishLabel(apiKey))] = message;
        }
        setFieldErrors(mapped);
        setStatusTone("error");
        setStatus(
          formatFieldErrorSummary(apiErrors, (key) => intakeFieldLabel(key, locale)) ||
            data.error ||
            ui.intake.fixFields
        );
      } else {
        setStatusTone("error");
        setStatus(data.error || ui.intake.tryAgain);
      }
      setSubmitting(false);
      return;
    }

    const saved = (await response.json().catch(() => ({}))) as { id?: string; emergencyStopped?: boolean };
    const nextIntakeId = isUpdating ? existingIntake!.id : saved.id;

    if (isEmergency || saved.emergencyStopped) {
      setEmergencySubmitted(true);
      setSavedIntakeId(nextIntakeId ?? savedIntakeId);
      setStatusTone("success");
      setStatus(ui.intake.emergencyNotified);
      setSubmitting(false);
      return;
    }

    // Keep the completed last step visible while navigating — do not clear fields or jump to step 1.
    setStatusTone("success");
    setStatus(isUpdating ? ui.intake.statusUpdated : ui.intake.statusSubmitted);
    router.replace(nextIntakeId ? withIntakeId("/family/dashboard", nextIntakeId) : "/family/dashboard");
  }

  if (!ready) {
    return <IntakeFormSkeleton />;
  }

  if (emergencySubmitted) {
    return (
      <section className="mx-auto max-w-3xl overflow-hidden rounded-card bg-white shadow-panel">
        <div className="border-b border-red-200 bg-red-50 px-8 py-7">
          <h1 className="font-brand text-[1.35rem] font-semibold text-red-900">{ui.intake.emergencyTitle}</h1>
          <p className="mt-2 text-sm leading-relaxed text-red-800">{ui.intake.emergencyLead}</p>
        </div>
        <div className="space-y-4 px-8 py-7 text-sm leading-relaxed text-ink/80">
          <p>{ui.intake.emergencyBody}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{ui.intake.emergencyCall112}</li>
            <li>{ui.intake.emergencyStay}</li>
            <li>{ui.intake.emergencyFollowUp}</li>
          </ul>
          {savedIntakeId ? (
            <Button asChild size="sm">
              <Link href={withIntakeId("/family/dashboard", savedIntakeId)}>{ui.intake.goToDashboard}</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/">{ui.intake.backHome}</Link>
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl overflow-hidden rounded-card bg-white shadow-panel lg:grid-cols-[380px_minmax(0,1fr)]">
      <header className="bg-brand-green-dark px-8 py-7 text-white">
        <h1 className="font-brand text-[1.3rem] font-semibold">{ui.intake.sidebarTitle}</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-white/80">
          {isUpdating ? ui.intake.sidebarUpdateIntro : ui.intake.sidebarIntro(tagline)}
        </p>
        {!isUpdateMode && savedIntakeId ? (
          <div className="mt-5">
            <Button asChild size="sm" variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link href={withIntakeId("/family/dashboard", savedIntakeId)}>{ui.intake.goToDashboard}</Link>
            </Button>
            <p className="mt-2 text-[12px] leading-relaxed text-white/65">{ui.intake.existingRequestHint}</p>
          </div>
        ) : null}
        <div className="mt-4">
          <ProgressBar value={progress} trackClassName="bg-white/25" />
        </div>
        <div className="mt-8 hidden space-y-4 text-sm text-white/75 lg:block">
          {intakeSteps.map((item, index) => (
            <div
              key={`${index}-${item.title}`}
              className={
                index === stepIndex
                  ? "font-semibold text-brand-amber"
                  : index < stepIndex
                    ? "text-brand-green-pale"
                    : ""
              }
            >
              {index + 1}. {item.title}
            </div>
          ))}
        </div>
      </header>

      <div className="px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
        {fromWaitlist && !isPrelaunch && !isUpdateMode ? (
          <div className="mb-5 rounded-lg border border-brand-green-pale/60 bg-brand-green-pale/20 px-4 py-3 text-sm text-brand-green-dark">
            {ui.intake.waitlistBanner}
          </div>
        ) : null}

        {isUpdateMode && !existingIntake ? (
          <div className="mb-5 rounded-lg bg-brand-beige-light/40 px-4 py-3 text-sm text-brand-amber-dark">
            {ui.intake.chooseUpdateBanner}{" "}
            <Link href="/family/dashboard" className="font-semibold underline underline-offset-2">
              {ui.intake.openYourRequests}
            </Link>
          </div>
        ) : null}

        {intakeLocked && existingIntake ? (
          <div className="mb-5 rounded-lg border border-stone-200 bg-brand-cream px-4 py-4 text-sm leading-6 text-ink/75">
            <p>{familyIntakeEditBlockedMessage(existingIntake.status, locale)}</p>
            <div className="mt-4">
              <Button asChild size="sm">
                <Link href={withIntakeId("/family/dashboard", existingIntake.id)}>{ui.intake.backToDashboard}</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {!intakeLocked ? (
          <>
            <p className="section-label mb-5">
              {ui.intake.stepOf(stepIndex + 1, intakeSteps.length)} — {step.title}
            </p>
            <div className="grid gap-x-5 md:grid-cols-2">
              {step.fields.map((field) =>
                field.type === "decisionMakers" ? (
                  <DecisionMakersField
                    key="decision-makers"
                    makers={decisionMakers}
                    onChange={updateDecisionMaker}
                    onToggleResponsibility={toggleResponsibility}
                    onAdd={() => setDecisionMakers((current) => [...current, emptyDecisionMaker()])}
                    onRemove={(index) =>
                      setDecisionMakers((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)))
                    }
                    error={fieldErrors["decision-makers"]}
                  />
                ) : (
                  renderField(field, form, setValue, setOtherValue, toggleChip, locale, ui, fieldErrors)
                )
              )}
            </div>

            {isSafetyStep && emergencyStop ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm leading-relaxed text-red-900 md:col-span-2">
                <p className="font-semibold">{ui.intake.safetyStopTitle}</p>
                <p className="mt-2">{ui.intake.safetyStopBody}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" disabled={submitting} onClick={() => void submit({ emergencyStopped: true })}>
                    {submitting ? ui.family.sending : ui.intake.notifyGuideCta}
                  </Button>
                </div>
              </div>
            ) : null}

            {isFinal ? (
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--card-border)] bg-brand-cream/60 px-4 py-3 text-sm leading-relaxed text-ink/85 md:col-span-2">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(event) => setConsentAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--card-border)] text-brand-amber focus:ring-brand-amber"
                  required
                />
                <span>{intakeConsentLabel(locale)}</span>
              </label>
            ) : null}

            {status ? (
              <p
                className={cn(
                  "mt-4 rounded-lg p-3 text-sm",
                  statusTone === "error" ? "border border-red-200 bg-red-50 text-red-800" : "bg-brand-green-pale/30 text-brand-green-dark"
                )}
              >
                {status}
              </p>
            ) : null}

            <div className="relative z-10 mt-7 flex flex-col gap-4 border-t border-[var(--card-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                {intakeSteps.map((item, index) => (
                  <span
                    key={item.title}
                    className={`h-2.5 w-2.5 rounded-full border ${
                      index === stepIndex
                        ? "border-brand-amber bg-brand-amber"
                        : index < stepIndex
                          ? "border-brand-green-light bg-brand-green-light"
                          : "border-[var(--chip-border)] bg-transparent"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStepIndex((value) => value - 1)}>
                    {ui.intake.back}
                  </Button>
                )}
                {isFinal ? (
                  <Button type="button" className="min-w-[140px]" disabled={submitting || !consentAccepted} onClick={() => void submit()}>
                    {submitting
                      ? isUpdating
                        ? ui.intake.updating
                        : ui.intake.submitting
                      : isUpdating
                        ? ui.intake.update
                        : ui.intake.submit}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={!canContinue || (isSafetyStep && emergencyStop)}
                    onClick={() => setStepIndex((value) => value + 1)}
                  >
                    {ui.intake.continue}
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function DecisionMakersField({
  makers,
  onChange,
  onToggleResponsibility,
  onAdd,
  onRemove,
  error
}: {
  makers: DecisionMakerDraft[];
  onChange: (index: number, patch: Partial<DecisionMakerDraft>) => void;
  onToggleResponsibility: (index: number, option: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  error?: string;
}) {
  const { locale, ui } = useLocale();
  const baseInput =
    "w-full rounded-lg border-[1.5px] border-[var(--card-border)] bg-white px-3.5 py-2.5 text-body text-ink outline-none transition focus:border-brand-amber";

  return (
    <div className="mb-5 space-y-4 md:col-span-2">
      <div>
        <p className="text-sm font-medium">{fieldLabel(locale, "Decision-makers")}</p>
        <p className="mt-1 text-xs text-ink/60">{ui.intake.decisionMakerHint}</p>
      </div>
      {makers.map((maker, index) => (
        <div key={index} className="rounded-lg border border-[var(--card-border)] bg-brand-cream/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">{ui.intake.decisionMakerN(index + 1)}</p>
            {makers.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
                {ui.intake.remove}
              </Button>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium">
              <span className="mb-1.5 block">{ui.intake.decisionMakerName}</span>
              <input
                value={maker.name}
                onChange={(event) => onChange(index, { name: event.target.value })}
                className={baseInput}
                placeholder={ui.intake.nameExample}
              />
            </label>
            <div>
              <CustomSelect
                className="w-full"
                label={ui.intake.decisionMakerRelationship}
                value={maker.relationship}
                options={decisionMakerRelationshipOptions}
                formatOption={(value) => optionLabel(locale, value)}
                onChange={(value) =>
                  onChange(index, {
                    relationship: value,
                    ...(value !== INTAKE_OTHER_OPTION ? { relationshipOther: "" } : {})
                  })
                }
              />
              {maker.relationship === INTAKE_OTHER_OPTION ? (
                <label className="mt-3 block text-sm font-medium">
                  <span className="mb-1.5 block">{ui.intake.describeRole}</span>
                  <input
                    value={maker.relationshipOther}
                    onChange={(event) => onChange(index, { relationshipOther: event.target.value })}
                    className={baseInput}
                    placeholder={ui.intake.describeRole}
                  />
                </label>
              ) : null}
            </div>
          </div>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium">{ui.intake.decisionMakerResponsibilities}</legend>
            <div className="flex flex-wrap gap-2">
              {DECISION_MAKER_RESPONSIBILITY_OPTIONS.map((option) => {
                const selected = maker.responsibilities.includes(option);
                return (
                  <Chip key={option} selected={selected} onClick={() => onToggleResponsibility(index, option)}>
                    {optionLabel(locale, option)}
                  </Chip>
                );
              })}
            </div>
          </fieldset>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        {ui.intake.addDecisionMaker}
      </Button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

function IntakeFormSkeleton() {
  return (
    <section className="mx-auto max-w-7xl overflow-hidden rounded-card bg-white shadow-panel lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="h-48 animate-pulse bg-brand-green-dark/20 lg:h-auto" />
      <div className="space-y-4 p-8">
        <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
        <div className="h-10 animate-pulse rounded bg-stone-100" />
        <div className="h-10 animate-pulse rounded bg-stone-100" />
      </div>
    </section>
  );
}

function fieldIsComplete(field: Field, form: FormState) {
  if (field.type === "notice" || field.type === "textarea" || field.type === "date" || field.type === "decisionMakers") {
    return true;
  }

  if ("optional" in field && field.optional) {
    return true;
  }

  if (field.type === "select") {
    return selectFieldComplete(form, field.label, field.options);
  }

  if (field.type === "chips") {
    if ("allowsOther" in field && field.allowsOther) {
      return chipFieldComplete(form, field.label);
    }
    const value = form[fieldKeyFor(field.label)];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }

  const value = form[fieldKeyFor(field.label)];
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function renderField(
  field: Field,
  form: FormState,
  setValue: (label: string, value: string) => void,
  setOtherValue: (label: string, value: string) => void,
  toggleChip: (label: string, option: string) => void,
  locale: Locale,
  ui: ReturnType<typeof productUi>,
  fieldErrors: Record<string, string> = {}
) {
  const baseInput =
    "w-full rounded-lg border-[1.5px] bg-white px-3.5 py-2.5 text-body text-ink outline-none transition focus:border-brand-amber";
  const inputClass = (key: string) =>
    cn(baseInput, fieldErrors[key] ? "border-red-500 ring-1 ring-red-200" : "border-[var(--card-border)]");

  if (field.type === "notice") {
    return (
      <div
        key={field.text}
        className="mb-5 rounded-lg bg-brand-green-pale/25 p-4 text-[13px] leading-relaxed text-brand-green-dark md:col-span-2"
      >
        {field.text}
      </div>
    );
  }

  if (field.type === "decisionMakers") {
    return null;
  }

  const key = fieldKeyFor(field.label);
  const fieldError = fieldErrors[key];
  const otherKey = otherFieldKey(field.label);
  const otherPlaceholder = ("otherPlaceholder" in field && field.otherPlaceholder) || ui.intake.specifyOther;
  const optional = "optional" in field && field.optional;
  const displayLabel = formatOptionalLabel(locale, field.label, optional);

  if (field.type === "select") {
    const selected = String(form[key] || "");
    return (
      <div key={field.label} className="mb-5 md:col-span-2">
        <CustomSelect
          className="w-full"
          label={displayLabel}
          value={selected}
          options={field.options}
          formatOption={(value) => optionLabel(locale, value)}
          placeholder={ui.intake.selectPlaceholder}
          onChange={(value) => setValue(field.label, value)}
        />
        {fieldError ? <p className="mt-1 text-xs text-red-700">{fieldError}</p> : null}
        {selected === INTAKE_OTHER_OPTION ? (
          <label className="mt-3 block text-sm font-medium">
            <span className="mb-1.5 block">{otherPlaceholder}</span>
            <input
              value={String(form[otherKey] || "")}
              onChange={(event) => setOtherValue(field.label, event.target.value)}
              className={inputClass(otherKey)}
              placeholder={otherPlaceholder}
            />
          </label>
        ) : null}
      </div>
    );
  }

  if (field.type === "chips") {
    const selected = asArray(form[key]);
    const allowsOther = "allowsOther" in field && field.allowsOther;
    return (
      <fieldset key={field.label} className="mb-5 md:col-span-2">
        <legend className="mb-2 text-sm font-medium">{displayLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {field.options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <Chip key={option} selected={isSelected} onClick={() => toggleChip(field.label, option)}>
                {optionLabel(locale, option)}
              </Chip>
            );
          })}
        </div>
        {fieldError ? <p className="mt-2 text-xs text-red-700">{fieldError}</p> : null}
        {allowsOther && selected.includes(INTAKE_OTHER_OPTION) ? (
          <label className="mt-3 block text-sm font-medium">
            <span className="mb-1.5 block">{otherPlaceholder}</span>
            <input
              value={String(form[otherKey] || "")}
              onChange={(event) => setOtherValue(field.label, event.target.value)}
              className={baseInput}
              placeholder={otherPlaceholder}
            />
          </label>
        ) : null}
      </fieldset>
    );
  }

  if (field.type === "textarea") {
    return (
      <label key={field.label} className="mb-5 block text-sm font-medium md:col-span-2">
        <span className="mb-1.5 block">{displayLabel}</span>
        <textarea
          value={String(form[key] || "")}
          onChange={(event) => setValue(field.label, event.target.value)}
          className={cn(inputClass(key), "min-h-20 resize-y")}
          placeholder={field.placeholder}
        />
        {fieldError ? <p className="mt-1 text-xs text-red-700">{fieldError}</p> : null}
      </label>
    );
  }

  if (field.type === "date") {
    return (
      <label key={field.label} className="mb-5 block text-sm font-medium">
        <span className="mb-1.5 block">{displayLabel}</span>
        <input
          value={String(form[key] || "")}
          onChange={(event) => setValue(field.label, event.target.value)}
          type="date"
          className={inputClass(key)}
        />
        {fieldError ? <p className="mt-1 text-xs text-red-700">{fieldError}</p> : null}
      </label>
    );
  }

  return (
    <label key={field.label} className="mb-5 block text-sm font-medium">
      <span className="mb-1.5 block">{displayLabel}</span>
      <input
        value={String(form[key] || "")}
        onChange={(event) => setValue(field.label, event.target.value)}
        type={field.type}
        className={inputClass(key)}
        placeholder={"placeholder" in field ? field.placeholder : undefined}
      />
      {fieldError ? <p className="mt-1 text-xs text-red-700">{fieldError}</p> : null}
    </label>
  );
}

function asArray(value: FormState[string]) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}
