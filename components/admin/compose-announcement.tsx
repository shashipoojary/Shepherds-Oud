"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlidePanel } from "@/components/ui/slide-panel";
import { recordAction } from "@/lib/client/actions";
import { brand } from "@/lib/config/brand";
import {
  ANNOUNCEMENT_CONTACT_TOKEN,
  ANNOUNCEMENT_FACILITY_TOKEN,
  type AnnouncementAudience
} from "@/lib/email/announcement-types";
import { WAITLIST_LAUNCH_CONFIRM_PHRASE } from "@/lib/email/waitlist-launch-constants";

type AnnouncementPreview = {
  audience: AnnouncementAudience;
  totalCount: number;
  familyCount: number;
  facilityCount: number;
  providerCount: number;
  skippedContacted: number;
  skippedConverted: number;
  skippedClosed: number;
};

const DEFAULT_MESSAGE =
  `We wanted to share a quick update from ${brand.name}. Thank you for staying in touch with us — we appreciate your patience and support.`;

type ComposeAnnouncementBarProps = {
  onNotify: (message: string) => void;
};

const AUDIENCE_OPTIONS: Array<{ value: AnnouncementAudience; label: string }> = [
  { value: "waitlist_new", label: "Waitlist — new only (not yet contacted)" },
  { value: "waitlist_active", label: "Waitlist — active (new + contacted)" },
  { value: "families", label: "All families (open intakes)" },
  { value: "providers", label: "All care providers" }
];

