"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import { splitFamilyIntakes, withIntakeId } from "@/lib/client/case-selection";
import type { FamilyIntake } from "@/lib/client/intake";
import { intakeStatusLabel, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import { matchStatusBadgeClass, matchStatusLabel } from "@/lib/domain/match-status";
import { Button } from "@/components/ui/button";
import { DetailList, PanelSection, SlidePanel } from "@/components/ui/slide-panel";
import type { ProviderMatch } from "@/lib/core/types";
import { cn } from "@/lib/core/utils";

type FamilyHistoryPanelProps = {
  intakes: FamilyIntake[];
  currentIntakeId: string;
};

export function FamilyHistoryPanel({ intakes, currentIntakeId }: FamilyHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FamilyIntake | null>(null);
  const [matches, setMatches] = useState<ProviderMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const pastIntakes = splitFamilyIntakes(intakes).history;

  const loadMatches = useCallback(async (intakeId: string) => {
    setLoadingMatches(true);
    try {
      const response = await fetch(`/api/matches?intakeId=${encodeURIComponent(intakeId)}&history=1`);
      if (response.ok) {
        setMatches((await response.json()) as ProviderMatch[]);
      } else {
        setMatches([]);
      }
    } catch {
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    if (!selected) {
      setMatches([]);
      return;
    }
    void loadMatches(selected.id);
  }, [selected, loadMatches]);

  if (!pastIntakes.length) {
    return null;
  }

  function handleClose() {
    setOpen(false);
    setSelected(null);
  }

  function handleBack() {
    setSelected(null);
    setMatches([]);
  }

  const selectedTitle = selected ? intakeSummaryTitle(selected) : null;

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="bg-white" onClick={() => setOpen(true)}>
        See history
      </Button>

      <SlidePanel
        open={open}
        onClose={handleClose}
        size="wide"
        title={selectedTitle ?? "Care request history"}
        subtitle={
          selected
            ? intakeStatusLabel(normalizeIntakeStatus(selected.status))
            : `${pastIntakes.length} past request${pastIntakes.length === 1 ? "" : "s"}`
        }
        footer={
          selected ? (
            <Button asChild className="w-full sm:w-auto">
              <Link href={withIntakeId("/family/dashboard", selected.id)} onClick={handleClose}>
                Open on dashboard
              </Link>
            </Button>
          ) : undefined
        }
      >
        {selected ? (
          <HistoryDetail
            intake={selected}
            matches={matches}
            loading={loadingMatches}
            isCurrent={selected.id === currentIntakeId}
            onBack={handleBack}
          />
        ) : (
          <HistoryList intakes={pastIntakes} currentIntakeId={currentIntakeId} onSelect={setSelected} />
        )}
      </SlidePanel>
    </>
  );
}

function HistoryList({
  intakes,
  currentIntakeId,
  onSelect
}: {
  intakes: FamilyIntake[];
  currentIntakeId: string;
  onSelect: (intake: FamilyIntake) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">Request</th>
            <th className="hidden px-4 py-3 sm:table-cell">Area</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {intakes.map((intake) => {
            const status = normalizeIntakeStatus(intake.status);
            const isCurrent = intake.id === currentIntakeId;

            return (
              <tr key={intake.id} className="cursor-pointer hover:bg-cream" onClick={() => onSelect(intake)}>
                <td className="px-4 py-3 text-sm">
                  <strong className="text-ink">{intakeSummaryTitle(intake)}</strong>
                  <span className="mt-1 block text-xs text-neutral-500">{formatDate(intake.submittedAt)}</span>
                  <span className="mt-1 block text-xs text-neutral-500 sm:hidden">{intake.preferredArea || "—"}</span>
                  {isCurrent ? (
                    <span className="mt-1 inline-block rounded-full bg-brand-amber/15 px-2 py-0.5 text-[11px] font-semibold text-brand-amber-dark">
                      Viewing now
                    </span>
                  ) : null}
                </td>
                <td className="hidden px-4 py-3 text-sm text-neutral-600 sm:table-cell">{intake.preferredArea || "—"}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-snug", statusBadgeClass(status))}>
                    {intakeStatusLabel(status)}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <Button type="button" size="xs" variant="outline" className="bg-white" onClick={() => onSelect(intake)}>
                    Open
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HistoryDetail({
  intake,
  matches,
  loading,
  isCurrent,
  onBack
}: {
  intake: FamilyIntake;
  matches: ProviderMatch[];
  loading: boolean;
  isCurrent: boolean;
  onBack: () => void;
}) {
  const status = normalizeIntakeStatus(intake.status);
  const careType = intake.careTypes?.[0] || "Care request";

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition hover:text-ink"
        onClick={onBack}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to list
      </button>

      <PanelSection title="Summary">
        <DetailList
          items={[
            { label: "Status", value: intakeStatusLabel(status) },
            { label: "Submitted", value: formatDate(intake.submittedAt) },
            { label: "Area", value: intake.preferredArea || "—" },
            { label: "Care type", value: careType },
            { label: "Care Guide", value: intake.careGuide?.name || "—" },
            ...(isCurrent ? [{ label: "Note", value: "This is the request you are viewing on your dashboard." }] : [])
          ]}
          columns={2}
        />
      </PanelSection>

      <PanelSection title="Providers" description="Final outcome for each matched provider.">
        {loading ? (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-lg bg-stone-100" />
            <div className="h-12 animate-pulse rounded-lg bg-stone-100" />
          </div>
        ) : !matches.length ? (
          <p className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-5 text-sm text-neutral-500">
            No providers were matched to this request.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full min-w-[360px] border-collapse text-left">
              <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {matches.map((match) => (
                  <tr key={match.matchId || match.id}>
                    <td className="px-4 py-3 text-sm font-medium text-ink">{match.name}</td>
                    <td className="px-4 py-3">
                      {match.matchStatus ? (
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-snug",
                            matchStatusBadgeClass(match.matchStatus)
                          )}
                        >
                          {matchStatusLabel(match.matchStatus)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PanelSection>
    </div>
  );
}

function intakeSummaryTitle(intake: FamilyIntake) {
  const careType = intake.careTypes?.[0];
  if (careType && intake.ageRange) return `${careType} · age ${intake.ageRange}`;
  if (careType) return careType;
  if (intake.ageRange) return `Care request · age ${intake.ageRange}`;
  return "Care request";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function statusBadgeClass(status: ReturnType<typeof normalizeIntakeStatus>) {
  if (status === "CLOSED") return "bg-stone-200 text-stone-700";
  if (status === "PLACED") return "bg-brand-green-pale/60 text-brand-green-dark";
  return "bg-brand-cream text-ink/70";
}
