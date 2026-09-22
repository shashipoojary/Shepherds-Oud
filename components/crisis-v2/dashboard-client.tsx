"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CrisisDashboardSkeleton } from "@/components/crisis-v2/crisis-skeletons";
import { useLocale } from "@/components/i18n/locale-provider";
import { crisisPaths } from "@/lib/config/crisis-v2";
import type { FamilyDashboardData, FamilyDashboardReferral } from "@/lib/data/family-crisis";
import { crisisV2Ui } from "@/lib/i18n/crisis-v2-ui";
import { pathLabel } from "@/lib/crisis-v2/triage-engine";
import type { ChecklistTaskStatus, PlacementFeeStatus } from "@prisma/client";

function taskStatusLabel(status: ChecklistTaskStatus, ui: ReturnType<typeof crisisV2Ui>) {
  if (status === "DONE") return ui.dashboard.statusDone;
  if (status === "IN_PROGRESS") return ui.dashboard.statusInProgress;
  return ui.dashboard.statusNotStarted;
}

function referralStatusLabel(status: PlacementFeeStatus, ui: ReturnType<typeof crisisV2Ui>) {
  if (status === "PAID") return ui.dashboard.referralPaid;
  if (status === "INVOICED") return ui.dashboard.referralConfirmed;
  if (status === "DECLINED") return ui.dashboard.referralDeclined;
  return ui.dashboard.referralRequested;
}

function referralNextHint(status: PlacementFeeStatus, ui: ReturnType<typeof crisisV2Ui>) {
  if (status === "PAID") return ui.dashboard.referralNextPaid;
  if (status === "INVOICED") return ui.dashboard.referralNextConfirmed;
  if (status === "DECLINED") return ui.dashboard.referralNextDeclined;
  return ui.dashboard.referralNextRequested;
}

function canShowReferralContact(status: PlacementFeeStatus) {
  return status === "INVOICED" || status === "PAID";
}

