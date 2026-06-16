import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { WaitlistForm } from "@/components/waitlist-form";
import { Button } from "@/components/ui/button";
import { PROVIDER_LOGIN_PATH } from "@/lib/auth-routes";

export default function FacilityRegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <section className="mb-5 rounded-card border border-brand-amber/30 bg-brand-amber/5 p-5 sm:p-6">
          <p className="section-label">Ready to list now?</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Sign in to manage your facility profile</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">
            Care facilities can sign in with Google to create a profile, set availability, and receive enquiries — no waitlist required.
          </p>
          <Button asChild className="mt-4">
            <Link href={PROVIDER_LOGIN_PATH}>List your facility</Link>
          </Button>
        </section>

        <section className="rounded-card border border-[var(--card-border)] bg-white p-6 shadow-soft sm:p-8">
          <p className="section-label">Facility waitlist</p>
          <h1 className="mt-2 text-3xl font-semibold">Register your care facility</h1>
          <p className="mt-3 text-sm leading-7 text-ink/70">
            Not ready to list yet? Join the provider waitlist and we will contact you before launch. Ideal for care homes, assisted living, and home care agencies.
          </p>
          <div className="mt-8">
            <WaitlistForm type="FACILITY" />
          </div>
        </section>
      </main>
    </>
  );
}
