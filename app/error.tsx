"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/locale-provider";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-brand-cream px-4 py-16">
      <div className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft">
        <p className="section-label">{isEn ? "Something went wrong" : "Er ging iets mis"}</p>
        <h1 className="mt-2 font-brand text-2xl font-semibold text-ink sm:text-3xl">
          {isEn ? "We could not load this page" : "Deze pagina kon niet worden geladen"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink/70">
          {isEn
            ? "Please try again. If the problem continues, contact us and we will help."
            : "Probeer het opnieuw. Blijft het probleem bestaan, neem dan contact met ons op."}
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-neutral-400">Ref: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-amber px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-amber-mid"
          >
            {isEn ? "Try again" : "Opnieuw proberen"}
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand-amber hover:text-brand-amber"
          >
            {isEn ? "Back to home" : "Naar home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
