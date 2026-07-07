import Link from "next/link";
import { CalendarDays, MapPin, UserRound } from "lucide-react";
import { splitFamilyIntakes, withIntakeId } from "@/lib/client/case-selection";
import { intakeStatusLabel, normalizeIntakeStatus, canFamilyEditIntake } from "@/lib/domain/intake-workflow";
import type { FamilyIntake } from "@/lib/client/intake";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FamilyCasePickerProps = {
  intakes: FamilyIntake[];
  title?: string;
  description?: string;
};

export function FamilyCasePicker({
  intakes,
  title = "My care requests",
  description = "Choose a request to open its care journey."
}: FamilyCasePickerProps) {
  const { active, history } = splitFamilyIntakes(intakes);
  const sortedIntakes = [...active, ...history].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-label">Family dashboard</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{description}</p>
        </div>
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/family/intake">Start new request</Link>
        </Button>
      </div>

      {sortedIntakes.length ? (
        <>
          <p className="mt-6 text-sm text-ink/50">
            {sortedIntakes.length} request{sortedIntakes.length === 1 ? "" : "s"}
            {active.length && history.length
              ? ` · ${active.length} active, ${history.length} completed`
              : active.length
                ? " · in progress"
                : " · completed"}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {sortedIntakes.map((intake) => (
              <CaseCard key={intake.id} intake={intake} />
            ))}
          </div>
        </>
      ) : (
        <p className="mt-6 rounded-2xl bg-white px-5 py-8 text-center text-sm text-ink/55 shadow-soft">
          No care requests yet. Start a new request to begin.
        </p>
      )}
    </section>
  );
}

function CaseCard({ intake }: { intake: FamilyIntake }) {
  const status = normalizeIntakeStatus(intake.status);
  const submittedAt = new Date(intake.submittedAt);
  const createdLabel = Number.isNaN(submittedAt.getTime())
    ? "Date unavailable"
    : submittedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const careType = intake.careTypes?.[0] || "Care request";
  const statusVariant = status === "CLOSED" ? "closed" : status === "PLACED" ? "placed" : "matched";
  const canEdit = canFamilyEditIntake(intake.status);
  const hasMatches = (intake.matchCount ?? 0) > 0;

  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-soft transition hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={statusVariant}>{intakeStatusLabel(status)}</Badge>
        <span className="text-xs font-medium text-ink/45">{intake.matchCount ?? 0} matches</span>
      </div>

      <h3 className="mt-4 font-semibold text-ink">{intake.ageRange ? `Age ${intake.ageRange}` : "Care request"}</h3>
      <p className="mt-1 text-sm text-ink/60">{careType}</p>

      <dl className="mt-4 space-y-2 text-sm text-ink/65">
        <CaseFact icon={MapPin} text={intake.preferredArea || "Location pending"} />
        <CaseFact icon={CalendarDays} text={createdLabel} />
        <CaseFact icon={UserRound} text={intake.careGuide?.name || "Care Guide pending"} />
      </dl>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-4 text-sm">
        <Link
          href={withIntakeId("/family/dashboard", intake.id)}
          className="font-semibold text-brand-amber hover:text-brand-amber-mid"
        >
          Open journey
        </Link>
        {hasMatches ? (
          <Link href={withIntakeId("/family/results", intake.id)} className="text-ink/60 hover:text-brand-amber">
            View matches
          </Link>
        ) : null}
        {canEdit ? (
          <Link href={withIntakeId("/family/intake?update=1", intake.id)} className="text-ink/60 hover:text-brand-amber">
            Update
          </Link>
        ) : null}
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
