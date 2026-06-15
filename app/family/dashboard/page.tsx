import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ButtonRow } from "@/components/ui/button-row";
import { EmptyState } from "@/components/ui/empty-state";

export default function FamilyDashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage-700">Family dashboard</p>
          <h1 className="mt-2 text-2xl font-semibold">Your care journey</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Once your intake is reviewed and providers are matched, your progress and recommended options will appear here.
          </p>
          <ButtonRow className="mt-5 max-w-lg">
            <Button asChild className="w-full">
              <Link href="/family/intake">Start or update intake</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/family/results">View matched providers</Link>
            </Button>
          </ButtonRow>
        </header>

        <section className="mt-5 rounded-2xl bg-white shadow-soft">
          <EmptyState
            title="No active case yet"
            description="Submit the family intake form to begin. Our team will review your details and contact you with next steps."
          />
        </section>
      </main>
    </>
  );
}
