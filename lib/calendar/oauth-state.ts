import { createHmac, timingSafeEqual } from "crypto";
import { resolveCalendarCryptoSecret } from "@/lib/config/secrets";

function stateSecret() {
  return resolveCalendarCryptoSecret();
}

export function signCalendarOAuthState(payload: { providerId: string; userId: string; platform: string }) {
  const body = Buffer.from(JSON.stringify({ ...payload, ts: Date.now() }), "utf8").toString("base64url");
  const sig = createHmac("sha256", stateSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyCalendarOAuthState(state: string) {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", stateSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      providerId: string;
      userId: string;
      platform: string;
      ts: number;
    };
    if (Date.now() - parsed.ts > 30 * 60_000) return null;
    return parsed;
  } catch {
    return null;
  }
}
