export type MatchRequestStatus = "VISIT_REQUESTED" | "CALLBACK_REQUESTED";

export async function requestMatchAction(params: {
  matchId: string;
  intakeId: string;
  status: MatchRequestStatus;
  startsAt?: string;
  endsAt?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (params.startsAt && params.endsAt) {
      const response = await fetch(`/api/matches/${params.matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "propose",
          status: params.status,
          intakeId: params.intakeId,
          startsAt: params.startsAt,
          endsAt: params.endsAt
        })
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        return { ok: false, error: data.error || "Request failed" };
      }
      return { ok: true };
    }

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

/** Family passes on a suggested match (status → CLOSED). */
export async function passOnMatch(params: {
  matchId: string;
  intakeId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(`/api/matches/${params.matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED", intakeId: params.intakeId })
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error || "Could not update this match." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection." };
  }
}

export async function fetchMatchSlots(matchId: string, kind: "VISIT" | "CALLBACK") {
  const response = await fetch(`/api/matches/${matchId}/slots?kind=${kind}`);
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Could not load available times.");
  }
  return (await response.json()) as {
    calendarConnected: boolean;
    mode: "CALENDAR" | "MOCK" | "UNAVAILABLE";
    timezone: string;
    slots: Array<{ start: string; end: string }>;
    providerName: string;
  };
}

export async function postMatchSchedule(
  matchId: string,
  body: Record<string, unknown>
): Promise<{ ok: true; match?: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const response = await fetch(`/api/matches/${matchId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error || "Scheduling action failed" };
    }
    const match = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    return { ok: true, match: match ?? undefined };
  } catch {
    return { ok: false, error: "Could not reach the server." };
  }
}
