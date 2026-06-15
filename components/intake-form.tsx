"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { intakeSteps } from "@/lib/content";
import { saveStoredIntake } from "@/lib/client-intake";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";

type Field = (typeof intakeSteps)[number]["fields"][number];
type FormState = Record<string, string | string[]>;

const keyFor = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function IntakeForm() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>({});
  const [status, setStatus] = useState<string>("");
  const step = intakeSteps[stepIndex];
  const isFinal = stepIndex === intakeSteps.length - 1;
  const progress = ((stepIndex + 1) / intakeSteps.length) * 100;

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
    setStatus("Submitting intake...");
    const payload = {
      contactName: String(form["your-name"] || "Maria van den Berg"),
      email: String(form["email-address"] || "maria@example.nl"),
      phone: String(form["phone-number"] || "+31 6 00000000"),
      relationship: String(form["your-relationship-to-the-senior"] || "Child"),
      preferredArea: String(form["preferred-city-or-area"] || "Den Haag"),
      ageRange: String(form["age-range"] || "80-89"),
      careTypes: asArray(form["type-of-care-needed"], ["Assisted living"]),
      urgency: String(form["how-urgent-is-the-care-need"] || "Within 1 month"),
      budget: String(form["monthly-budget-range"] || "EUR 2,500 - EUR 4,000"),
      languages: asArray(form["preferred-languages"], ["Dutch", "Arabic"]),
      additionalNeeds: asArray(form["additional-needs"], ["Mobility support"]),
      notes: String(form["anything-else-we-should-know"] || "")
    };

    const response = await fetch("/api/intakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setStatus("Please complete the highlighted details and try again.");
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
      status: result.status || "NEW",
      submittedAt: new Date().toISOString()
    });
    router.push("/family/success");
  }

  return (
    <section className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl bg-white shadow-panel lg:grid-cols-[380px_minmax(0,1fr)]">
      <header className="bg-sage-600 px-8 py-7 text-white">
        <h1 className="text-[1.3rem] font-semibold">Tell us about your situation</h1>
        <p className="mt-1 text-[13px] text-white/80">This takes about 5 minutes. We&apos;ll use this to find the best care options for your family.</p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/30">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-8 hidden space-y-4 text-sm text-white/75 lg:block">
          {intakeSteps.map((item, index) => (
            <div key={item.title} className={index === stepIndex ? "font-semibold text-white" : ""}>
              {index + 1}. {item.title}
            </div>
          ))}
        </div>
      </header>

      <div className="px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.5px] text-neutral-500">
          Step {stepIndex + 1} of {intakeSteps.length} - {step.title}
        </p>
        <div className="grid gap-x-5 md:grid-cols-2">{step.fields.map((field) => renderField(field, form, setValue, toggleChip))}</div>

        {status ? <p className="mt-4 rounded-lg bg-sage-100 p-3 text-sm text-sage-700">{status}</p> : null}

        <div className="mt-7 flex flex-col gap-4 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5">
            {intakeSteps.map((item, index) => (
              <span key={item.title} className={`h-2 w-2 rounded-full ${index <= stepIndex ? "bg-sage-600" : "bg-stone-300"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setStepIndex((value) => value - 1)}>
                Back
              </Button>
            )}
            {isFinal ? (
              <Button type="button" size="sm" onClick={submit}>
                Submit
              </Button>
            ) : (
              <Button type="button" size="sm" disabled={!canContinue} onClick={() => setStepIndex((value) => value + 1)}>
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
  const baseInput = "w-full rounded-lg border-[1.5px] border-stone-200 bg-white px-3.5 py-2.5 text-[15px] text-neutral-900 outline-none transition focus:border-sage-600";

  if (field.type === "notice") {
    return (
      <div key={field.text} className="rounded-[10px] bg-sage-100 p-4 text-[13px] text-sage-700 md:col-span-2">
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
              <button
                key={option}
                type="button"
                onClick={() => toggleChip(field.label, option)}
                className={`rounded-full border-[1.5px] px-4 py-2 text-sm transition ${
                  isSelected ? "border-sage-600 bg-sage-100 font-medium text-sage-700" : "border-stone-200 bg-white text-neutral-600 hover:border-sage-600 hover:text-sage-600"
                }`}
              >
                {option}
              </button>
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

function asArray(value: FormState[string], fallback: string[] = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return fallback;
}
