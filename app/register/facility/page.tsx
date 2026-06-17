import { SiteHeader } from "@/components/site-header";
import { WaitlistForm } from "@/components/waitlist-form";

export default function FacilityRegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-card border border-[var(--card-border)] bg-white p-6 shadow-soft sm:p-8">
          <p className="section-label">Facility waitlist</p>
          <h1 className="mt-2 text-3xl font-semibold">Register your care facility</h1>
          <p className="mt-3 text-base leading-7 text-ink/75">
            Shepherds Oud is preparing for launch. Register your interest and we will contact you when your facility can list services on the platform.
          </p>
          <div className="mt-8">
            <WaitlistForm type="FACILITY" />
          </div>
        </section>
      </main>
    </>
  );
}
