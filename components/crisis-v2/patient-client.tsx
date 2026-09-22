"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { crisisV2Ui } from "@/lib/i18n/crisis-v2-ui";
import { cn } from "@/lib/core/utils";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[var(--card-border)] bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-amber";

export function PatientClient({ initialCaseId }: { initialCaseId?: string | null }) {
  const { locale } = useLocale();
  const ui = crisisV2Ui(locale);
  const router = useRouter();
  const [caseId, setCaseId] = useState(initialCaseId || "");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [mobilityStatus, setMobilityStatus] = useState("");
  const [cognitiveStatus, setCognitiveStatus] = useState("");
  const [authority, setAuthority] = useState<"SELF_ATTESTED" | "LEGAL_REPRESENTATIVE_ON_FILE">("SELF_ATTESTED");
  const [legalName, setLegalName] = useState("");
  const [invitePatient, setInvitePatient] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialCaseId !== undefined) {
      if (initialCaseId) setCaseId(initialCaseId);
      else setError("Could not load your case.");
      return;
    }
    void fetch("/api/v2/cases")
      .then((response) => response.json())
      .then((data: { cases?: Array<{ membershipRole: string; case: { id: string } }> }) => {
        const familyCase = data.cases?.find((item) => item.membershipRole === "FAMILY");
        if (familyCase) setCaseId(familyCase.case.id);
        else setError("Could not load your case.");
      })
      .catch(() => setError("Could not load your case."));
  }, [initialCaseId]);

  async function save() {
    if (!caseId || !name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/v2/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          name,
          relationship,
          mobilityStatus,
          cognitiveStatus,
          authorityType: authority,
          legalRepresentativeName: legalName || undefined,
          invitePatient
        })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Save failed");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <h1 className="font-brand text-2xl font-semibold text-ink">{ui.patient.title}</h1>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm text-ink/80">
            Name
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm text-ink/80">
            Relationship
            <input className={inputClass} value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm text-ink/80 sm:col-span-2">
            Mobility (plain language)
            <input
              className={inputClass}
              value={mobilityStatus}
              onChange={(e) => setMobilityStatus(e.target.value)}
              placeholder="e.g. walks with aid"
            />
          </label>
          <label className="grid gap-1.5 text-sm text-ink/80 sm:col-span-2">
            Memory / cognition (plain categories)
            <input
              className={inputClass}
              value={cognitiveStatus}
              onChange={(e) => setCognitiveStatus(e.target.value)}
              placeholder="e.g. occasional confusion"
            />
          </label>
        </div>

        <div className="mt-6 divide-y divide-stone-100 overflow-hidden rounded-xl bg-brand-cream/40">
          <button
            type="button"
            className={cn(
              "w-full px-4 py-3.5 text-left text-sm transition",
              authority === "SELF_ATTESTED" ? "bg-brand-amber/10 text-ink" : "hover:bg-brand-cream/70"
            )}
            onClick={() => setAuthority("SELF_ATTESTED")}
          >
            {ui.patient.selfAttest}
          </button>
          <button
            type="button"
            className={cn(
              "w-full px-4 py-3.5 text-left text-sm transition",
              authority === "LEGAL_REPRESENTATIVE_ON_FILE" ? "bg-brand-amber/10 text-ink" : "hover:bg-brand-cream/70"
            )}
            onClick={() => setAuthority("LEGAL_REPRESENTATIVE_ON_FILE")}
          >
            {ui.patient.legalRep}
          </button>
        </div>

        {authority === "LEGAL_REPRESENTATIVE_ON_FILE" ? (
          <label className="mt-5 grid gap-1.5 text-sm text-ink/80">
            Legal representative name
            <input className={inputClass} value={legalName} onChange={(e) => setLegalName(e.target.value)} />
          </label>
        ) : null}

        <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink/85">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--card-border)] text-brand-amber focus:ring-brand-amber"
            checked={invitePatient}
            onChange={(e) => setInvitePatient(e.target.checked)}
          />
          {ui.patient.inviteLater}
        </label>

        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-7 border-t border-stone-100 pt-6">
          <Button disabled={saving || !caseId} onClick={() => void save()}>
            {ui.patient.save}
          </Button>
        </div>
      </div>
    </section>
  );
}
