import { SiteHeader } from "@/components/site-header";
import { WaitlistForm } from "@/components/waitlist-form";

export default function FamilyRegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">Family waitlist</p>
          <h1 className="mt-2 text-3xl font-semibold">Register for care support</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            Tell us about your situation anywhere in the Netherlands. We will reach out when Shepherds Oud is ready to help.
          </p>
          <div className="mt-8">
            <WaitlistForm type="FAMILY" />
          </div>
        </section>
      </main>
    </>
  );
}
