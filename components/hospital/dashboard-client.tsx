"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CustomSelect } from "@/components/ui/custom-select";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { RefreshButton } from "@/components/ui/refresh-button";
import { useLocale } from "@/components/i18n/locale-provider";
import { careTypeOptions } from "@/lib/config/content";
import { INTAKE_AGE_RANGE_OPTIONS } from "@/lib/domain/intake-field-utils";
import { optionLabel } from "@/lib/i18n/ui";
import { cn } from "@/lib/core/utils";
import { formatReference } from "@/lib/domain/reference";
import { intakeStatusLabel } from "@/lib/domain/intake-workflow";

type Referral = {
  id: string;
  contactName: string;
  email: string;
  phone: string;
  preferredArea: string;
  urgency: string;
  careTypes: string[];
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type DashboardData = {
  hospital: { id: string; name: string };
  referrals: Referral[];
};

const urgencyOptions = ["Within 2 weeks", "Within 1 month", "1-3 months", "Flexible / exploring", "Urgent"];

const inputClass =
  "w-full rounded-lg border border-[var(--card-border)] px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-amber";

export function HospitalDashboardClient() {
  const { locale } = useLocale();
  const en = locale === "en";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [form, setForm] = useState({
    contactName: "",
    email: "",
    phone: "",
    preferredArea: "",
    urgency: urgencyOptions[1],
    ageRange: "",
    careTypes: [] as string[],
    notes: "",
    consentAccepted: false
  });

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/hospital/referrals");
      if (!response.ok) {
        throw new Error(en ? "Could not load referrals." : "Verwijzingen laden mislukt.");
      }
      const payload = (await response.json()) as DashboardData;
      setData(payload);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : en ? "Load failed." : "Laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submitReferral(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/hospital/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          preferredArea: form.preferredArea.trim(),
          urgency: form.urgency,
          ageRange: form.ageRange || undefined,
          careTypes: form.careTypes,
          notes: form.notes.trim() || undefined,
          consentAccepted: form.consentAccepted ? true : undefined
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || (en ? "Could not submit referral." : "Verwijzing indienen mislukt."));
      }

      setForm({
        contactName: "",
        email: "",
        phone: "",
        preferredArea: "",
        urgency: urgencyOptions[1],
        ageRange: "",
        careTypes: [],
        notes: "",
        consentAccepted: false
      });
      setMessageTone("success");
      setMessage(
        en
          ? "Referral submitted. The family gets an email to sign in and track the case; a Care Guide will follow up."
          : "Verwijzing ingediend. De familie ontvangt een e-mail om in te loggen en de zaak te volgen; een Care Guide volgt op."
      );
      await load();
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : en ? "Submit failed." : "Indienen mislukt.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return <DashboardSkeleton title="hospital dashboard" />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-label">{en ? "Hospital dashboard" : "Ziekenhuisdashboard"}</p>
          <h1 className="mt-1 text-h2 font-semibold text-ink">
            {data?.hospital.name || (en ? "Referrals" : "Verwijzingen")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink/65">
            {en
              ? "Submit a family referral. The family can sign in with the contact email to track progress; Care Guides work the case in admin."
              : "Dien een familie-verwijzing in. De familie kan inloggen met het contact-e-mailadres om voortgang te volgen; Care Guides werken de zaak af in admin."}
          </p>
        </div>
        <RefreshButton onClick={() => void load()} loading={loading} />
      </header>

      {message ? (
        <div
          className={cn(
            "mb-4 rounded-lg px-4 py-3 text-sm",
            messageTone === "success"
              ? "bg-brand-green-pale/30 text-brand-green-dark"
              : "bg-brand-beige-light/50 text-brand-amber-dark"
          )}
          role="status"
        >
          {message}
        </div>
      ) : null}

      <section className="mb-5 rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-soft sm:px-5">
        <h2 className="text-lg font-semibold text-ink">{en ? "New referral" : "Nieuwe verwijzing"}</h2>
        <form className="mt-4 grid gap-4" onSubmit={(event) => void submitReferral(event)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-ink">
              {en ? "Family contact name" : "Naam familiecontact"}
              <input
                className={inputClass}
                value={form.contactName}
                onChange={(e) => setForm((c) => ({ ...c, contactName: e.target.value }))}
                required
                minLength={2}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              {en ? "Email" : "E-mail"}
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                required
              />
              <span className="text-xs font-normal text-ink/55">
                {en
                  ? "Family uses this email to sign in and see the case."
                  : "De familie gebruikt dit e-mailadres om in te loggen en de zaak te zien."}
              </span>
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              {en ? "Phone" : "Telefoon"}
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                required
                minLength={6}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              {en ? "Preferred area" : "Gewenst gebied"}
              <input
                className={inputClass}
                value={form.preferredArea}
                onChange={(e) => setForm((c) => ({ ...c, preferredArea: e.target.value }))}
                required
                minLength={2}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              {en ? "Urgency" : "Urgentie"}
              <CustomSelect
                value={form.urgency}
                onChange={(value) => setForm((c) => ({ ...c, urgency: value }))}
                options={urgencyOptions}
                formatOption={(value) => optionLabel(locale, value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-ink">
              {en ? "Age range (optional)" : "Leeftijdscategorie (optioneel)"}
              <CustomSelect
                value={form.ageRange || INTAKE_AGE_RANGE_OPTIONS[3]}
                onChange={(value) => setForm((c) => ({ ...c, ageRange: value }))}
                options={[...INTAKE_AGE_RANGE_OPTIONS]}
                formatOption={(value) => optionLabel(locale, value)}
              />
            </label>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-ink">{en ? "Care needed" : "Benodigde zorg"}</span>
            <div className="flex flex-wrap gap-2">
              {careTypeOptions.map((option) => (
                <Chip
                  key={option}
                  selected={form.careTypes.includes(option)}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      careTypes: current.careTypes.includes(option)
                        ? current.careTypes.filter((item) => item !== option)
                        : [...current.careTypes, option]
                    }))
                  }
                >
                  {optionLabel(locale, option)}
                </Chip>
              ))}
            </div>
          </div>

          <label className="grid gap-2 text-sm font-medium text-ink">
            {en ? "Situation notes (optional)" : "Situatienotities (optioneel)"}
            <textarea
              className={`${inputClass} min-h-24`}
              value={form.notes}
              onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
              maxLength={2000}
            />
          </label>

          <label className="flex items-start gap-3 text-sm text-ink/80">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.consentAccepted}
              onChange={(e) => setForm((c) => ({ ...c, consentAccepted: e.target.checked }))}
            />
            <span>
              {en
                ? "The family (or legal representative) consents to Shepherds Oud processing this referral for care navigation."
                : "De familie (of wettelijke vertegenwoordiger) stemt in met verwerking van deze verwijzing door Shepherds Oud voor zorgnavigatie."}
            </span>
          </label>

          <Button type="submit" disabled={saving || !form.careTypes.length || !form.consentAccepted}>
            {saving
              ? en
                ? "Submitting..."
                : "Indienen..."
              : en
                ? "Submit referral"
                : "Verwijzing indienen"}
          </Button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-soft">
        <div className="border-b border-stone-100 px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold text-ink sm:text-lg">
            {en ? "Submitted referrals" : "Ingediende verwijzingen"}
          </h2>
        </div>
        {!data?.referrals.length ? (
          <EmptyState
            title={en ? "No referrals yet" : "Nog geen verwijzingen"}
            description={en ? "Submitted referrals appear here with Care Guide status." : "Ingediende verwijzingen verschijnen hier met Care Guide-status."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="bg-cream text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">{en ? "Family" : "Familie"}</th>
                  <th className="px-4 py-3">{en ? "Area" : "Gebied"}</th>
                  <th className="px-4 py-3">{en ? "Status" : "Status"}</th>
                  <th className="px-4 py-3">{en ? "Submitted" : "Ingediend"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {data.referrals.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm">
                      <strong className="text-ink">{item.contactName}</strong>
                      <span className="mt-1 block text-xs text-neutral-500">
                        {en ? "Ref" : "Ref"} {formatReference(item.id)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{item.preferredArea}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink">
                      {intakeStatusLabel(item.status, locale)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {new Date(item.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "nl-NL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
