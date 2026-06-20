export type MatchRequestStatus = "VISIT_REQUESTED" | "CALLBACK_REQUESTED";

export async function requestMatchAction(params: {
  matchId: string;
  intakeId: string;
  status: MatchRequestStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(`/api/matches/${params.matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: params.status, intakeId: params.intakeId })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error || "Request failed" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection." };
  }
}
