"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { clearStoredIntake } from "@/lib/client-intake";
import { clearSavedProviders } from "@/lib/client-favourites";
import { Button } from "@/components/ui/button";

export function AdminResetDataButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleReset() {
    const confirmed = window.confirm(
      "This will permanently delete all intakes, matches, providers, waitlist sign-ups, and activity logs.\n\nAdmin logins are kept. This cannot be undone."
    );
    if (!confirmed) return;

    const typed = window.prompt('Type RESET to confirm wiping all test data.');
    if (typed !== "RESET") return;

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
      window.alert("All test data wiped. The dashboard is now empty.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reset data.";
      window.alert(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="hidden lg:block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => void handleReset()}
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
    </div>
  );
}
