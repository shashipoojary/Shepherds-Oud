import type { ActionInput } from "@/lib/validation/action";

export async function recordAction(action: ActionInput) {
  const response = await fetch("/api/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action)
  });

  if (!response.ok) {
    throw new Error("Action could not be saved");
  }

  return response.json() as Promise<{ id: string; mode: "demo" | "database" }>;
}
