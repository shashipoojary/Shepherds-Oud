"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { intakeSteps, ubuntuTagline } from "@/lib/config/content";
import { usePrelaunch } from "@/components/layout/prelaunch-context";
import { selectFamilyIntake, withIntakeId, isHistoryIntake } from "@/lib/client/case-selection";
import {
  fieldKeyFor,
  getSessionFamilyIntakes,
  intakeToForm,
  type FamilyIntake
} from "@/lib/client/intake";
import {
  chipFieldComplete,
  INTAKE_OTHER_OPTION,
  otherFieldKey,
  resolveChipField,
  resolveIntakeRelationship,
  resolveSelectField,
  selectFieldComplete
} from "@/lib/domain/intake-field-utils";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CustomSelect } from "@/components/ui/custom-select";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatFieldErrorSummary, intakeFieldLabel, parseZodFieldErrors } from "@/lib/client/api-field-errors";
import { cn } from "@/lib/core/utils";

type Field = (typeof intakeSteps)[number]["fields"][number];
type FormState = Record<string, string | string[]>;

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
  const isPrelaunch = usePrelaunch();

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>({});
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [existingIntake, setExistingIntake] = useState<FamilyIntake | null>(null);
  const [savedIntakeId, setSavedIntakeId] = useState<string | null>(null);

  const step = intakeSteps[stepIndex];
  const isFinal = stepIndex === intakeSteps.length - 1;
  const progress = ((stepIndex + 1) / intakeSteps.length) * 100;
  const isUpdating = isUpdateMode && Boolean(existingIntake?.id);

  useEffect(() => {
    let active = true;

    setStatus("");
    setStatusTone("success");
    setFieldErrors({});
    setSubmitting(false);

    async function loadExistingIntake() {
      const result = await getSessionFamilyIntakes();
      const intakes = result.status === "ok" ? result.intakes : [];
      const activeIntake = intakes.find((item) => !isHistoryIntake(item)) ?? intakes[0] ?? null;

      if (!isUpdateMode) {
        if (!active) return;
        setSavedIntakeId(activeIntake?.id ?? null);
        setExistingIntake(null);
        setForm({});
        setStepIndex(0);
        setReady(true);
        return;
      }

      const selection = intakes.length ? selectFamilyIntake(intakes, requestedIntakeId) : { state: "none" as const, intake: null };
      const intake = selection.state === "selected" ? selection.intake : null;

      if (!active) return;

      setSavedIntakeId(activeIntake?.id ?? null);
      setExistingIntake(intake);
      if (intake) {
        setForm(intakeToForm(intake));
      } else {
        setForm({});
        if (selection.state === "needs-picker") {
          setStatus("Choose the care request you want to update from your dashboard.");
        } else if (selection.state === "not-found") {
          setStatus("We could not find that care request on your account. Choose a saved request from your dashboard.");
        }
      }
      setReady(true);
    }

    void loadExistingIntake();

    return () => {
      active = false;
    };
  }, [isUpdateMode, requestedIntakeId]);

  const canContinue = useMemo(() => {
    const required = step.fields.filter((field) => field.type !== "notice" && field.type !== "textarea" && field.type !== "date");
    return required.every((field) => fieldIsComplete(field, form));
  }, [form, step.fields]);

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

  async function submit() {
    if (isUpdateMode && !existingIntake) {
      setStatus("Choose the care request you want to update from your dashboard.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    setStatusTone("success");
    setFieldErrors({});

    const payload = {
      contactName: String(form["your-name"] || "").trim(),
      email: String(form["email-address"] || "").trim(),
      phone: String(form["phone-number"] || "").trim(),
      relationship: resolveIntakeRelationship(form),
      preferredArea: String(form["preferred-city-or-province"] || "").trim(),
      ageRange: String(form["age-range"] || "").trim(),
      livingSituation: String(form["current-living-situation"] || "").trim(),
      mobility: String(form["mobility-level"] || "").trim(),
      dementiaNeeds: String(form["dementia-or-memory-care-needs"] || "").trim(),
      careTypes: asArray(form["type-of-care-needed"]),
      urgency: String(form["how-urgent-is-the-care-need"] || "").trim(),
      hospitalDischargeDate: String(form["hospital-discharge-date-if-applicable"] || "").trim() || undefined,
      decisionMakerName: String(form["primary-family-decision-maker"] || "").trim(),
      decisionMakerRelationship: resolveSelectField(form, "Decision-maker relationship"),
      supportTypes: asArray(form["type-of-support-your-family-needs"]),
      emotionalSupportNeeds: asArray(form["emotional-support-needs"]),
      budget: String(form["monthly-budget-range"] || "").trim(),
      languages: resolveChipField(form, "Preferred languages"),
      additionalNeeds: asArray(form["additional-needs"]),
      moveInTimeline: String(form["desired-move-in-timeline"] || "").trim(),
      notes: String(form["anything-else-we-should-know"] || "").trim()
    };

    if (
      !payload.contactName ||
      !payload.email ||
      !payload.preferredArea ||
      !payload.ageRange ||
      !payload.careTypes.length ||
      !payload.urgency ||
      !payload.relationship ||
      !payload.decisionMakerName ||
      !payload.decisionMakerRelationship
    ) {
      setStatus("Please complete all required steps before submitting.");
      setSubmitting(false);
      return;
    }

    setStatus(isUpdating ? "Updating your request..." : "Submitting intake...");

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
          mapped[fieldKeyFor(intakeFieldLabel(apiKey))] = message;
        }
        setFieldErrors(mapped);
        setStatusTone("error");
        setStatus(formatFieldErrorSummary(apiErrors, intakeFieldLabel) || data.error || "Please fix the highlighted fields.");
      } else {
        setStatusTone("error");
        setStatus(data.error || "Please complete the highlighted details and try again.");
      }
      setSubmitting(false);
      return;
    }

    const saved = (await response.json().catch(() => ({}))) as { id?: string };
    const savedIntakeId = isUpdating ? existingIntake!.id : saved.id;

    setForm({});
    setStepIndex(0);
    router.push(savedIntakeId ? withIntakeId("/family/dashboard", savedIntakeId) : "/family/dashboard");
  }

  if (!ready) {
    return <IntakeFormSkeleton />;
  }

  return (
    <section className="mx-auto grid max-w-7xl overflow-hidden rounded-card bg-white shadow-panel lg:grid-cols-[380px_minmax(0,1fr)]">
      <header className="bg-brand-green-dark px-8 py-7 text-white">
        <h1 className="font-brand text-[1.3rem] font-semibold">Tell us about your situation</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-white/80">
          {isUpdating
            ? "Update your existing care request. Your Care Guide keeps supporting your family through shared decisions."
            : `About 5 minutes. A real Care Guide reviews your case personally — ${ubuntuTagline}`}
        </p>
        {!isUpdateMode && savedIntakeId ? (
          <div className="mt-5">
            <Button asChild size="sm" variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link href={withIntakeId("/family/dashboard", savedIntakeId)}>Go to your dashboard</Link>
            </Button>
            <p className="mt-2 text-[12px] leading-relaxed text-white/65">
              You already have a care request saved. Open your dashboard to follow your journey, or continue below to start another.
            </p>
          </div>
        ) : null}
        <div className="mt-4">
          <ProgressBar value={progress} trackClassName="bg-white/25" />
        </div>
        <div className="mt-8 hidden space-y-4 text-sm text-white/75 lg:block">
          {intakeSteps.map((item, index) => (
            <div
              key={item.title}
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
            You are on our waitlist. Complete your guided intake next so a Care Guide can review your family&apos;s situation.
          </div>
        ) : null}

        {isUpdateMode && !existingIntake ? (
            <div className="mb-5 rounded-lg bg-brand-beige-light/40 px-4 py-3 text-sm text-brand-amber-dark">
            Choose the care request you want to update.{" "}
            <Link href="/family/dashboard" className="font-semibold underline underline-offset-2">
              Open your requests
            </Link>
          </div>
        ) : null}

        <p className="section-label mb-5">
          Step {stepIndex + 1} of {intakeSteps.length} — {step.title}
        </p>
        <div className="grid gap-x-5 md:grid-cols-2">
          {step.fields.map((field) => renderField(field, form, setValue, setOtherValue, toggleChip, fieldErrors))}
        </div>

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
                Back
              </Button>
            )}
            {isFinal ? (
              <Button type="button" className="min-w-[140px]" disabled={submitting} onClick={submit}>
                {submitting ? (isUpdating ? "Updating..." : "Submitting...") : isUpdating ? "Update request" : "Submit"}
              </Button>
            ) : (
              <Button type="button" disabled={!canContinue} onClick={() => setStepIndex((value) => value + 1)}>
                Next step
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
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
  if (field.type === "notice" || field.type === "textarea" || field.type === "date") {
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
  fieldErrors: Record<string, string> = {}
) {
  const baseInput =
    "w-full rounded-lg border-[1.5px] bg-white px-3.5 py-2.5 text-body text-ink outline-none transition focus:border-brand-amber";
  const inputClass = (key: string) =>
    cn(baseInput, fieldErrors[key] ? "border-red-500 ring-1 ring-red-200" : "border-[var(--card-border)]");

  if (field.type === "notice") {
    return (
      <div key={field.text} className="rounded-lg bg-brand-green-pale/25 p-4 text-[13px] text-brand-green-dark md:col-span-2">
        {field.text}
      </div>
    );
  }

  const key = fieldKeyFor(field.label);
  const fieldError = fieldErrors[key];
  const otherKey = otherFieldKey(field.label);
  const otherPlaceholder =
    ("otherPlaceholder" in field && field.otherPlaceholder) || "Please specify";

  if (field.type === "select") {
    const selected = String(form[key] || "");
    return (
      <div key={field.label} className="mb-5 md:col-span-2">
        <CustomSelect className="w-full" label={field.label} value={selected} options={field.options} onChange={(value) => setValue(field.label, value)} />
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
        <legend className="mb-2 text-sm font-medium">{field.label}</legend>
        <div className="flex flex-wrap gap-2">
          {field.options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <Chip key={option} selected={isSelected} onClick={() => toggleChip(field.label, option)}>
                {option}
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
        <span className="mb-1.5 block">{field.label}</span>
        <textarea value={String(form[key] || "")} onChange={(event) => setValue(field.label, event.target.value)} className={cn(inputClass(key), "min-h-20 resize-y")} placeholder={field.placeholder} />
        {fieldError ? <p className="mt-1 text-xs text-red-700">{fieldError}</p> : null}
      </label>
    );
  }

  if (field.type === "date") {
    return (
      <label key={field.label} className="mb-5 block text-sm font-medium">
        <span className="mb-1.5 block">{field.label}</span>
        <input value={String(form[key] || "")} onChange={(event) => setValue(field.label, event.target.value)} type="date" className={inputClass(key)} />
        {fieldError ? <p className="mt-1 text-xs text-red-700">{fieldError}</p> : null}
      </label>
    );
  }

  return (
    <label key={field.label} className="mb-5 block text-sm font-medium">
      <span className="mb-1.5 block">{field.label}</span>
      <input value={String(form[key] || "")} onChange={(event) => setValue(field.label, event.target.value)} type={field.type} className={inputClass(key)} placeholder={field.placeholder} />
      {fieldError ? <p className="mt-1 text-xs text-red-700">{fieldError}</p> : null}
    </label>
  );
}

function asArray(value: FormState[string]) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}