export function ComposeAnnouncementBar({ onNotify }: ComposeAnnouncementBarProps) {
  const [open, setOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [subject, setSubject] = useState(`A note from ${brand.name}`);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [audience, setAudience] = useState<AnnouncementAudience>("waitlist_new");
  const [markNewAsContacted, setMarkNewAsContacted] = useState(false);
  const [preview, setPreview] = useState<AnnouncementPreview | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmPhrase("");
      return;
    }

    let cancelled = false;
    setLoadingPreview(true);

    void (async () => {
      try {
        const response = await fetch(`/api/admin/announcements?audience=${audience}`);
        if (!response.ok) {
          throw new Error("Could not load announcement preview.");
        }
        const data = (await response.json()) as AnnouncementPreview;
        if (!cancelled) {
          setPreview(data);
        }
      } catch {
        if (!cancelled) {
          setPreview(null);
          onNotify("Could not load announcement preview.");
          setOpen(false);
        }
      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, audience, onNotify]);

  async function sendAnnouncement() {
    setSending(true);
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmPhrase: WAITLIST_LAUNCH_CONFIRM_PHRASE,
          subject,
          message,
          audience,
          markNewAsContacted: audience === "waitlist_new" ? markNewAsContacted : false
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        totalCount?: number;
        familyCount?: number;
        facilityCount?: number;
        providerCount?: number;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Could not queue announcement emails.");
      }

      onNotify(
        `Announcement queued for ${payload.totalCount ?? 0} recipients (${payload.familyCount ?? 0} families, ${payload.facilityCount ?? 0} waitlist facilities, ${payload.providerCount ?? 0} providers).`
      );

      try {
        await recordAction({
          type: "admin_announcement_bulk",
          targetType: "announcement",
          targetId: audience,
          label: `Queued announcement for ${payload.totalCount ?? 0} recipients (${audience}).`,
          payload: {
            totalCount: payload.totalCount,
            familyCount: payload.familyCount,
            facilityCount: payload.facilityCount,
            providerCount: payload.providerCount,
            audience,
            subject
          }
        });
      } catch {
        // Optional audit log.
      }

      setOpen(false);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Could not queue announcement emails.");
    } finally {
      setSending(false);
    }
  }

  const canConfirm =
    confirmPhrase.trim() === WAITLIST_LAUNCH_CONFIRM_PHRASE &&
    Boolean(preview?.totalCount) &&
    subject.trim().length >= 3 &&
    message.trim().length >= 12;

  const showFacilityToken = audience === "waitlist_new" || audience === "waitlist_active" || audience === "providers";

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="bg-white"
        onClick={() => setOpen(true)}
        aria-label="Compose announcement"
      >
        <Megaphone className="h-4 w-4 shrink-0" />
        Announce
      </Button>

      <SlidePanel
        open={open}
        onClose={() => {
          if (!sending) setOpen(false);
        }}
        size="wide"
        title="Compose announcement"
        subtitle="Personalization fields are fixed and filled from each recipient’s profile."
      >
        <div className="space-y-5">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Audience
            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value as AnnouncementAudience)}
              className="rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal outline-brand-amber"
              disabled={sending}
            >
              {AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {loadingPreview ? (
            <p className="text-sm text-ink/60">Loading recipient counts...</p>
          ) : preview ? (
            <div className="rounded-lg border border-stone-200 bg-brand-cream/60 px-3 py-2 text-sm text-ink/80">
              <p>
                <span className="font-semibold text-ink">{preview.totalCount}</span> total emails
                {preview.familyCount ? (
                  <>
                    {" "}
                    · <span className="font-semibold text-ink">{preview.familyCount}</span> families
                  </>
                ) : null}
                {preview.facilityCount ? (
                  <>
                    {" "}
                    · <span className="font-semibold text-ink">{preview.facilityCount}</span> waitlist facilities
                  </>
                ) : null}
                {preview.providerCount ? (
                  <>
                    {" "}
                    · <span className="font-semibold text-ink">{preview.providerCount}</span> providers
                  </>
                ) : null}
              </p>
              {preview.skippedConverted || preview.skippedClosed ? (
                <p className="mt-1 text-xs text-ink/60">
                  Skipping {preview.skippedConverted} converted and {preview.skippedClosed} closed waitlist entries.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-lg border border-stone-200 bg-white px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Auto-filled (not editable)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-md border border-brand-amber/30 bg-brand-amber/10 px-2.5 py-1 font-mono text-xs font-semibold text-brand-amber-dark">
                {ANNOUNCEMENT_CONTACT_TOKEN}
              </span>
              {showFacilityToken ? (
                <span className="inline-flex items-center rounded-md border border-brand-amber/30 bg-brand-amber/10 px-2.5 py-1 font-mono text-xs font-semibold text-brand-amber-dark">
                  {ANNOUNCEMENT_FACILITY_TOKEN}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-neutral-600">
              Each email opens with a personalized greeting using the recipient’s name
              {showFacilityToken ? " (and facility name for providers / waitlist facilities)" : ""}. Do not type these tokens in
              your message — they are applied automatically from the profile.
            </p>
          </div>

          <label className="grid gap-2 text-sm font-medium text-ink">
            Email subject
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal outline-brand-amber"
              disabled={sending}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-ink">
            Your message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="min-h-40 rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal leading-6 outline-brand-amber"
              disabled={sending}
              placeholder="Write your update or greeting here…"
            />
          </label>

          {audience === "waitlist_new" ? (
            <label className="flex items-start gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                className="mt-1"
                checked={markNewAsContacted}
                onChange={(event) => setMarkNewAsContacted(event.target.checked)}
                disabled={sending}
              />
              <span>Mark new waitlist entries as contacted after sending (optional — use for first outreach only).</span>
            </label>
          ) : null}

          <label className="grid gap-2 text-sm font-medium text-ink">
            Type {WAITLIST_LAUNCH_CONFIRM_PHRASE} to confirm
            <input
              type="text"
              value={confirmPhrase}
              onChange={(event) => setConfirmPhrase(event.target.value)}
              placeholder={WAITLIST_LAUNCH_CONFIRM_PHRASE}
              className="rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal outline-brand-amber"
              autoComplete="off"
              disabled={sending}
            />
          </label>

          <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">
            <Button type="button" variant="outline" disabled={sending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!canConfirm || sending} onClick={() => void sendAnnouncement()}>
              {sending ? "Queueing..." : "Send announcement"}
            </Button>
          </div>
        </div>
      </SlidePanel>
    </>
  );
}

/** @deprecated Prefer ComposeAnnouncementBar */
export const WaitlistBulkEmailBar = ComposeAnnouncementBar;
