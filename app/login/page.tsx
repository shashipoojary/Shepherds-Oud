import { Suspense } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { AuthLoginForm } from "@/components/auth-login-form";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-2xl bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">Staff sign in</p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Sign in to Shepherds Oud</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Use your approved Google account to access the admin or provider dashboard.
          </p>

          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-neutral-500">Loading sign-in...</p>}>
              <AuthLoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Looking for care?{" "}
            <Link href="/family/intake" className="font-medium text-sage-700 hover:text-sage-600">
              Start the family intake
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
