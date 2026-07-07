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
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return callbackUrl;
    }
  }

  return callbackUrl;
}

export function parseLoginContinueContext(callbackUrl?: string | null, invite?: string | null) {
  let destination = callbackUrl?.trim() || null;
  let providerInvite = invite?.trim() || null;

  while (destination) {
    const path = toCallbackPath(destination);
    if (!path.startsWith("/login/continue")) {
      break;
    }

    const nested = new URL(path, "http://localhost");
    providerInvite = providerInvite || nested.searchParams.get("invite");
    destination = nested.searchParams.get("callbackUrl");
  }

  return {
    destination,
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
