"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlidePanel } from "@/components/ui/slide-panel";
import { recordAction } from "@/lib/client/actions";
import { WAITLIST_LAUNCH_CONFIRM_PHRASE } from "@/lib/email/waitlist-launch-constants";

type AnnouncementPreview = {
  familyCount: number;
  facilityCount: number;
  totalCount: number;
  skippedContacted: number;
  skippedConverted: number;
  skippedClosed: number;
  audience: "new" | "active";
};

const DEFAULT_MESSAGE =
  "We wanted to share a quick update from Shepherds Oud. {{contactName}}, thank you for staying in touch with us — we appreciate your patience and support.";

type WaitlistBulkEmailBarProps = {
  onNotify: (message: string) => void;
};

export function WaitlistBulkEmailBar({ onNotify }: WaitlistBulkEmailBarProps) {
  const [open, setOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [subject, setSubject] = useState("A note from Shepherds Oud");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [audience, setAudience] = useState<"new" | "active">("new");
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
        const response = await fetch(`/api/admin/waitlist/bulk-launch-email?audience=${audience}`);
        if (!response.ok) {
          throw new Error("Could not load waitlist email preview.");
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
      const response = await fetch("/api/admin/waitlist/bulk-launch-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmPhrase: WAITLIST_LAUNCH_CONFIRM_PHRASE,
          subject,
          message,
          audience,
          markNewAsContacted
        })
      });

      const payload = (await response.json()) as { error?: string; totalCount?: number; familyCount?: number; facilityCount?: number };

      if (!response.ok) {
        throw new Error(payload.error || "Could not queue announcement emails.");
      }

      onNotify(
        `Announcement queued for ${payload.totalCount ?? 0} recipients (${payload.familyCount ?? 0} families, ${payload.facilityCount ?? 0} facilities).`
      );

      try {
        await recordAction({
          type: "waitlist_announcement_bulk",
          targetType: "waitlist",
          targetId: "bulk-announcement",
          label: `Queued waitlist announcement for ${payload.totalCount ?? 0} recipients.`,
          payload: {
            totalCount: payload.totalCount,
            familyCount: payload.familyCount,
            facilityCount: payload.facilityCount,
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-green-pale/60 bg-white px-4 py-4 shadow-soft sm:px-5">
        <div>
          <p className="text-sm font-semibold text-brand-green-dark">Waitlist announcements</p>
          <p className="mt-1 text-sm text-ink/70">
            Send your own update — offers, news, festive greetings, or platform news — using the same responsive Shepherds Oud email design.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          <Megaphone className="h-4 w-4" />
          Compose announcement
        </Button>
      </div>

      <SlidePanel
        open={open}
        onClose={() => {
          if (!sending) setOpen(false);
        }}
        size="wide"
        title="Compose waitlist announcement"
        subtitle="Use {{contactName}} and {{facilityName}} — they are filled in automatically per recipient."
      >
        <div className="space-y-5">
          <label className="grid gap-2 text-sm font-medium text-ink">
            Audience
            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value as "new" | "active")}
              className="rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-normal outline-brand-amber"
              disabled={sending}
            >
              <option value="new">New waitlist only (not yet contacted)</option>
              <option value="active">Active waitlist (new + contacted)</option>
            </select>
          </label>

          {loadingPreview ? (
            <p className="text-sm text-ink/60">Loading recipient counts...</p>
          ) : preview ? (
            <div className="rounded-lg border border-stone-200 bg-brand-cream/60 px-3 py-2 text-sm text-ink/80">
              <p>
                <span className="font-semibold text-ink">{preview.familyCount}</span> families ·{" "}
                <span className="font-semibold text-ink">{preview.facilityCount}</span> facilities ·{" "}
                <span className="font-semibold text-ink">{preview.totalCount}</span> total emails
              </p>
              {preview.skippedConverted || preview.skippedClosed ? (
                <p className="mt-1 text-xs text-ink/60">
                  Skipping {preview.skippedConverted} converted and {preview.skippedClosed} closed entries.
                </p>
              ) : null}
            </div>
          ) : null}

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
            />
          </label>

          <p className="rounded-lg border border-stone-200 bg-white px-3 py-3 text-xs leading-5 text-neutral-600">
            Fixed opening: <strong>Hello {"{{contactName}}"}</strong>. Your message follows in the branded template with a sign-in link for families or facilities.
          </p>

          <label className="flex items-start gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              className="mt-1"
              checked={markNewAsContacted}
              onChange={(event) => setMarkNewAsContacted(event.target.checked)}
              disabled={sending || audience !== "new"}
            />
            <span>Mark new waitlist entries as contacted after sending (optional — use for first outreach only).</span>
          </label>

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
