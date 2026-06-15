import { SiteHeader } from "@/components/site-header";
import { WaitlistForm } from "@/components/waitlist-form";

export default function FacilityRegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">Facility waitlist</p>
          <h1 className="mt-2 text-3xl font-semibold">Register your care facility</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            Join the provider waitlist and list your property before launch. Ideal for care homes, assisted living, and home care agencies.
          </p>
          <div className="mt-8">
            <WaitlistForm type="FACILITY" />
          </div>
        </section>
      </main>
    </>
  );
}
