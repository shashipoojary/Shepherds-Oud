"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { crisisV2Ui } from "@/lib/i18n/crisis-v2-ui";
import { pathLabel } from "@/lib/crisis-v2/triage-engine";
import type { AnonymousTriageResult } from "@/lib/data/family-crisis";
import type { CarePath } from "@prisma/client";

type ResultState = {
  path: CarePath | null;
  reasoning: { nl: string; en: string } | null;
};

export function ResultClient({
  initialResult
}: {
  initialResult?: AnonymousTriageResult | null;
}) {
  const { locale } = useLocale();
  const ui = crisisV2Ui(locale);
  const [result, setResult] = useState<ResultState>(() => ({
    path: initialResult?.path ?? null,
    reasoning: initialResult?.reasoning ?? null
  }));
  const [error, setError] = useState(() =>
    initialResult === null ? "Could not load your result. Please redo the triage." : ""
  );
  const [hydrated] = useState(initialResult !== undefined);

  useEffect(() => {
    if (hydrated) return;
    void fetch("/api/v2/triage")
      .then(async (response) => {
        const data = (await response.json()) as {
          case?: { path?: CarePath | null; reasoning?: { nl: string; en: string } | null };
          error?: string;
        };
        if (!response.ok) throw new Error(data.error || "Failed");
        if (!data.case) {
          setError("Could not load your result. Please redo the triage.");
          return;
        }
        setResult({
          path: data.case.path ?? null,
          reasoning: data.case.reasoning ?? null
        });
      })
      .catch(() => setError("Could not load your result. Please redo the triage."));
  }, [hydrated]);

  const title =
    result.path === "HOME_CARE"
      ? ui.result.homeCare
      : result.path === "FACILITY"
        ? ui.result.facility
        : result.path === "BOTH"
          ? ui.result.both
          : ui.result.undecided;

  return (
    <section className="mx-auto max-w-3xl">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <p className="section-label">{ui.result.title}</p>
        <h1 className="mt-2 font-brand text-2xl font-semibold text-ink sm:text-3xl">
          {error ? ui.result.title : result.path ? pathLabel(result.path, locale) : title}
        </h1>

        {error ? (
          <div className="mt-6">
            <p className="text-sm text-red-700">{error}</p>
            <Button asChild className="mt-5">
              <Link href="/triage/1">{ui.landing.cta}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-ink/50">{ui.result.reasoningTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-ink/80">
                {result.reasoning ? (locale === "en" ? result.reasoning.en : result.reasoning.nl) : "…"}
              </p>
            </div>
            <div className="mt-7 border-t border-stone-100 pt-6">
              <Button asChild size="lg">
                <Link href="/signup">{ui.result.nextCta}</Link>
              </Button>
            </div>
          </>
        )}
      </header>
    </section>
  );
}
