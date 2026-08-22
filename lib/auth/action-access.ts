import type { AppRole } from "@/lib/auth/server";
import { getUserLinkedProvider } from "@/lib/providers/server";

const ADMIN_TARGET_TYPES = new Set(["intake", "waitlist", "announcement", "provider"]);
const PROVIDER_TARGET_TYPES = new Set(["provider"]);

/**
 * Ensures the caller may append an audit log for the given target.
 * Admins may log intake, waitlist, announcement, and provider events.
 * Providers may only log events for their own linked provider record.
 */
export async function canLogAction(
  role: AppRole,
  userId: string,
  targetType: string,
  targetId: string
) {
  if (role === "ADMIN") {
    return ADMIN_TARGET_TYPES.has(targetType);
  }

  if (role === "PROVIDER") {
    if (!PROVIDER_TARGET_TYPES.has(targetType)) {
      return false;
    }

    const linked = await getUserLinkedProvider(userId);
    return Boolean(linked && linked.id === targetId);
  }

  return false;
}