export function DashboardClient({ initialData }: { initialData?: FamilyDashboardData | null }) {
  const { locale } = useLocale();
  const ui = crisisV2Ui(locale);
  const [data, setData] = useState<FamilyDashboardData | null>(initialData ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(initialData === undefined);
  const [checklistManualOpen, setChecklistManualOpen] = useState<boolean | null>(null);

  async function load() {
    const response = await fetch("/api/v2/cases");
    const payload = (await response.json()) as {
      error?: string;
      dashboard?: FamilyDashboardData;
      cases?: Array<{
        case: FamilyDashboardData & { id?: string; referrals?: FamilyDashboardReferral[] };
      }>;
    };
    if (!response.ok) {
      setError(payload.error || "Could not load dashboard.");
      setData(null);
      return;
    }
    if (payload.dashboard) {
      setData(payload.dashboard);
      return;
    }
    const familyCase = payload.cases?.[0]?.case;
    if (!familyCase) {
      setError("No case found. Complete triage and signup first.");
      setData(null);
      return;
    }
    setData({
      caseId: familyCase.caseId || familyCase.id || "",
      path: familyCase.path,
      tasks: familyCase.tasks,
      referrals: familyCase.referrals || []
    });
  }

  useEffect(() => {
    if (initialData !== undefined) {
      setLoading(false);
      return;
    }
    void load().finally(() => setLoading(false));
  }, [initialData]);

  if (loading) return <CrisisDashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <p className="text-sm text-brand-amber-dark">{error || ui.dashboard.empty}</p>
      </div>
    );
  }

  const checklistAllDone =
    data.tasks.length > 0 && data.tasks.every((task) => task.status === "DONE");
  const checklistOpen = checklistManualOpen ?? !checklistAllDone;

  return (
    <div className="grid gap-5">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-brand text-2xl font-semibold text-ink">{ui.dashboard.title}</h1>
            {data.path ? <p className="mt-2 text-sm text-brand-amber-dark">{pathLabel(data.path, locale)}</p> : null}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings">{ui.dashboard.settings}</Link>
          </Button>
        </div>
      </header>

      <section className="rounded-2xl bg-white shadow-soft">
        <div className="border-b border-stone-100 px-5 py-4 sm:px-7">
          <h2 className="text-base font-semibold text-ink">{ui.dashboard.introductionsHeading}</h2>
        </div>
        {!data.referrals.length ? (
          <div className="px-5 py-5 sm:px-7">
            <p className="text-sm leading-6 text-ink/65">{ui.dashboard.introductionsEmpty}</p>
            <Button asChild size="sm" className="mt-4">
              <Link href={crisisPaths.directory}>{ui.dashboard.introductionsEmptyCta}</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {data.referrals.map((referral) => {
              const showContact = canShowReferralContact(referral.feeStatus);
              const hasContact =
                Boolean(referral.contactEmail) ||
                Boolean(referral.contactPhone) ||
                Boolean(referral.websiteUrl);

              return (
                <li key={referral.id} className="px-5 py-4 sm:px-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{referral.providerName}</p>
                      <p className="mt-0.5 text-xs text-ink/55">
                        {referral.municipality} ·{" "}
                        {new Date(referral.referredAt).toLocaleDateString(locale === "en" ? "en-GB" : "nl-NL")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-ink/50">
                      {referralStatusLabel(referral.feeStatus, ui)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-ink/55">{referralNextHint(referral.feeStatus, ui)}</p>
                  {showContact && hasContact ? (
                    <div className="mt-3 text-sm text-ink/80">
                      <p className="text-xs font-medium uppercase tracking-wide text-ink/45">
                        {ui.dashboard.referralContactHeading}
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {referral.contactPhone ? (
                          <li>
                            <a className="text-brand-amber hover:text-brand-amber-mid" href={`tel:${referral.contactPhone}`}>
                              {referral.contactPhone}
                            </a>
                          </li>
                        ) : null}
                        {referral.contactEmail ? (
                          <li>
                            <a
                              className="text-brand-amber hover:text-brand-amber-mid"
                              href={`mailto:${referral.contactEmail}`}
                            >
                              {referral.contactEmail}
                            </a>
                          </li>
                        ) : null}
                        {referral.websiteUrl ? (
                          <li>
                            <a
                              className="text-brand-amber hover:text-brand-amber-mid"
                              href={referral.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {referral.websiteUrl.replace(/^https?:\/\//, "")}
                            </a>
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white shadow-soft">
        {checklistAllDone ? (
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-7"
            aria-expanded={checklistOpen}
            onClick={() => setChecklistManualOpen(!checklistOpen)}
          >
            <span>
              <span className="block text-base font-semibold text-ink">{ui.dashboard.stepsHeading}</span>
              <span className="mt-0.5 block text-xs text-ink/50">{ui.dashboard.checklistAllDone}</span>
            </span>
            {checklistOpen ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-ink/45" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-ink/45" aria-hidden />
            )}
          </button>
        ) : (
          <div className="border-b border-stone-100 px-5 py-4 sm:px-7">
            <h2 className="text-base font-semibold text-ink">{ui.dashboard.stepsHeading}</h2>
          </div>
        )}
        {!data.tasks.length ? (
          <div className="px-5 py-5 sm:px-7">
            <p className="text-sm text-ink/60">{ui.dashboard.empty}</p>
          </div>
        ) : checklistOpen ? (
          <ul className={`divide-y divide-stone-100${checklistAllDone ? " border-t border-stone-100" : ""}`}>
            {data.tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="block px-5 py-4 transition hover:bg-brand-cream/40 sm:px-7"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-ink">{task.label}</p>
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-ink/45">
                      {taskStatusLabel(task.status, ui)}
                    </span>
                  </div>
                  {task.deadline ? (
                    <p className="mt-1 text-xs text-ink/50">
                      {ui.task.deadline}:{" "}
                      {new Date(task.deadline).toLocaleDateString(locale === "en" ? "en-GB" : "nl-NL")}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
