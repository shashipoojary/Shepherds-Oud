import type { CareGuideInfo } from "@/lib/client/intake";
import { ubuntuTagline } from "@/lib/config/content";

export function CareGuideCard({ guide, compact = false }: { guide: CareGuideInfo; compact?: boolean }) {
  return (
    <article
      className={`rounded-2xl border border-brand-green-pale bg-brand-green-pale/20 ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <p className="section-label">Your Care Guide — assigned</p>
      <h2 className="mt-1 text-lg font-semibold text-ink">{guide.name}</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-700">
        {ubuntuTagline} {guide.name} personally reviews your case and supports you through assessment, care planning, visits,
        visits, placement, and follow-up.
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
