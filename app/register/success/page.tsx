import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { ButtonLabel } from "@/components/ui/button-label";
import { ButtonRow } from "@/components/ui/button-row";
import { cn } from "@/lib/core/utils";
import { noIndexMetadata } from "@/lib/config/seo";
import { getIsPrelaunch, getPublicRoutes } from "@/lib/config/prelaunch";

export const metadata = noIndexMetadata;

export default async function RegisterSuccessPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams;
  const isFacility = params.type === "facility";
  const isPrelaunch = getIsPrelaunch();
  const publicRoutes = getPublicRoutes(isPrelaunch);

  return (
    <>
      <SiteHeader hideAuth />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <section className="rounded-2xl bg-white p-8 text-center shadow-soft">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sage-100 text-2xl text-sage-700">✓</div>
          <h1 className="mt-5 text-2xl font-semibold">You are on the waitlist</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            {isFacility
              ? "Thank you for registering your care facility. We will contact you when provider onboarding opens."
              : "Thank you for registering. We will contact you as soon as Shepherds Oud is ready to support you."}
          </p>
          <ButtonRow
            className={cn("mt-8", isPrelaunch || isFacility ? "mx-auto max-w-xs justify-items-center" : undefined)}
            columns={isPrelaunch || isFacility ? 1 : 2}
          >
            <Button asChild className="w-full">
              <Link href={publicRoutes.home}>Back to home</Link>
            </Button>
            {!isPrelaunch && !isFacility ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={publicRoutes.intake}>
                  <ButtonLabel short="Care intake">Start a care intake</ButtonLabel>
                </Link>
              </Button>
            ) : null}
          </ButtonRow>
        </section>
      </main>
    </>
  );
}
