import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default async function RegisterSuccessPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams;
  const isFacility = params.type === "facility";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <section className="rounded-2xl bg-white p-8 text-center shadow-soft">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sage-100 text-2xl text-sage-700">✓</div>
          <h1 className="mt-5 text-2xl font-semibold">You are on the waitlist</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            {isFacility
              ? "Thank you for registering your care facility. We will contact you when provider onboarding opens."
              : "Thank you for registering. We will contact you as soon as Shepherds Oud is ready to support your family."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/family/intake">Start a care intake</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
