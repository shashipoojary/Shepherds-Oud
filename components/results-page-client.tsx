"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getStoredIntake, saveStoredIntake, type StoredIntake } from "@/lib/client-intake";
import { matchStatusHint, matchStatusLabel } from "@/lib/match-status";
import { IntakeSummaryCard } from "@/components/intake-summary-card";
import { ProviderCard } from "@/components/provider-card";
import { availabilityBadgeVariant, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";
import { EmptyState } from "@/components/ui/empty-state";
import { MatchScore } from "@/components/ui/match-score";
import { ResultsSkeleton } from "@/components/ui/results-skeleton";
import type { ProviderMatch } from "@/lib/types";

const filters = ["All options", "Can contact today", "Memory care", "Care at home"];

type IntakeMeta = {
  status: string;
  matchCount: number;
};

function emptyStateCopy(intake: StoredIntake, loadError: boolean) {
  if (loadError) {
    return {
      title: "Could not load matches",
      description: "Please check your connection and refresh this page. Your care request is still saved on this device."
    };
  }

  if (intake.status === "MATCHED" || intake.status === "PLACED") {
    return {
      title: "Matches are being prepared",
      description:
        "Your case is marked as matched. If providers do not appear here within a day, contact your care advisor with your reference number."
    };
  }

  if (intake.status === "REVIEW") {
    return {
      title: "Care advisor is reviewing your intake",
      description: "Matched providers will appear here once a care advisor approves and publishes them to your results page."
    };
  }

  return {
    title: "Matches are being prepared",
    description: "A care advisor is reviewing your intake. Matched providers will appear here once approved."
  };
}

export function ResultsPageClient() {
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [providers, setProviders] = useState<ProviderMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [intake, setIntake] = useState<StoredIntake | null>(null);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);
  const recommended = providers[0];

  useEffect(() => {
    const stored = getStoredIntake();
    setIntake(stored);

    if (!stored) {
      setLoading(false);
      return;
    }

    async function loadMatches() {
      const current = stored;
      if (!current) return;

      try {
        const [intakeResponse, matchesResponse] = await Promise.all([
          fetch(`/api/intakes/${current.id}`),
          fetch(`/api/matches?intakeId=${current.id}`)
        ]);

        if (intakeResponse.ok) {
          const intakeData = (await intakeResponse.json()) as IntakeMeta;
          const updated: StoredIntake = {
            ...current,
            status: intakeData.status,
            matchCount: intakeData.matchCount
          };
          saveStoredIntake(updated);
          setIntake(updated);
        }

        if (matchesResponse.ok) {
          setProviders((await matchesResponse.json()) as ProviderMatch[]);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }

    void loadMatches();
  }, []);

  const visibleProviders = useMemo(() => {
    if (activeFilter === "All options") return providers;
    if (activeFilter === "Can contact today") {
      return providers.filter((provider) => provider.availability.toLowerCase().includes("available"));
    }
    if (activeFilter === "Memory care") {
      return providers.filter((provider) => provider.tags.some((tag) => tag.label.toLowerCase().includes("dementia")));
    }
    if (activeFilter === "Care at home") {
      return providers.filter((provider) => provider.type.toLowerCase().includes("home care"));
    }
    return providers;
  }, [activeFilter, providers]);

  async function handleProviderAction(provider: ProviderMatch, status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") {
    if (!intake?.id || !provider.matchId) {
      setMessageTone("error");
      setMessage("This match is not ready for requests yet. Please check back after advisor review.");
      return;
    }

    setPendingMatchId(provider.matchId);
    setMessage("");

    try {
      const response = await fetch(`/api/matches/${provider.matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, intakeId: intake.id })
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setProviders((current) =>
        current.map((item) =>
          item.matchId === provider.matchId ? { ...item, matchStatus: status, action: matchStatusLabel(status) } : item
        )
      );
      setMessageTone("success");
      setMessage(
        status === "VISIT_REQUESTED"
          ? `Visit request sent for ${provider.name}. A care advisor will follow up.`
          : `Callback request sent for ${provider.name}.`
      );
    } catch {
      setMessageTone("error");
      setMessage("Could not send your request. Please try again.");
    } finally {
      setPendingMatchId(null);
    }
  }

  if (!intake) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <EmptyState
          title="Complete your intake first"
          description="Submit the care intake form so we can prepare matched providers for your family. No login is required — we save your request on this device."
        />
        <Button asChild className="mt-4">
          <Link href="/family/intake">Start intake</Link>
        </Button>
      </main>
    );
  }

  if (loading) {
    return <ResultsSkeleton />;
  }

  if (!providers.length) {
    const copy = emptyStateCopy(intake, loadError);

    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/family/dashboard" className="mb-4 inline-flex text-sm text-ink/60 hover:text-brand-amber">
          Back to dashboard
        </Link>
        <IntakeSummaryCard intake={intake} compact />
        <section className="mt-5 rounded-2xl bg-white shadow-soft">
          <EmptyState title={copy.title} description={copy.description} />
        </section>
        {loadError ? (
          <div className="mt-4">
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Refresh page
            </Button>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/family/dashboard" className="mb-4 inline-flex text-sm text-ink/60 hover:text-brand-amber">
        Back to dashboard
      </Link>

      <IntakeSummaryCard intake={intake} compact />

      <section className="mt-5 overflow-hidden rounded-2xl bg-white shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="p-5 sm:p-7">
            <p className="section-label">Best place to start</p>
            <h1 className="mt-2 text-h2 font-semibold text-ink">{recommended.name}</h1>
            <p className="mt-2 max-w-2xl text-body text-ink/75">{recommended.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {recommended.tags.map((tag) => (
                <Badge key={tag.label} variant="service">
                  {tag.label}
                </Badge>
              ))}
            </div>
            {recommended.matchStatus ? (
              <p className="mt-4 text-sm text-neutral-600">{matchStatusHint(recommended.matchStatus, recommended.name)}</p>
            ) : null}
          </div>
          <div className="border-t border-[var(--card-border)] bg-brand-cream p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <MatchScore score={recommended.match} size="sm" />
              <Badge variant={availabilityBadgeVariant(recommended.availability)}>{recommended.availability}</Badge>
              {recommended.matchStatus ? (
                <Badge variant="service">{matchStatusLabel(recommended.matchStatus)}</Badge>
              ) : null}
            </div>
            <div className="grid gap-3 text-sm">
              {recommended.meta.map((item) => (
                <ResultFact key={item} label="Detail" value={item} />
              ))}
              <ResultFact label="Availability" value={recommended.availability} />
              <ResultFact label="Match score" value={`${recommended.match}%`} />
            </div>
            <ButtonRow className="mt-5">
              <Button
                className="w-full"
                disabled={
                  pendingMatchId === recommended.matchId ||
                  recommended.matchStatus === "VISIT_REQUESTED" ||
                  recommended.matchStatus === "ACCEPTED"
                }
                onClick={() => void handleProviderAction(recommended, "VISIT_REQUESTED")}
              >
                {recommended.matchStatus === "VISIT_REQUESTED"
                  ? "Visit requested"
                  : recommended.matchStatus === "ACCEPTED"
                    ? "Provider accepted"
                    : pendingMatchId === recommended.matchId
                      ? "Sending..."
                      : "Request visit"}
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href={`/providers/${recommended.id}`}>Details</Link>
              </Button>
            </ButtonRow>
          </div>
        </div>
      </section>

      {message ? (
        <div
          className={`mt-4 rounded-lg px-5 py-4 text-sm ${
            messageTone === "success" ? "bg-brand-green-pale/30 text-brand-green-dark" : "bg-brand-beige-light/50 text-brand-amber-dark"
          }`}
          role="status"
        >
          {message}
        </div>
      ) : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl bg-white p-4 shadow-soft">
          <h2 className="text-sm font-semibold">Show me</h2>
          <div className="mt-3 grid gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeFilter === filter ? "bg-brand-amber text-white" : "bg-white text-ink/70 hover:bg-brand-cream hover:text-brand-amber"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </aside>

        <div className="grid gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-semibold">Other options to compare</h2>
              <p className="text-sm text-neutral-500">Keep one or two backups before making calls.</p>
            </div>
            <span className="text-sm text-neutral-500">{visibleProviders.length} shown</span>
          </div>
          {visibleProviders.map((provider) => (
            <CompareRow
              key={provider.id}
              provider={provider}
              pendingMatchId={pendingMatchId}
              onAction={handleProviderAction}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function ResultFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <span className="block text-xs text-neutral-500">{label}</span>
      <strong className="text-sm">{value}</strong>
    </div>
  );
}

function CompareRow({
  provider,
  pendingMatchId,
  onAction
}: {
  provider: ProviderMatch;
  pendingMatchId: string | null;
  onAction: (provider: ProviderMatch, status: "VISIT_REQUESTED" | "CALLBACK_REQUESTED") => void;
}) {
  const fit = provider.match >= 90 ? "Strong fit" : provider.match >= 75 ? "Good backup" : "Worth discussing";
  const visitSent = provider.matchStatus === "VISIT_REQUESTED";
  const accepted = provider.matchStatus === "ACCEPTED";

  return (
    <article className="grid gap-4 rounded-card border border-[var(--card-border)] bg-white p-5 shadow-soft md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
      <MatchScore score={provider.match} size="sm" />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink">{provider.name}</h3>
          <Badge variant={availabilityBadgeVariant(provider.availability)}>{provider.availability}</Badge>
          {provider.matchStatus ? <Badge variant="service">{matchStatusLabel(provider.matchStatus)}</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-ink/60">
          {provider.type} - {provider.area}
        </p>
        <p className="mt-1 text-xs font-medium text-brand-amber">{fit}</p>
        {provider.matchStatus ? (
          <p className="mt-2 text-sm text-neutral-600">{matchStatusHint(provider.matchStatus, provider.name)}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
          {provider.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <ButtonRow>
        <Button asChild size="sm" className="w-full">
          <Link href={`/providers/${provider.id}`}>Details</Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="w-full"
          disabled={pendingMatchId === provider.matchId || visitSent || accepted}
          onClick={() => onAction(provider, "VISIT_REQUESTED")}
        >
          {visitSent ? "Visit requested" : accepted ? "Accepted" : pendingMatchId === provider.matchId ? "Sending..." : "Request visit"}
        </Button>
      </ButtonRow>
    </article>
  );
}
