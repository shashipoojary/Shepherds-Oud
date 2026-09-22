"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CrisisTaskSkeleton } from "@/components/crisis-v2/crisis-skeletons";
import { useLocale } from "@/components/i18n/locale-provider";
import { crisisV2Ui } from "@/lib/i18n/crisis-v2-ui";
import type { ChecklistTaskStatus } from "@prisma/client";

type Task = {
  id: string;
  label: string;
  description: string;
  deadline: string | null;
  status: ChecklistTaskStatus;
  externalLink: string | null;
};

function statusLabel(status: ChecklistTaskStatus, ui: ReturnType<typeof crisisV2Ui>) {
  if (status === "DONE") return ui.dashboard.statusDone;
  if (status === "IN_PROGRESS") return ui.dashboard.statusInProgress;
  return ui.dashboard.statusNotStarted;
}

export function TaskDetailClient({ initialTask }: { initialTask?: Task | null }) {
  const params = useParams<{ id: string }>();
  const { locale } = useLocale();
  const ui = crisisV2Ui(locale);
  const [task, setTask] = useState<Task | null>(initialTask ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(initialTask === undefined);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (initialTask !== undefined) {
      setLoading(false);
      return;
    }
    void fetch(`/api/v2/tasks/${params.id}`)
      .then(async (response) => {
        const data = (await response.json()) as { task?: Task; error?: string };
        if (!response.ok) {
          setError(data.error || "Task not found.");
          return;
        }
        setTask(data.task || null);
      })
      .catch(() => setError("Could not load task."))
      .finally(() => setLoading(false));
  }, [params.id, initialTask]);

  async function setStatus(status: ChecklistTaskStatus) {
    if (!task) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/v2/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        setError("Could not update task.");
        return;
      }
      setTask({ ...task, status });
    } finally {
      setPending(false);
    }
  }

  if (loading) return <CrisisTaskSkeleton />;

  if (error && !task) {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
          <p className="text-sm text-red-700">{error}</p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/dashboard">{ui.task.back}</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (!task) return <CrisisTaskSkeleton />;

  const href = task.externalLink?.startsWith("http") ? task.externalLink : task.externalLink || "#";

  return (
    <section className="mx-auto max-w-3xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 transition hover:text-brand-amber"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {ui.task.back}
      </Link>

      <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <p className="section-label">{statusLabel(task.status, ui)}</p>
        <h1 className="mt-2 font-brand text-2xl font-semibold text-ink">{task.label}</h1>
        <p className="mt-3 text-sm leading-7 text-ink/75">{task.description}</p>
        {task.deadline ? (
          <p className="mt-3 text-sm text-ink/60">
            {ui.task.deadline}: {new Date(task.deadline).toLocaleDateString(locale === "en" ? "en-GB" : "nl-NL")}
          </p>
        ) : null}
        <p className="mt-5 text-xs leading-5 text-ink/55">{ui.digidHonesty}</p>

        <div className="mt-7 flex flex-wrap gap-2 border-t border-stone-100 pt-6">
          {task.externalLink ? (
            <Button asChild>
              <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                {ui.task.openOfficial}
              </a>
            </Button>
          ) : null}
          <Button variant="outline" disabled={pending} onClick={() => void setStatus("IN_PROGRESS")}>
            {ui.task.markInProgress}
          </Button>
          <Button variant="outline" disabled={pending} onClick={() => void setStatus("DONE")}>
            {ui.task.markDone}
          </Button>
        </div>
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}
