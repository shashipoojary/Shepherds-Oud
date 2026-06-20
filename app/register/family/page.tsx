import { SiteHeader } from "@/components/layout/site-header";
import { WaitlistForm } from "@/components/register/waitlist-form";
import { isPrelaunch } from "@/lib/config/prelaunch";

export default function FamilyRegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">Family waitlist</p>
          <h1 className="mt-2 text-3xl font-semibold">Register for care support</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            {isPrelaunch
              ? "Tell us about your situation anywhere in the Netherlands. We will reach out when Shepherds Oud is ready to help."
              : "Prefer a short registration first? Join the waitlist and we will take you to the full guided intake next."}
          </p>
          <div className="mt-8">
            <WaitlistForm type="FAMILY" />
          </div>
        </section>
      </main>
    </>
  );
}
