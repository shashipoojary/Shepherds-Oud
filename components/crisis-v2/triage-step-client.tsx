"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { crisisV2Ui } from "@/lib/i18n/crisis-v2-ui";
import {
  getTriageQuestion,
  triageOptionLabel,
  triageQuestionCount,
  triageQuestionTitle,
  type TriageAnswers
} from "@/lib/crisis-v2/triage-engine";
import { cn } from "@/lib/core/utils";

const STORAGE_KEY = "so_v2_triage_draft";

type Draft = Partial<TriageAnswers>;

function readDraft(): Draft {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "{}") as Draft;
  } catch {
    return {};
  }
}

function writeDraft(draft: Draft) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function optionClass(selected: boolean) {
  return cn(
    "w-full px-4 py-3.5 text-left text-sm transition",
    selected ? "bg-brand-amber/10 text-ink" : "bg-transparent text-ink/85 hover:bg-brand-cream/70"
  );
}

export function TriageStepClient() {
  const params = useParams<{ step: string }>();
  const router = useRouter();
  const { locale } = useLocale();
  const ui = crisisV2Ui(locale);
  const step = Number(params.step || "1");
  const total = triageQuestionCount();
  const question = getTriageQuestion(step);
  const [draft, setDraft] = useState<Draft>(() => readDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (question?.id === "situation") {
      setDraft((current) => {
        const next = {
          ...current,
          livingAlone: typeof current.livingAlone === "boolean" ? current.livingAlone : false,
          memoryConcerns: typeof current.memoryConcerns === "boolean" ? current.memoryConcerns : false,
          mobilityLimited: typeof current.mobilityLimited === "boolean" ? current.mobilityLimited : false
        };
        writeDraft(next);
        return next;
      });
    }
  }, [question?.id]);

  const canContinue = useMemo(() => {
    if (!question) return false;
    if (question.id === "relationship") return Boolean(draft.relationship);
    if (question.id === "trigger") return Boolean(draft.trigger);
    if (question.id === "urgency") return Boolean(draft.urgency);
    if (question.id === "situation") {
      return (
        typeof draft.livingAlone === "boolean" &&
        typeof draft.memoryConcerns === "boolean" &&
        typeof draft.mobilityLimited === "boolean"
      );
    }
    if (question.id === "funding") return Array.isArray(draft.funding) && draft.funding.length > 0;
    return false;
  }, [draft, question]);

  if (!question || step < 1 || step > total) {
    return <p className="text-sm text-red-700">Invalid step.</p>;
  }

  function update(partial: Draft) {
    setDraft((current) => {
      const next = { ...current, ...partial };
      writeDraft(next);
      return next;
    });
  }

  async function goNext() {
    if (step < total) {
      router.push(`/triage/${step + 1}`);
      return;
    }

    const answers = draft as TriageAnswers;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/v2/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Save failed");
      window.sessionStorage.removeItem(STORAGE_KEY);
      router.push("/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save triage.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <p className="text-sm text-ink/60">{ui.triage.progress(step, total)}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-cream">
          <div className="h-full bg-brand-amber transition-all" style={{ width: `${(step / total) * 100}%` }} />
        </div>
        <h1 className="mt-6 font-brand text-2xl font-semibold text-ink sm:text-3xl">
          {triageQuestionTitle(question.id, locale)}
        </h1>

        {question.type === "single" ? (
          <div className="mt-6 divide-y divide-stone-100 overflow-hidden rounded-xl bg-brand-cream/40">
            {question.options.map((option) => {
              const selected =
                question.id === "relationship"
                  ? draft.relationship === option
                  : question.id === "trigger"
                    ? draft.trigger === option
                    : draft.urgency === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    if (question.id === "relationship") update({ relationship: option });
                    if (question.id === "trigger") update({ trigger: option as TriageAnswers["trigger"] });
                    if (question.id === "urgency") update({ urgency: option as TriageAnswers["urgency"] });
                  }}
                  className={optionClass(selected)}
                >
                  {triageOptionLabel(option, locale)}
                </button>
              );
            })}
          </div>
        ) : null}

        {question.type === "multi_bool" ? (
          <div className="mt-6">
            <div className="divide-y divide-stone-100 overflow-hidden rounded-xl bg-brand-cream/40">
              {question.fields.map((field) => {
                const value = draft[field as keyof TriageAnswers];
                const selected = value === true;
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => update({ [field]: !selected } as Draft)}
                    className={optionClass(selected)}
                  >
                    {triageOptionLabel(field, locale)}
                  </button>
                );
              })}
            </div>
            {typeof draft.livingAlone !== "boolean" ||
            typeof draft.memoryConcerns !== "boolean" ||
            typeof draft.mobilityLimited !== "boolean" ? (
              <p className="mt-3 text-xs text-ink/50">Tap each item that applies (tap again to clear).</p>
            ) : null}
          </div>
        ) : null}

        {question.type === "multi" ? (
          <div className="mt-6 divide-y divide-stone-100 overflow-hidden rounded-xl bg-brand-cream/40">
            {question.options.map((option) => {
              const selected = (draft.funding || []).includes(option as TriageAnswers["funding"][number]);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    const current = new Set(draft.funding || []);
                    if (selected) current.delete(option as TriageAnswers["funding"][number]);
                    else current.add(option as TriageAnswers["funding"][number]);
                    update({ funding: Array.from(current) });
                  }}
                  className={optionClass(selected)}
                >
                  {triageOptionLabel(option, locale)}
                </button>
              );
            })}
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-7 flex flex-wrap gap-3 border-t border-stone-100 pt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={() => router.push(`/triage/${step - 1}`)}>
              {ui.triage.back}
            </Button>
          ) : null}
          <Button disabled={!canContinue || saving} onClick={() => void goNext()}>
            {step === total ? ui.triage.seeResult : ui.triage.continue}
          </Button>
        </div>
      </header>
    </section>
  );
}
