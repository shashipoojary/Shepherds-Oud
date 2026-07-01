import Link from "next/link";
import { CalendarDays, MapPin, UserRound } from "lucide-react";
import { splitFamilyIntakes, withIntakeId } from "@/lib/client/case-selection";
import { intakeStatusLabel, normalizeIntakeStatus } from "@/lib/domain/intake-workflow";
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
  description = "Choose which care request you want to open."
}: FamilyCasePickerProps) {
  const groups = splitFamilyIntakes(intakes);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-label">Family dashboard</p>
          <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{description}</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/family/intake">Start new request</Link>
        </Button>
      </div>

      <div className="mt-6 space-y-7">
        <CaseGroup title="Active requests" intakes={groups.active} />
        <CaseGroup title="History" intakes={groups.history} emptyText={groups.active.length ? undefined : "No completed requests yet."} />
      </div>
    </section>
  );
}

function CaseGroup({ title, intakes, emptyText }: { title: string; intakes: FamilyIntake[]; emptyText?: string }) {
  if (!intakes.length) {
    if (!emptyText) return null;
    return (
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-2 rounded-xl border border-dashed border-stone-200 bg-brand-cream/50 px-4 py-5 text-sm text-ink/55">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {intakes.map((intake) => (
          <CaseCard key={intake.id} intake={intake} />
        ))}
      </div>
    </div>
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

  return (
    <article className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge variant={statusVariant}>{intakeStatusLabel(status)}</Badge>
          <h3 className="mt-3 font-semibold text-ink">
            {intake.ageRange ? `Senior age ${intake.ageRange}` : "Care request"}
          </h3>
          <p className="mt-1 text-sm text-ink/60">{careType}</p>
        </div>
        <p className="rounded-lg bg-brand-cream px-2.5 py-1 text-xs font-semibold text-brand-green-dark">
          {intake.matchCount ?? 0} matches
        </p>
      </div>

      <dl className="mt-4 grid gap-2 text-sm text-ink/65">
        <CaseFact icon={MapPin} text={intake.preferredArea || "Location pending"} />
        <CaseFact icon={CalendarDays} text={createdLabel} />
        <CaseFact icon={UserRound} text={intake.careGuide?.name || "Care Guide pending"} />
      </dl>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Button asChild size="sm" className="w-full">
          <Link href={withIntakeId("/family/dashboard", intake.id)}>Open</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href={withIntakeId("/family/results", intake.id)}>View matches</Link>
        </Button>
        <Button asChild size="sm" variant="ghost" className="w-full">
          <Link href={withIntakeId("/family/intake?update=1", intake.id)}>Update</Link>
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
