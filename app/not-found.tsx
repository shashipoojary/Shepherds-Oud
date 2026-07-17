import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function NotFound() {
  const locale = await getLocale();
  const isEn = locale === "en";

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[60vh] items-center justify-center bg-brand-cream px-4 py-16">
        <div className="mx-auto max-w-lg text-center">
          <p className="section-label">{isEn ? "Not found" : "Niet gevonden"}</p>
          <h1 className="mt-2 font-brand text-3xl font-semibold text-ink sm:text-4xl">
            {isEn ? "This page does not exist" : "Deze pagina bestaat niet"}
          </h1>
          <p className="mt-3 text-body text-ink/70">
            {isEn
              ? "Check the address, or go back to the homepage to continue."
              : "Controleer het adres, of ga terug naar de homepage om verder te gaan."}
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-amber px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-amber-mid"
          >
            {isEn ? "Back to home" : "Naar home"}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
