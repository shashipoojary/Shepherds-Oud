import { Suspense } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthLoginForm } from "@/components/auth/login-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = {
  ...noIndexMetadata,
  title: "Inloggen familie | Shepherds Oud"
};

export default async function FamilyLoginPage() {
  const locale = await getLocale();
  const ui = productUi(locale);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-card border border-[var(--card-border)] bg-white p-6 shadow-soft sm:p-8">
          <p className="section-label">{ui.auth.familyLabel}</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">{ui.auth.familyTitle}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">{ui.auth.familyIntro}</p>

          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-ink/50">{ui.auth.loadingSignIn}</p>}>
              <AuthLoginForm intent="family" />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-ink/60">
            {ui.auth.familyStarting}{" "}
            <Link href="/family/intake" className="font-medium text-brand-amber hover:text-brand-amber-mid">
              {ui.auth.familyCta}
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
