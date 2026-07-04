import Link from "next/link";
import { CalendarDays, MapPin, UserRound } from "lucide-react";
import { isHistoryIntake, splitFamilyIntakes, withIntakeId } from "@/lib/client/case-selection";
import { intakeStatusLabel, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
import type { FamilyIntake } from "@/lib/client/intake";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

type FamilyCaseHistoryPanelProps = {
  intakes: FamilyIntake[];
  currentIntakeId: string;
};

export function FamilyCaseHistoryPanel({ intakes, currentIntakeId }: FamilyCaseHistoryPanelProps) {
  const groups = splitFamilyIntakes(intakes);
  const hasMultiple = intakes.length > 1;
  const hasHistory = groups.history.length > 0;

  if (!hasMultiple && !hasHistory) {
    return null;
  }

  return (
    <CollapsibleSection
      title={hasHistory && !groups.active.length ? "Your care request history" : "Your care requests"}
      description={
        hasMultiple
          ? "Switch between active and completed requests. Each request keeps its own journey and provider history."
          : "Review completed care requests and their provider history."
      }
      defaultOpen={hasHistory && groups.active.length === 0}
    >
      <div className="space-y-6">
        {groups.active.length ? (
          <CaseGroup title="Active requests" intakes={groups.active} currentIntakeId={currentIntakeId} />
        ) : null}
        {groups.history.length ? (
          <CaseGroup title="History" intakes={groups.history} currentIntakeId={currentIntakeId} />
        ) : null}
      </div>
    </CollapsibleSection>
  );
}

function CaseGroup({
  title,
  intakes,
  currentIntakeId
}: {
  title: string;
  intakes: FamilyIntake[];
  currentIntakeId: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {intakes.map((intake) => (
          <CaseHistoryCard key={intake.id} intake={intake} isCurrent={intake.id === currentIntakeId} />
        ))}
      </div>
    </div>
  );
}

function CaseHistoryCard({ intake, isCurrent }: { intake: FamilyIntake; isCurrent: boolean }) {
  const status = normalizeIntakeStatus(intake.status);
  const submittedAt = new Date(intake.submittedAt);
  const createdLabel = Number.isNaN(submittedAt.getTime())
    ? "Date unavailable"
    : submittedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const careType = intake.careTypes?.[0] || "Care request";
  const statusVariant = status === "CLOSED" ? "closed" : status === "PLACED" ? "placed" : "matched";
  const historyCase = isHistoryIntake(intake);

  return (
    <article
      className={`rounded-xl border p-4 shadow-sm ${
        isCurrent ? "border-brand-amber/40 bg-brand-amber/5 ring-1 ring-brand-amber/20" : "border-stone-200/80 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant}>{intakeStatusLabel(status)}</Badge>
            {isCurrent ? (
              <span className="rounded-full bg-brand-amber px-2.5 py-0.5 text-[11px] font-semibold text-white">Viewing now</span>
            ) : null}
          </div>
          <h4 className="mt-3 font-semibold text-ink">{intake.ageRange ? `Senior age ${intake.ageRange}` : "Care request"}</h4>
          <p className="mt-1 text-sm text-ink/60">{careType}</p>
        </div>
        {!historyCase ? (
          <p className="rounded-lg bg-brand-cream px-2.5 py-1 text-xs font-semibold text-brand-green-dark">
            {intake.matchCount ?? 0} matches
          </p>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-ink/65">
        <CaseFact icon={MapPin} text={intake.preferredArea || "Location pending"} />
        <CaseFact icon={CalendarDays} text={createdLabel} />
        <CaseFact icon={UserRound} text={intake.careGuide?.name || "Care Guide pending"} />
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {!isCurrent ? (
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href={withIntakeId("/family/dashboard", intake.id)}>Open request</Link>
          </Button>
        ) : null}
        <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
          <Link href={withIntakeId("/family/results", intake.id)}>{historyCase ? "View provider history" : "View matches"}</Link>
        </Button>
      </div>
    </article>
  );
}

function CaseFact({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-brand-amber" aria-hidden />
      <span className="min-w-0 truncate">{text}</span>
    </div>
  );
}
