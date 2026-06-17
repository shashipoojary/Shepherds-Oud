"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { clearStoredIntake } from "@/lib/client-intake";
import { clearSavedProviders } from "@/lib/client-favourites";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AdminResetDataButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function handleReset() {
    if (confirmText.trim().toUpperCase() !== "RESET") return;

    setPending(true);

    try {
      const response = await fetch("/api/admin/reset-data", { method: "POST" });
      const data = (await response.json()) as { error?: string; deleted?: Record<string, number> };

      if (!response.ok) {
        throw new Error(data.error || "Reset failed.");
      }

      clearStoredIntake();
      clearSavedProviders();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reset data.";
      console.error(message);
    } finally {
      setPending(false);
      setConfirmOpen(false);
      setConfirmText("");
    }
  }

  return (
    <div className="hidden lg:block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
        className="border-brand-amber/40 text-brand-amber-dark hover:bg-brand-amber/10"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Wiping data...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            Reset test data
          </>
        )}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        pending={pending}
        confirmDisabled={confirmText.trim().toUpperCase() !== "RESET"}
        tone="danger"
        title="Reset all test data?"
        description="This permanently deletes intakes, matches, providers, waitlist sign-ups, and activity logs. Admin logins are kept."
        confirmLabel="Reset data"
        cancelLabel="Cancel"
        onCancel={() => {
          if (pending) return;
          setConfirmOpen(false);
          setConfirmText("");
        }}
        onConfirm={() => void handleReset()}
      >
        <label className="block text-sm text-ink/75">
          Type <span className="font-semibold text-ink">RESET</span> to enable the reset button:
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            disabled={pending}
            className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-brand-amber"
          />
        </label>
      </ConfirmDialog>
    </div>
  );
}
