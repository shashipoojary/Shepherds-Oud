"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CrisisDirectorySkeleton } from "@/components/crisis-v2/crisis-skeletons";
import { useLocale } from "@/components/i18n/locale-provider";
import { HAAGLANDEN_MUNICIPALITIES } from "@/lib/config/haaglanden";
import { crisisPaths } from "@/lib/config/crisis-v2";
import { crisisV2Ui } from "@/lib/i18n/crisis-v2-ui";

type Provider = {
  id: string;
  name: string;
  type: string;
  municipality: string;
  languages: string[];
  fundingAccepted: string[];
  verifiedStatus: string;
};

const selectClass =
  "rounded-lg border-[1.5px] border-[var(--card-border)] bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-amber";

function typeLabel(type: string, ui: ReturnType<typeof crisisV2Ui>) {
  if (type === "HOME_CARE") return ui.directory.typeHomeCare;
  if (type === "RESIDENTIAL") return ui.directory.typeResidential;
  return type.replaceAll("_", " ");
}

function DirectoryInner({
  initialProviders,
  initialCaseId
}: {
  initialProviders?: Provider[];
  initialCaseId?: string | null;
}) {
  const { locale } = useLocale();
  const ui = crisisV2Ui(locale);
  const searchParams = useSearchParams();
  const caseIdFromUrl = searchParams.get("caseId") || "";
  const seededCaseId = caseIdFromUrl || initialCaseId || "";
  const [caseId, setCaseId] = useState(seededCaseId);
  const [caseResolved, setCaseResolved] = useState(Boolean(seededCaseId) || initialCaseId !== undefined);
  const [type, setType] = useState(searchParams.get("type") || "");
  const [municipality, setMunicipality] = useState("");
  const [providers, setProviders] = useState<Provider[]>(initialProviders ?? []);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(initialProviders === undefined);

  useEffect(() => {
    if (caseIdFromUrl) {
      setCaseId(caseIdFromUrl);
      setCaseResolved(true);
      return;
    }

    if (initialCaseId) {
      setCaseId(initialCaseId);
      setCaseResolved(true);
      return;
    }

    if (initialCaseId === null) {
      setCaseId("");
      setCaseResolved(true);
      return;
    }

    let cancelled = false;
    setCaseResolved(false);
    void fetch("/api/v2/cases?fields=caseId")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { caseId?: string } | null) => {
        if (cancelled) return;
        setCaseId(data?.caseId || "");
      })
      .catch(() => {
        if (!cancelled) setCaseId("");
      })
      .finally(() => {
        if (!cancelled) setCaseResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, [caseIdFromUrl, initialCaseId]);

  useEffect(() => {
    // First paint already has SSR data — skip duplicate fetch until filters change.
    if (!type && !municipality && initialProviders !== undefined) {
      setProviders(initialProviders);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (municipality) params.set("municipality", municipality);
    void fetch(`/api/v2/directory?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { providers?: Provider[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else {
          setError("");
          setProviders(data.providers || []);
        }
      })
      .catch(() => {
        if (!cancelled) setError(ui.directory.loadError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, municipality, ui.directory.loadError, initialProviders]);

  if (loading && !providers.length && !error) {
    return <CrisisDirectorySkeleton />;
  }

  return (
    <div className="grid gap-5">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <h1 className="font-brand text-2xl font-semibold text-ink">{ui.directory.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">{ui.directory.subtitle}</p>

        {caseResolved && !caseId ? (
          <div className="mt-5">
            <p className="text-sm leading-6 text-ink/65">{ui.directory.browseOnlyBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={crisisPaths.dashboard}>{ui.directory.browseOnlyCtaDashboard}</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={crisisPaths.triage(1)}>{ui.directory.browseOnlyCtaTriage}</Link>
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-4">
          <label className="grid gap-1.5 text-xs text-ink/60">
            {ui.directory.filterType}
            <select className={selectClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">{ui.directory.typeAll}</option>
              <option value="HOME_CARE">{ui.directory.typeHomeCare}</option>
              <option value="RESIDENTIAL">{ui.directory.typeResidential}</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs text-ink/60">
            {ui.directory.filterMunicipality}
            <select className={selectClass} value={municipality} onChange={(e) => setMunicipality(e.target.value)}>
              <option value="">{ui.directory.municipalityAll}</option>
              {HAAGLANDEN_MUNICIPALITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {!error && providers.length === 0 ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-6">
          <p className="text-sm text-ink/60">{ui.directory.empty}</p>
        </div>
      ) : null}

      {!error && providers.length > 0 ? (
        <section className="rounded-2xl bg-white shadow-soft">
          <ul className="divide-y divide-stone-100">
            {providers.map((provider) => (
              <li key={provider.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{provider.name}</p>
                  <p className="mt-0.5 text-xs text-ink/55">
                    {typeLabel(provider.type, ui)} · {provider.municipality}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/directory/${provider.id}${caseId ? `?caseId=${caseId}` : ""}`}>
                    {ui.directory.details}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function DirectoryClient({
  initialProviders,
  initialCaseId
}: {
  initialProviders?: Provider[];
  initialCaseId?: string | null;
}) {
  return (
    <Suspense fallback={<CrisisDirectorySkeleton />}>
      <DirectoryInner initialProviders={initialProviders} initialCaseId={initialCaseId} />
    </Suspense>
  );
}
