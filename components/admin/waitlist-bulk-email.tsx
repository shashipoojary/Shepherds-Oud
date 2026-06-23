"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { recordAction } from "@/lib/client/actions";
import { WAITLIST_LAUNCH_CONFIRM_PHRASE } from "@/lib/email/waitlist-launch-constants";

type LaunchPreview = {
  familyCount: number;
  facilityCount: number;
  totalCount: number;
  skippedConverted: number;
  skippedClosed: number;
};

type WaitlistBulkEmailBarProps = {
  onNotify: (message: string) => void;
};

export function WaitlistBulkEmailBar({ onNotify }: WaitlistBulkEmailBarProps) {
  const [open, setOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [preview, setPreview] = useState<LaunchPreview | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmPhrase("");
      return;
    }

    let cancelled = false;
    setLoadingPreview(true);

    void (async () => {
      try {
        const response = await fetch("/api/admin/waitlist/bulk-launch-email");
        if (!response.ok) {
          throw new Error("Could not load waitlist email preview.");
        }
        const data = (await response.json()) as LaunchPreview;
        if (!cancelled) {
          setPreview(data);
        }
      } catch {
        if (!cancelled) {
          setPreview(null);
          onNotify("Could not load launch email preview.");
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
  }, [open, onNotify]);

  async function sendLaunchEmails() {
    setSending(true);
    try {
      const response = await fetch("/api/admin/waitlist/bulk-launch-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPhrase: WAITLIST_LAUNCH_CONFIRM_PHRASE })
      });

      const payload = (await response.json()) as { error?: string; totalCount?: number; familyCount?: number; facilityCount?: number };

      if (!response.ok) {
        throw new Error(payload.error || "Could not queue launch emails.");
      }

      onNotify(
        `Launch emails queued for ${payload.totalCount ?? 0} recipients (${payload.familyCount ?? 0} families, ${payload.facilityCount ?? 0} facilities). Sending continues in the background.`
      );

      try {
        await recordAction({
          type: "waitlist_launch_bulk",
          targetType: "waitlist",
          targetId: "bulk-launch",
          label: `Queued launch emails for ${payload.totalCount ?? 0} waitlist recipients.`,
          payload: {
            totalCount: payload.totalCount,
            familyCount: payload.familyCount,
            facilityCount: payload.facilityCount
          }
        });
      } catch {
        // Optional audit log.
      }

      setOpen(false);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "Could not queue launch emails.");
    } finally {
      setSending(false);
    }
  }

  const canConfirm = confirmPhrase.trim() === WAITLIST_LAUNCH_CONFIRM_PHRASE && Boolean(preview?.totalCount);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-green-pale/60 bg-white px-4 py-4 shadow-soft sm:px-5">
        <div>
          <p className="text-sm font-semibold text-brand-green-dark">Platform launch announcement</p>
          <p className="mt-1 text-sm text-ink/70">
            Send a one-time &quot;we are live&quot; email to all eligible waitlist families and facilities. Each group receives its own template. Emails are sent in small queued batches — not all at once.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          <Megaphone className="h-4 w-4" />
          Send launch emails
        </Button>
      </div>

      <ConfirmDialog
        open={open}
        title="Send launch announcement to the waitlist?"
        description="This will email every eligible waitlist family and facility that is still NEW or CONTACTED. Converted and closed entries are skipped. This action cannot be undone."
        confirmLabel="Queue launch emails"
        tone="danger"
        pending={sending}
        confirmDisabled={!canConfirm || loadingPreview}
        onCancel={() => {
          if (!sending) setOpen(false);
        }}
        onConfirm={() => void sendLaunchEmails()}
      >
        {loadingPreview ? (
          <p className="text-sm text-ink/60">Loading recipient counts...</p>
        ) : preview ? (
          <div className="grid gap-3 text-sm text-ink/80">
            <div className="rounded-lg border border-stone-200 bg-brand-cream/60 px-3 py-2">
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
            <p className="text-xs leading-5 text-ink/60">
              Families are invited to start guided intake. Facilities are invited to sign in and list services. Messages are queued in batches of 5 with a short pause between batches.
            </p>
            <label className="grid gap-2 text-sm font-medium text-ink">
              Type {WAITLIST_LAUNCH_CONFIRM_PHRASE} to confirm
              <input
                type="text"
                value={confirmPhrase}
                onChange={(event) => setConfirmPhrase(event.target.value)}
                placeholder={WAITLIST_LAUNCH_CONFIRM_PHRASE}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-normal outline-brand-amber"
                autoComplete="off"
                disabled={sending}
              />
            </label>
          </div>
        ) : (
          <p className="text-sm text-ink/60">No preview available.</p>
        )}
      </ConfirmDialog>
    </>
  );
}
