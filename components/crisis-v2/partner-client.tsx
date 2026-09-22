"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { crisisV2Ui } from "@/lib/i18n/crisis-v2-ui";

export type PartnerReferral = {
  id: string;
  feeStatus: string;
  referredAt: string;
  providerName: string;
  caseId: string;
  path: string | null;
};

export function PartnerClient({
  initialReferrals
}: {
  initialReferrals?: PartnerReferral[];
}) {
  const { locale } = useLocale();
  const ui = crisisV2Ui(locale);
  const [referrals, setReferrals] = useState<PartnerReferral[]>(initialReferrals ?? []);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(initialReferrals === undefined);

  async function load() {
    const response = await fetch("/api/v2/partner/referrals");
    const data = (await response.json()) as { referrals?: PartnerReferral[]; error?: string };
    if (!response.ok) {
      setError(data.error || "Could not load referrals.");
      return;
    }
    setError("");
    setReferrals(data.referrals || []);
  }

  useEffect(() => {
    if (initialReferrals !== undefined) {
      setLoading(false);
      return;
    }
    void load().finally(() => setLoading(false));
  }, [initialReferrals]);

  async function confirm(referralId: string) {
    const response = await fetch("/api/v2/partner/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralId })
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Confirm failed.");
      return;
    }
    setMessage("Placement confirmed.");
    void load();
  }

  return (
    <div className="grid gap-5">
      <header className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <p className="section-label">{ui.partner.title}</p>
        <h1 className="mt-2 font-brand text-2xl font-semibold text-ink">{ui.partner.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">{ui.partner.intro}</p>
        <p className="mt-3 text-xs leading-5 text-ink/55">{ui.facilityPayDisclosure}</p>
      </header>

      {loading ? <p className="text-sm text-ink/60">Loading…</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-brand-green-dark">{message}</p> : null}

      {!loading && !error && referrals.length === 0 ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-6">
          <p className="text-sm text-ink/60">{ui.partner.empty}</p>
        </div>
      ) : null}

      {!loading && !error && referrals.length > 0 ? (
        <section className="rounded-2xl bg-white shadow-soft">
          <ul className="divide-y divide-stone-100">
            {referrals.map((referral) => (
              <li key={referral.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{referral.providerName}</p>
                  <p className="mt-0.5 text-xs text-ink/55">
                    {referral.feeStatus} · {new Date(referral.referredAt).toLocaleString()}
                  </p>
                </div>
                <Button size="sm" onClick={() => void confirm(referral.id)}>
                  {ui.partner.confirm}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
