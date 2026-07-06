"use client";

import { createAuthClient } from "better-auth/react";
import { customSessionClient, inferAdditionalFields, magicLinkClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth/config";

function getBaseURL() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return undefined;
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [inferAdditionalFields<typeof auth>(), magicLinkClient(), customSessionClient<typeof auth>()]
});
