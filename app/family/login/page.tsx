import { Suspense } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthLoginForm } from "@/components/auth/login-form";
import { noIndexMetadata } from "@/lib/config/seo";

export const metadata = {
  ...noIndexMetadata,
  title: "Family sign in | Shepherds Oud"
};

export default function FamilyLoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-card border border-[var(--card-border)] bg-white p-6 shadow-soft sm:p-8">
          <p className="section-label">For care seekers</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Sign in to your care dashboard</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">
            Use email or Google to view your care request, updates from your Care Guide, and provider matches.
          </p>

          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-ink/50">Loading sign-in...</p>}>
              <AuthLoginForm intent="family" />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-ink/60">
            Starting a new request?{" "}
            <Link href="/family/intake" className="font-medium text-brand-amber hover:text-brand-amber-mid">
              Complete the intake
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
