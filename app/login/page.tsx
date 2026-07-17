import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthLoginForm } from "@/components/auth/login-form";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = {
  ...noIndexMetadata,
  title: "Care Guide-inlog | Shepherds Oud"
};

export default async function LoginPage() {
  const locale = await getLocale();
  const ui = productUi(locale);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-2xl bg-white p-6 shadow-soft sm:p-8">
          <p className="section-label">{ui.auth.adminLabel}</p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">{ui.auth.adminTitle}</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{ui.auth.adminIntro}</p>

          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-neutral-500">{ui.auth.loadingSignIn}</p>}>
              <AuthLoginForm intent="admin" />
            </Suspense>
          </div>
        </section>
      </main>
    </>
  );
}
