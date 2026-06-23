import { SiteHeader } from "@/components/layout/site-header";
import { WaitlistForm } from "@/components/register/waitlist-form";
import { getIsPrelaunch } from "@/lib/config/prelaunch";

export default function FamilyRegisterPage() {
  const isPrelaunch = getIsPrelaunch();
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
              : "Register your interest and we will reach out. When you are ready for full guided navigation, you can start a care intake separately."}
          </p>
          <div className="mt-8">
            <WaitlistForm type="FAMILY" />
          </div>
        </section>
      </main>
    </>
  );
}
