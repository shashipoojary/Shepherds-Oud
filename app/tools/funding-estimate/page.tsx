import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FundingEstimateClient } from "@/components/tools/funding-estimate-client";
import { getUserRole, getServerSession } from "@/lib/auth/server";
import { prisma } from "@/lib/core/db";
import { isBudgetBandOption } from "@/lib/domain/funding-estimate";
import { CARE_TYPE_OPTIONS, FUNDING_TYPE_OPTIONS } from "@/lib/domain/intake-field-utils";
import { getLocale } from "@/lib/i18n/get-locale";
import { productUi } from "@/lib/i18n/ui";

export async function generateMetadata() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.fundingEstimate;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default async function FundingEstimatePage() {
  const locale = await getLocale();
  const copy = productUi(locale).pages.fundingEstimate;
  const session = await getServerSession();

  let prefill: {
    careTypes: string[];
    fundingTypes: string[];
    budget: string | null;
  } | null = null;

  let primaryHref = "/contact";

  if (session) {
    const role = getUserRole(session);
    if (role === "FAMILY") {
      primaryHref = "/family/intake";
      const intake = await prisma.intake.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: { careTypes: true, fundingTypes: true, budget: true }
      });

      if (intake) {
        const careAllowed = new Set<string>(CARE_TYPE_OPTIONS);
        const fundingAllowed = new Set<string>(FUNDING_TYPE_OPTIONS);
        prefill = {
          careTypes: intake.careTypes.filter((value) => careAllowed.has(value)),
          fundingTypes: intake.fundingTypes.filter((value) => fundingAllowed.has(value)),
          budget: intake.budget && isBudgetBandOption(intake.budget) ? intake.budget : null
        };
      }
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="page-gutter">
        <article className="page-panel max-w-3xl">
          <p className="section-label">{copy.label}</p>
          <h1 className="mt-3 font-brand text-3xl font-bold text-ink sm:mt-4 sm:text-4xl">{copy.title}</h1>
          <p className="mt-4 text-body leading-relaxed text-ink/80">{copy.intro}</p>
          <div className="mt-10">
            <FundingEstimateClient
              prefill={prefill}
              primaryHref={primaryHref}
              secondaryHref="/faq#funding"
            />
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
