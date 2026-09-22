"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CrisisDirectoryDetailSkeleton } from "@/components/crisis-v2/crisis-skeletons";
import { useLocale } from "@/components/i18n/locale-provider";
import { crisisPaths } from "@/lib/config/crisis-v2";
import { TOAST_DISMISS_MS } from "@/lib/client/toast-timing";
import type { DirectoryDetailItem } from "@/lib/data/directory";
import { crisisV2Ui } from "@/lib/i18n/crisis-v2-ui";
import { cn } from "@/lib/core/utils";

function typeLabel(type: string, ui: ReturnType<typeof crisisV2Ui>) {
  if (type === "HOME_CARE") return ui.directory.typeHomeCare;
  if (type === "RESIDENTIAL") return ui.directory.typeResidential;
  return type.replaceAll("_", " ");
}

function languageLabel(code: string, locale: string) {
  const map: Record<string, { en: string; nl: string }> = {
    nl: { en: "Dutch", nl: "Nederlands" },
    en: { en: "English", nl: "Engels" },
    de: { en: "German", nl: "Duits" },
    fr: { en: "French", nl: "Frans" },
    tr: { en: "Turkish", nl: "Turks" },
    ar: { en: "Arabic", nl: "Arabisch" }
  };
  const entry = map[code.toLowerCase()];
  if (!entry) return code;
  return locale === "en" ? entry.en : entry.nl;
}

function DetailInner({
  providerId,
  initialProvider,
  initialCaseId
}: {
  providerId: string;
  initialProvider?: DirectoryDetailItem | null;
  initialCaseId?: string | null;
}) {
  const searchParams = useSearchParams();
  const caseIdFromUrl = searchParams.get("caseId") || "";
  const { locale } = useLocale();
  const ui = crisisV2Ui(locale);
  const seededCaseId = caseIdFromUrl || initialCaseId || "";
  const [caseId, setCaseId] = useState(seededCaseId);
  const [provider, setProvider] = useState<DirectoryDetailItem | null>(initialProvider ?? null);
  const [toast, setToast] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState(() =>
    initialProvider === null ? ui.directory.loadDetailError : ""
  );
  const [loading, setLoading] = useState(initialProvider === undefined);
  const [done, setDone] = useState(false);

  const canContact = Boolean(caseId);

  useEffect(() => {
    if (caseIdFromUrl) setCaseId(caseIdFromUrl);
  }, [caseIdFromUrl]);

  useEffect(() => {
    if (initialProvider !== undefined) {
      if (initialCaseId && !caseIdFromUrl) setCaseId(initialCaseId);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError("");

    const providerPromise = fetch(`/api/v2/directory/${providerId}`).then(async (response) => {
      const data = (await response.json()) as { provider?: DirectoryDetailItem; error?: string };
      if (!response.ok) throw new Error(data.error || ui.directory.loadDetailError);
      return data.provider || null;
    });

    const casePromise = caseIdFromUrl
      ? Promise.resolve(caseIdFromUrl)
      : fetch("/api/v2/cases?fields=caseId")
          .then(async (response) => {
            if (!response.ok) return "";
            const data = (await response.json()) as { caseId?: string };
            return data.caseId || "";
          })
          .catch(() => "");

    void Promise.all([providerPromise, casePromise])
      .then(([nextProvider, nextCaseId]) => {
        if (cancelled) return;
        setProvider(nextProvider);
        if (nextCaseId) setCaseId(nextCaseId);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : ui.directory.loadDetailError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [providerId, caseIdFromUrl, initialProvider, initialCaseId, ui.directory.loadDetailError]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function contact() {
    setToast(null);
    if (!caseId) {
      setToast({ tone: "error", text: ui.directory.browseOnlyBody });
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/v2/directory/${providerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setToast({
          tone: "error",
          text:
            data.error === "Unauthorized"
              ? ui.directory.needLogin
              : data.error || ui.directory.contactFailed
        });
        return;
      }
      setDone(true);
      setToast({ tone: "success", text: ui.directory.contacted });
    } catch {
      setToast({ tone: "error", text: ui.directory.contactFailed });
    } finally {
      setPending(false);
    }
  }

  if (loading) return <CrisisDirectoryDetailSkeleton />;

  if (loadError && !provider) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
        {loadError}
      </div>
    );
  }

  if (!provider) return <CrisisDirectoryDetailSkeleton />;

  const languages =
    provider.languages.map((code) => languageLabel(code, locale)).join(", ") || "—";

  return (
    <section className="mx-auto max-w-3xl">
      <Link
        href={`/directory${caseId ? `?caseId=${caseId}` : ""}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 transition hover:text-brand-amber"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {ui.directory.back}
      </Link>

      {toast ? (
        <div
          className={cn(
            "mb-4 rounded-xl px-4 py-3 text-sm",
            toast.tone === "success"
              ? "bg-brand-green-pale/30 text-brand-green-dark"
              : "bg-red-50 text-red-800"
          )}
          role="status"
        >
          {toast.text}
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <p className="section-label">
          {typeLabel(provider.type, ui)} · {provider.municipality}
        </p>
        <h1 className="mt-2 font-brand text-2xl font-semibold text-ink">{provider.name}</h1>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink/50">{ui.directory.languages}</dt>
            <dd className="mt-1 text-ink/80">{languages}</dd>
          </div>
          <div>
            <dt className="text-ink/50">{ui.directory.funding}</dt>
            <dd className="mt-1 text-ink/80">{provider.fundingAccepted.join(", ") || "—"}</dd>
          </div>
        </dl>

        {provider.websiteUrl ? (
          <a
            className="mt-4 inline-block text-sm font-medium text-brand-amber hover:text-brand-amber-mid"
            href={provider.websiteUrl}
            target="_blank"
            rel="noreferrer"
          >
            {ui.directory.website}
          </a>
        ) : null}

        <div className="mt-7 border-t border-stone-100 pt-6">
          {canContact ? (
            <>
              <p className="mb-3 text-sm text-ink/65">{ui.directory.readyToContact}</p>
              <Button onClick={() => void contact()} disabled={pending || done}>
                {pending ? ui.directory.contacting : done ? ui.directory.contactDone : ui.directory.contact}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm leading-6 text-ink/65">{ui.directory.browseOnlyBody}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={crisisPaths.dashboard}>{ui.directory.browseOnlyCtaDashboard}</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={crisisPaths.triage(1)}>{ui.directory.browseOnlyCtaTriage}</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function DirectoryDetailClient({
  providerId,
  initialProvider,
  initialCaseId
}: {
  providerId: string;
  initialProvider?: DirectoryDetailItem | null;
  initialCaseId?: string | null;
}) {
  return (
    <Suspense fallback={<CrisisDirectoryDetailSkeleton />}>
      <DetailInner
        providerId={providerId}
        initialProvider={initialProvider}
        initialCaseId={initialCaseId}
      />
    </Suspense>
  );
}
