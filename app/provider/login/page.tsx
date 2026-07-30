import Link from "next/link";

import { redirect } from "next/navigation";

import { Suspense } from "react";

import { SiteHeader } from "@/components/layout/site-header";

import { AuthLoginForm } from "@/components/auth/login-form";

import { Button } from "@/components/ui/button";

import { getLocale } from "@/lib/i18n/get-locale";

import { productUi } from "@/lib/i18n/ui";

import { noIndexMetadata } from "@/lib/config/seo";

import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";



export const metadata = {

  ...noIndexMetadata,

  title: "Inloggen locatie | Shepherds Oud Care"

};



export default async function ProviderLoginPage() {

  if (getIsPrelaunch()) {

    redirect(getPublicRoutes(true).waitlistFacility);

  }



  const locale = await getLocale();

  const ui = productUi(locale);



  return (

    <>

      <SiteHeader />

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10 sm:px-6">

        <section className="w-full rounded-card border border-[var(--card-border)] bg-white p-6 shadow-soft sm:p-8">

          <p className="section-label">{ui.auth.providerLabel}</p>

          <h1 className="mt-2 text-2xl font-semibold text-ink">{ui.auth.providerTitle}</h1>

          <p className="mt-2 text-sm leading-relaxed text-ink/70">{ui.auth.providerIntro}</p>



          <div className="mt-6">

            <Suspense fallback={<p className="text-sm text-ink/50">{ui.auth.loadingSignIn}</p>}>

              <AuthLoginForm intent="provider" />

            </Suspense>

          </div>



          <p className="mt-6 text-center text-sm text-ink/60">

            {ui.auth.providerNotReady}{" "}

            <Link href="/register/facility" className="font-medium text-brand-amber hover:text-brand-amber-mid">

              {ui.auth.providerWaitlist}

            </Link>

          </p>

          <div className="mt-4 text-center">

            <Button asChild variant="ghost" size="sm">

              <Link href="/">{ui.auth.backHome}</Link>

            </Button>

          </div>

        </section>

      </main>

    </>

  );

}

