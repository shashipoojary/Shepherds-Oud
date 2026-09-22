import { createHash, randomBytes } from "crypto";

export const TRIAGE_CLAIM_COOKIE = "so_v2_triage_claim";
export const TRIAGE_CLAIM_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function createAnonymousClaimToken() {
  return randomBytes(24).toString("base64url");
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createInviteToken() {
  return randomBytes(18).toString("base64url");
}
