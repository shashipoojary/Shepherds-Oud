import { Suspense } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthLoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n/get-locale";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = {
  ...noIndexMetadata,
  title: "Hospital login | Shepherds Oud Care"
};

export default async function HospitalLoginPage() {
  const locale = await getLocale();
  const en = locale === "en";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-card border border-[var(--card-border)] bg-white p-6 shadow-soft sm:p-8">
          <p className="section-label">{en ? "For hospitals" : "Voor ziekenhuizen"}</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">
            {en ? "Sign in to refer families" : "Log in om families te verwijzen"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">
            {en
              ? "Use the email that received your Shepherds Oud Care hospital invite."
              : "Gebruik het e-mailadres waarop u de Shepherds Oud Care-ziekenhuisuitnodiging heeft ontvangen."}
          </p>

          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-ink/50">{en ? "Loading sign-in..." : "Inloggen laden..."}</p>}>
              <AuthLoginForm intent="hospital" />
            </Suspense>
          </div>

          <div className="mt-4 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">{en ? "Back to homepage" : "Terug naar homepage"}</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
