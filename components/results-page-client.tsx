"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProviderMatch } from "@/lib/types";

const filters = ["All options", "Can contact today", "Memory care", "Care at home"];

export function ResultsPageClient({ providers }: { providers: ProviderMatch[] }) {
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [message, setMessage] = useState("");
  const recommended = providers[0];

  const visibleProviders = useMemo(() => {
    if (activeFilter === "All options") return providers;
    if (activeFilter === "Can contact today") return providers.filter((provider) => provider.availability.includes("Available"));
    if (activeFilter === "Memory care") return providers.filter((provider) => provider.tags.some((tag) => tag.label.includes("Dementia")));
    if (activeFilter === "Care at home") return providers.filter((provider) => provider.type.includes("Home care"));
    return providers;
  }, [activeFilter, providers]);

  function handleProviderAction(provider: ProviderMatch) {
    setMessage(`${provider.action} saved for ${provider.name}. We will help you with the next phone call.`);
  }

  if (!providers.length) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/family/dashboard" className="mb-4 inline-flex text-sm text-neutral-500 hover:text-sage-600">
          Back to dashboard
        </Link>
        <section className="rounded-2xl bg-white shadow-soft">
          <EmptyState
            title="No matched providers yet"
            description="Once your intake is reviewed and providers are added to the platform, your recommended options will appear here."
          />
        </section>
        <div className="mt-4">
          <Button asChild>
            <Link href="/family/intake">Update intake details</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/family/dashboard" className="mb-4 inline-flex text-sm text-neutral-500 hover:text-sage-600">
        Back to dashboard
      </Link>

      <section className="overflow-hidden rounded-2xl bg-white shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">Best place to start</p>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-950">{recommended.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              {recommended.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {recommended.tags.map((tag) => (
                <span key={tag.label} className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
          <div className="border-t border-stone-200 bg-cream p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="grid gap-3 text-sm">
              {recommended.meta.map((item) => (
                <ResultFact key={item} label="Detail" value={item} />
              ))}
              <ResultFact label="Availability" value={recommended.availability} />
            </div>
            <ButtonRow className="mt-5">
              <Button className="w-full" onClick={() => handleProviderAction(recommended)}>
                Request a visit
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href={`/providers/${recommended.id}`}>Read full details</Link>
              </Button>
            </ButtonRow>
          </div>
        </div>
      </section>

      {message ? <div className="mt-4 rounded-[10px] bg-sage-100 px-5 py-4 text-sm text-sage-700">{message}</div> : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl bg-white p-4 shadow-soft">
          <h2 className="text-sm font-semibold">Show me</h2>
          <div className="mt-3 grid gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeFilter === filter ? "bg-sage-600 text-white" : "bg-white text-neutral-600 hover:bg-sage-100 hover:text-sage-700"
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
            <CompareRow key={provider.id} provider={provider} onAction={handleProviderAction} />
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-4 rounded-2xl bg-sage-100 p-5 text-sage-800 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 className="font-semibold">Want someone to explain the choices?</h2>
          <p className="mt-1 text-sm">A care advisor can walk through the list with you and help decide who to contact first.</p>
        </div>
        <Button size="sm" onClick={() => setMessage("A care advisor callback has been requested.")}>
          Talk to an advisor
        </Button>
      </div>
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

function CompareRow({ provider, onAction }: { provider: ProviderMatch; onAction: (provider: ProviderMatch) => void }) {
  const fit = provider.match >= 90 ? "Strong fit" : provider.match >= 75 ? "Good backup" : "Worth discussing";

  return (
    <article className="grid gap-4 rounded-2xl bg-white p-5 shadow-soft md:grid-cols-[150px_minmax(0,1fr)_auto] md:items-center">
      <div>
        <span className="inline-flex rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700">{fit}</span>
        <p className="mt-2 text-sm text-neutral-500">{provider.match}% fit</p>
      </div>
      <div>
        <h3 className="font-semibold">{provider.name}</h3>
        <p className="mt-1 text-sm text-neutral-500">
          {provider.type} - {provider.area}
        </p>
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
        <Button size="sm" variant="ghost" className="w-full" onClick={() => onAction(provider)}>
          {provider.action}
        </Button>
      </ButtonRow>
    </article>
  );
}
