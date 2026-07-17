"use client";

import type { CareGuideInfo } from "@/lib/client/intake";
import { useLocale } from "@/components/i18n/locale-provider";
import { siteTagline } from "@/lib/config/marketing-en";

export function CareGuideCard({ guide, compact = false }: { guide: CareGuideInfo; compact?: boolean }) {
  const { locale, ui } = useLocale();
  const tagline = siteTagline(locale);

  return (
    <article
      className={`rounded-2xl border border-brand-green-pale bg-brand-green-pale/20 ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <p className="section-label">{ui.family.careGuideAssigned}</p>
      <h2 className="mt-1 text-lg font-semibold text-ink">{guide.name}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-700">
        {tagline} {ui.family.careGuideSupport(guide.name)}
      </p>
      <p className="mt-3 text-sm text-neutral-600">
        Email:{" "}
        <a href={`mailto:${guide.email}`} className="font-medium text-brand-green-dark underline-offset-2 hover:underline">
          {guide.email}
        </a>
      </p>
    </article>
  );
}
