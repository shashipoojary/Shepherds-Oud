import { sanitizeCallbackPath } from "@/lib/auth/routes";

function decodeRedirectParam(value: string) {
  let decoded = value;
  for (let index = 0; index < 3; index += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

function toCallbackPath(callbackUrl: string) {
  if (callbackUrl.startsWith("http://") || callbackUrl.startsWith("https://")) {
    try {
      const parsed = new URL(callbackUrl);
      return sanitizeCallbackPath(`${parsed.pathname}${parsed.search}`) ?? null;
    } catch {
      return sanitizeCallbackPath(callbackUrl);
    }
  }

  return sanitizeCallbackPath(callbackUrl);
}

export function parseLoginContinueContext(callbackUrl?: string | null, invite?: string | null) {
  let destination = callbackUrl?.trim() || null;
  let providerInvite = invite?.trim() || null;

  while (destination) {
    const path = toCallbackPath(destination);
    if (!path || !path.startsWith("/login/continue")) {
      destination = path;
      break;
    }

    const nested = new URL(path, "http://localhost");
    providerInvite = providerInvite || nested.searchParams.get("invite");
    destination = nested.searchParams.get("callbackUrl");
  }

  return {
    destination: destination ? sanitizeCallbackPath(destination) : null,
    invite: providerInvite
  };
}

export function extractInviteFromRedirectUrl(url: string) {
  try {
    const parsed = new URL(url);
    const callbackURL = parsed.searchParams.get("callbackURL") || parsed.searchParams.get("callbackUrl");
    if (!callbackURL) {
      return null;
    }

    return parseLoginContinueContext(decodeRedirectParam(callbackURL), null).invite;
  } catch {
    return null;
  }
}
