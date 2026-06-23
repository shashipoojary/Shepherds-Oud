import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthLoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = {
  ...noIndexMetadata,
  title: "Facility sign in | Shepherds Oud"
};

export default function ProviderLoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-card border border-[var(--card-border)] bg-white p-6 shadow-soft sm:p-8">
          <p className="section-label">For care facilities</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">List your facility on Shepherds Oud</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">
            Sign in with your work email or Google to manage your facility profile, availability, and family inquiries.
          </p>

          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-ink/50">Loading sign-in...</p>}>
              <AuthLoginForm intent="provider" />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-ink/60">
            Not ready to list yet?{" "}
            <Link href="/register/facility" className="font-medium text-brand-amber hover:text-brand-amber-mid">
              Join the facility waitlist
            </Link>
          </p>
          <div className="mt-4 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Back to homepage</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
