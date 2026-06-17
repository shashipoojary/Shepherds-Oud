"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { intakeSteps } from "@/lib/content";
import {
  getIntakeDraft,
  getStoredIntake,
  saveIntakeDraft,
  saveStoredIntake,
  storedIntakeToForm
} from "@/lib/client-intake";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CustomSelect } from "@/components/ui/custom-select";
import { ProgressBar } from "@/components/ui/progress-bar";

type Field = (typeof intakeSteps)[number]["fields"][number];
type FormState = Record<string, string | string[]>;

const keyFor = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function buildInitialForm(): FormState {
  const draft = getIntakeDraft();
  if (draft && Object.keys(draft).length) return draft;

  const stored = getStoredIntake();
  if (stored) return storedIntakeToForm(stored);

  return {};
}

export function IntakeForm() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>({});
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const step = intakeSteps[stepIndex];
  const isFinal = stepIndex === intakeSteps.length - 1;
  const progress = ((stepIndex + 1) / intakeSteps.length) * 100;

  useEffect(() => {
    setForm(buildInitialForm());
  }, []);

  useEffect(() => {
    if (!Object.keys(form).length) return;
    saveIntakeDraft(form);
  }, [form]);

  const canContinue = useMemo(() => {
    const required = step.fields.filter((field) => field.type !== "notice" && field.type !== "textarea");
    return required.every((field) => {
      const value = form[keyFor(field.label)];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });
  }, [form, step.fields]);

  function setValue(label: string, value: string) {
    setForm((current) => ({ ...current, [keyFor(label)]: value }));
  }

  function toggleChip(label: string, option: string) {
    setForm((current) => {
      const key = keyFor(label);
      const selected = Array.isArray(current[key]) ? current[key] : [];
      return {
        ...current,
        [key]: selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]
      };
    });
  }

  async function submit() {
    setSubmitting(true);
    setStatus("");

    const payload = {
      contactName: String(form["your-name"] || "").trim(),
      email: String(form["email-address"] || "").trim(),
      phone: String(form["phone-number"] || "").trim(),
      relationship: String(form["your-relationship-to-the-senior"] || "").trim(),
      preferredArea: String(form["preferred-city-or-province"] || "").trim(),
      ageRange: String(form["age-range"] || "").trim(),
      careTypes: asArray(form["type-of-care-needed"]),
      urgency: String(form["how-urgent-is-the-care-need"] || "").trim(),
      budget: String(form["monthly-budget-range"] || "").trim(),
      languages: asArray(form["preferred-languages"]),
      additionalNeeds: asArray(form["additional-needs"]),
      notes: String(form["anything-else-we-should-know"] || "").trim()
    };

    if (!payload.contactName || !payload.email || !payload.preferredArea || !payload.ageRange || !payload.careTypes.length || !payload.urgency) {
      setStatus("Please complete all required steps before submitting.");
      setSubmitting(false);
      return;
    }

    setStatus("Submitting intake...");

    const response = await fetch("/api/intakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setStatus("Please complete the highlighted details and try again.");
      setSubmitting(false);
      return;
    }

    const result = (await response.json()) as { id: string; status: string };
    saveStoredIntake({
      id: result.id,
      contactName: payload.contactName,
      email: payload.email,
      phone: payload.phone,
      relationship: payload.relationship,
      preferredArea: payload.preferredArea,
      ageRange: payload.ageRange,
      careTypes: payload.careTypes,
      urgency: payload.urgency,
      budget: payload.budget,
      languages: payload.languages,
      additionalNeeds: payload.additionalNeeds,
      notes: payload.notes,
      status: result.status || "NEW",
      matchCount: 0,
      submittedAt: new Date().toISOString()
    });
    router.push("/family/success");
  }

  return (
    <section className="mx-auto grid max-w-7xl overflow-hidden rounded-card bg-white shadow-panel lg:grid-cols-[380px_minmax(0,1fr)]">
      <header className="bg-brand-green-dark px-8 py-7 text-white">
        <h1 className="font-brand text-[1.3rem] font-semibold">Tell us about your situation</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-white/80">This takes about 5 minutes. We&apos;ll use this to find the best care options for your family.</p>
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
        <p className="section-label mb-5">
          Step {stepIndex + 1} of {intakeSteps.length} — {step.title}
        </p>
        <div className="grid gap-x-5 md:grid-cols-2">{step.fields.map((field) => renderField(field, form, setValue, toggleChip))}</div>

        {status ? <p className="mt-4 rounded-lg bg-brand-green-pale/30 p-3 text-sm text-brand-green-dark">{status}</p> : null}

        <div className="mt-7 flex flex-col gap-4 border-t border-[var(--card-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
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
                {submitting ? "Submitting..." : "Submit"}
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

function renderField(field: Field, form: FormState, setValue: (label: string, value: string) => void, toggleChip: (label: string, option: string) => void) {
  const baseInput =
    "w-full rounded-lg border-[1.5px] border-[var(--card-border)] bg-white px-3.5 py-2.5 text-body text-ink outline-none transition focus:border-brand-amber";

  if (field.type === "notice") {
    return (
      <div key={field.text} className="rounded-lg bg-brand-green-pale/25 p-4 text-[13px] text-brand-green-dark md:col-span-2">
        {field.text}
      </div>
    );
  }

  const key = keyFor(field.label);

  if (field.type === "select") {
    return (
      <CustomSelect key={field.label} className="mb-5" label={field.label} value={String(form[key] || "")} options={field.options} onChange={(value) => setValue(field.label, value)} />
    );
  }

  if (field.type === "chips") {
    const selected = asArray(form[key]);
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
      </fieldset>
    );
  }

  if (field.type === "textarea") {
    return (
      <label key={field.label} className="mb-5 block text-sm font-medium md:col-span-2">
        <span className="mb-1.5 block">{field.label}</span>
        <textarea value={String(form[key] || "")} onChange={(event) => setValue(field.label, event.target.value)} className={`${baseInput} min-h-20 resize-y`} placeholder={field.placeholder} />
      </label>
    );
  }

  return (
    <label key={field.label} className="mb-5 block text-sm font-medium">
      <span className="mb-1.5 block">{field.label}</span>
      <input value={String(form[key] || "")} onChange={(event) => setValue(field.label, event.target.value)} type={field.type} className={baseInput} placeholder={field.placeholder} />
    </label>
  );
}

function asArray(value: FormState[string]) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}
