"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { panelNoticeTone, SlidePanel, StatusPill } from "@/components/ui/slide-panel";

type HospitalInvitePanelProps = {
  onNotify: (message: string) => void;
};

const inputClass =
  "w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal text-ink outline-none transition focus:border-brand-amber";

export function HospitalInvitePanel({ onNotify }: HospitalInvitePanelProps) {
  const [open, setOpen] = useState(false);
  const [hospitalName, setHospitalName] = useState("");
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [pending, setPending] = useState(false);
  const [panelMessage, setPanelMessage] = useState("");

  function closePanel() {
    setOpen(false);
    setPanelMessage("");
  }

  function resetForm() {
    setHospitalName("");
    setEmail("");
    setContactName("");
    setPanelMessage("");
  }

  async function sendInvite(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setPanelMessage("");
    try {
      const response = await fetch("/api/admin/hospital-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalName: hospitalName.trim(),
          email: email.trim(),
          contactName: contactName.trim() || undefined
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Could not send hospital invite.");
      }

      const result = (await response.json()) as { hospitalName?: string; email?: string };
      const success = `Hospital invite sent to ${result.email || email} for ${result.hospitalName || hospitalName}.`;
      onNotify(success);
      resetForm();
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send hospital invite.";
      setPanelMessage(message);
      onNotify(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="bg-white"
        onClick={() => setOpen(true)}
        aria-label="Invite hospital"
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="sm:hidden">Hospital</span>
        <span className="hidden sm:inline">Invite hospital</span>
      </Button>

      <SlidePanel
        open={open}
        onClose={closePanel}
        title="Invite hospital"
        subtitle="Staff get an email to sign in and submit family referrals."
        notice={panelMessage}
        noticeTone={panelNoticeTone(panelMessage)}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={closePanel} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" form="hospital-invite-form" size="sm" disabled={pending}>
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </div>
        }
      >
        <form id="hospital-invite-form" className="grid gap-4" onSubmit={(event) => void sendInvite(event)}>
          <p className="text-sm leading-6 text-neutral-600">
            Create or reuse a hospital organization, then send a one-time invite link to a staff email.
          </p>

          <label className="grid gap-1.5 text-sm font-medium text-ink">
            Hospital name
            <input
              className={inputClass}
              value={hospitalName}
              onChange={(event) => setHospitalName(event.target.value)}
              required
              minLength={2}
              placeholder="e.g. Amsterdam UMC"
              autoComplete="organization"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-ink">
            Staff invite email
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="name@hospital.nl"
              autoComplete="email"
            />
            <span className="text-xs font-normal text-neutral-500">
              They must sign in with this same email to open the hospital dashboard.
            </span>
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-ink">
            Contact name <span className="font-normal text-neutral-500">(optional)</span>
            <input
              className={inputClass}
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              placeholder="Used in the invite greeting"
              autoComplete="name"
            />
          </label>

          <StatusPill>
            After they accept, referrals appear under Families with a Hospital badge. The family can sign in with the
            referral email to track the case.
          </StatusPill>
        </form>
      </SlidePanel>
    </>
  );
}
